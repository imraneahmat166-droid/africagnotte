/**
 * Agent Rappel — emails de rappel avant fin de cagnotte
 */
const supabase = require('../lib/supabase');
const mailer   = require('../lib/mailer');
const { checkTransactionStatus } = require('../lib/cinetpay');
const logger   = require('../lib/logger');

// ─── Agent Rappel ─────────────────────────────────────────────────────────────
const reminderAgent = {
  async run() {
    let sent = 0;
    const REMINDER_DAYS = [7, 3, 1];

    for (const days of REMINDER_DAYS) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const dateStr = targetDate.toISOString().split('T')[0];

      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, title, raised_amount, goal_amount, currency, organizer_id, profiles:organizer_id(full_name, email)')
        .eq('status', 'active')
        .like('end_date', `${dateStr}%`);

      if (!campaigns?.length) continue;

      for (const c of campaigns) {
        // Vérifier qu'on n'a pas déjà envoyé ce rappel
        const { data: existing } = await supabase
          .from('agent_logs')
          .select('id')
          .eq('campaign_id', c.id)
          .eq('event', `reminder_${days}d`)
          .single();

        if (existing) continue;

        if (c.profiles?.email) {
          await mailer.campaignExpiringSoon(c.profiles.email, {
            organizer: c.profiles.full_name,
            campaignTitle: c.title,
            daysLeft: days,
            raised: c.raised_amount,
            goal: c.goal_amount,
            currency: c.currency
          });
        }

        // Log pour éviter les doublons
        await supabase.from('agent_logs').insert({
          campaign_id: c.id, event: `reminder_${days}d`,
          created_at: new Date().toISOString()
        });
        sent++;
      }
    }
    return { sent };
  }
};

// ─── Agent Fraude ─────────────────────────────────────────────────────────────
const fraudAgent = {
  async run() {
    let flagged = 0;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const threshold = parseInt(process.env.AGENT_FRAUD_THRESHOLD || '5');

    // Détecter > N dons depuis le même email en 1h
    const { data: suspicious } = await supabase.rpc('detect_suspicious_donations', {
      p_since: oneHourAgo,
      p_threshold: threshold
    });

    if (suspicious?.length) {
      for (const entry of suspicious) {
        logger.warn('[Fraude] Activité suspecte', entry);

        // Suspendre temporairement si > 10 tentatives
        if (entry.count > 10) {
          await supabase.from('fraud_flags').insert({
            donor_email: entry.donor_email,
            reason: `${entry.count} dons en 1h`,
            flagged_at: new Date().toISOString(),
            resolved: false
          });
        }
        flagged++;
      }
    }

    // Détecter les montants ronds suspects (ex: 999999 XAF)
    const { data: roundAmounts } = await supabase
      .from('transactions')
      .select('id, amount, donor_email')
      .gt('amount', 500000)
      .eq('status', 'completed')
      .gte('created_at', oneHourAgo);

    if (roundAmounts?.length) {
      logger.info('[Fraude] Grands dons détectés pour vérification', { count: roundAmounts.length });
    }

    return { flagged };
  }
};

// ─── Agent Stats ─────────────────────────────────────────────────────────────
const statsAgent = {
  async run() {
    // Calculer et mettre à jour les stats globales
    const [
      { count: totalCampaigns },
      { count: activeCampaigns },
      { data: totals }
    ] = await Promise.all([
      supabase.from('campaigns').select('*', { count: 'exact', head: true }),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('transactions').select('amount').eq('status', 'completed')
    ]);

    const totalRaised = (totals || []).reduce((sum, t) => sum + (t.amount || 0), 0);

    await supabase.from('platform_stats').upsert({
      id: 'global',
      total_campaigns: totalCampaigns,
      active_campaigns: activeCampaigns,
      total_raised: totalRaised,
      updated_at: new Date().toISOString()
    });

    return { totalCampaigns, activeCampaigns, totalRaised };
  }
};

// ─── Agent Nettoyage ─────────────────────────────────────────────────────────
const cleanupAgent = {
  async run() {
    let cleaned = 0;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Supprimer les transactions pending > 30 jours
    const { count } = await supabase
      .from('transactions')
      .delete()
      .eq('status', 'pending')
      .lt('created_at', thirtyDaysAgo);

    cleaned += count || 0;

    // Purger les logs d'agents > 90 jours
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('agent_logs').delete().lt('created_at', ninetyDaysAgo);

    logger.info('[Agent Cleanup] Nettoyage terminé', { cleaned });
    return { cleaned };
  }
};

// ─── Agent Réconciliation ─────────────────────────────────────────────────────
const reconciliationAgent = {
  async run() {
    let reconciled = 0;
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    // Trouver les transactions pending > 2h
    const { data: pending } = await supabase
      .from('transactions')
      .select('id, transaction_id, amount, campaign_id')
      .eq('status', 'pending')
      .lt('created_at', twoHoursAgo);

    if (!pending?.length) return { reconciled: 0 };

    for (const tx of pending) {
      try {
        const status = await checkTransactionStatus(tx.transaction_id);

        if (status.status === 'ACCEPTED') {
          // Marquer comme complété
          await supabase.from('transactions')
            .update({ status: 'completed', reconciled_at: new Date().toISOString() })
            .eq('id', tx.id);
          reconciled++;
        } else if (['REFUSED', 'CANCELLED', 'ERROR'].includes(status.status)) {
          await supabase.from('transactions')
            .update({ status: 'failed', error_message: `Réconcilié: ${status.status}` })
            .eq('id', tx.id);
          reconciled++;
        }
        // Si toujours PENDING chez CinetPay, on attend encore
      } catch (err) {
        logger.error('[Réconciliation] Erreur vérification', { txId: tx.transaction_id, error: err.message });
      }
    }

    return { reconciled, checked: pending.length };
  }
};

module.exports = reminderAgent;
module.exports.fraudAgent         = fraudAgent;
module.exports.statsAgent         = statsAgent;
module.exports.cleanupAgent       = cleanupAgent;
module.exports.reconciliationAgent= reconciliationAgent;
