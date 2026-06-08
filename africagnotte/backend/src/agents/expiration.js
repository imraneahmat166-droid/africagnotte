/**
 * Agent Expiration
 * Expire les cagnottes dont end_date est dépassée
 * S'exécute toutes les heures
 */
const supabase = require('../lib/supabase');
const mailer = require('../lib/mailer');
const logger = require('../lib/logger');

async function run() {
  const now = new Date().toISOString();
  let expired = 0;

  // Trouver toutes les cagnottes actives dont la date est passée
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('id, title, raised_amount, goal_amount, currency, organizer_id, profiles:organizer_id(full_name, email)')
    .eq('status', 'active')
    .not('end_date', 'is', null)
    .lt('end_date', now);

  if (error) throw error;
  if (!campaigns?.length) return { expired: 0 };

  for (const campaign of campaigns) {
    await supabase.from('campaigns')
      .update({ status: 'ended', ended_at: now })
      .eq('id', campaign.id);

    // Notifier l'organisateur
    if (campaign.profiles?.email) {
      const pct = Math.round(campaign.raised_amount / campaign.goal_amount * 100);
      await mailer.send(
        campaign.profiles.email,
        `📅 Votre cagnotte "${campaign.title.slice(0,30)}..." est terminée`,
        `<p>Bonjour ${campaign.profiles.full_name},</p>
        <p>Votre cagnotte <strong>"${campaign.title}"</strong> est arrivée à terme.</p>
        <p>Résultat : <strong>${campaign.raised_amount.toLocaleString()} ${campaign.currency}</strong>
        collectés (${pct}% de l'objectif).</p>
        <p>Vous pouvez demander le retrait des fonds depuis votre dashboard.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard" style="background:#1D9E75;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px">
          Accéder au dashboard
        </a>`
      );
    }

    logger.info(`[Agent Expiration] Cagnotte expirée: ${campaign.title}`, {
      id: campaign.id, raised: campaign.raised_amount
    });
    expired++;
  }

  return { expired };
}

module.exports = { run };
