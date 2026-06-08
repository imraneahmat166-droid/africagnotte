const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../lib/supabase');
const { requestWithdrawal } = require('../lib/cinetpay');
const mailer = require('../lib/mailer');
const { requireAuth } = require('../middleware/auth');
const logger = require('../lib/logger');

// POST /api/withdrawals — Demander un retrait
router.post('/', requireAuth, async (req, res) => {
  try {
    const { campaign_id, amount } = req.body;

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*, profiles:organizer_id(full_name, email)')
      .eq('id', campaign_id)
      .single();

    if (!campaign) return res.status(404).json({ error: 'Cagnotte introuvable' });
    if (campaign.organizer_id !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });

    const available = campaign.raised_amount - (campaign.withdrawn_amount || 0);
    if (amount > available) {
      return res.status(400).json({ error: `Montant disponible: ${available} ${campaign.currency}` });
    }
    if (amount < 5000) return res.status(400).json({ error: 'Retrait minimum: 5 000 XAF' });

    const txId = `WD-${Date.now()}-${uuidv4().slice(0,6).toUpperCase()}`;

    const { data: wd } = await supabase.from('withdrawals').insert({
      id: uuidv4(), transaction_id: txId, campaign_id,
      organizer_id: req.user.id, amount,
      currency: campaign.currency,
      phone: campaign.withdrawal_phone,
      operator: campaign.withdrawal_operator,
      status: 'pending',
      created_at: new Date().toISOString()
    }).select().single();

    // Appel CinetPay Transfer
    const result = await requestWithdrawal({
      transactionId: txId,
      amount,
      currency: campaign.currency,
      recipientName: campaign.profiles.full_name,
      phone: campaign.withdrawal_phone,
      channel: campaign.withdrawal_operator || 'MTN',
      comment: `Retrait AfriCagnotte - ${campaign.title.slice(0,30)}`
    });

    if (result.code === '0') {
      await supabase.from('withdrawals').update({ status: 'processing', cinetpay_ref: result.data?.reference }).eq('id', wd.id);
      await supabase.from('campaigns').update({ withdrawn_amount: (campaign.withdrawn_amount||0) + amount }).eq('id', campaign_id);

      await mailer.withdrawalProcessed(campaign.profiles.email, {
        name: campaign.profiles.full_name,
        amount, currency: campaign.currency,
        phone: campaign.withdrawal_phone,
        ref: txId
      });

      res.json({ success: true, transaction_id: txId, message: 'Virement en cours de traitement' });
    } else {
      await supabase.from('withdrawals').update({ status: 'failed', error: result.message }).eq('id', wd.id);
      res.status(400).json({ error: result.message || 'Erreur lors du virement' });
    }
  } catch (err) {
    logger.error('Withdrawal error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
