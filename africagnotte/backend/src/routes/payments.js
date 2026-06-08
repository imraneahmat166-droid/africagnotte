const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../lib/supabase');
const { initiatePayment, checkTransactionStatus, verifyWebhookSignature } = require('../lib/cinetpay');
const mailer = require('../lib/mailer');
const logger = require('../lib/logger');

// POST /api/payments/initiate — Lancer un paiement CinetPay
router.post('/initiate', async (req, res) => {
  try {
    const {
      campaign_id, campaign_slug,
      amount, currency = 'XAF',
      donor_name, donor_surname = '', donor_email,
      donor_phone, donor_country = 'CM',
      payment_method = 'mtn', // mtn | orange | airtel | card
      anonymous = false, message = ''
    } = req.body;

    // Validation
    if (!campaign_id || !amount || !donor_email || !donor_name) {
      return res.status(400).json({ error: 'Champs requis: campaign_id, amount, donor_email, donor_name' });
    }
    if (amount < 100) {
      return res.status(400).json({ error: 'Montant minimum: 100 XAF' });
    }

    // Vérifier la cagnotte existe et est active
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('id, title, status, organizer_id, raised_amount, goal_amount, currency')
      .eq('id', campaign_id)
      .single();

    if (campErr || !campaign) {
      return res.status(404).json({ error: 'Cagnotte introuvable' });
    }
    if (campaign.status !== 'active') {
      return res.status(400).json({ error: `Cette cagnotte n'est pas active (statut: ${campaign.status})` });
    }

    const transactionId = `AC-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
    const fees = Math.round(amount * 0.02); // 2% frais plateforme

    // Enregistrer la transaction en pending
    const { data: txData, error: txErr } = await supabase
      .from('transactions')
      .insert({
        id: uuidv4(),
        transaction_id: transactionId,
        campaign_id,
        amount,
        fees,
        net_amount: amount - fees,
        currency,
        donor_name,
        donor_surname,
        donor_email,
        donor_phone,
        donor_country,
        payment_method,
        anonymous,
        message,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (txErr) throw txErr;

    // Mapper la méthode de paiement
    const methodMap = { mtn: 'MOBILE_MONEY', orange: 'MOBILE_MONEY', airtel: 'MOBILE_MONEY', card: 'CREDIT_CARD' };

    // Appel CinetPay
    const payResult = await initiatePayment({
      transactionId,
      amount,
      currency,
      description: `Don pour: ${campaign.title.slice(0, 50)}`,
      customerName: donor_name,
      customerSurname: donor_surname,
      customerEmail: donor_email,
      customerPhone: donor_phone,
      customerCountry: donor_country,
      paymentMethod: methodMap[payment_method] || 'MOBILE_MONEY',
      campaignId: campaign_id,
      donorId: txData.id
    });

    if (!payResult.success) {
      // Marquer transaction comme échouée
      await supabase.from('transactions')
        .update({ status: 'failed', error_message: payResult.error })
        .eq('id', txData.id);
      return res.status(400).json({ error: payResult.error, code: payResult.code });
    }

    // Mettre à jour avec le pay_token
    await supabase.from('transactions')
      .update({ pay_token: payResult.payToken, cinetpay_status: 'initiated' })
      .eq('id', txData.id);

    logger.info('Paiement initié', { transactionId, amount, method: payment_method, campaign: campaign.title });

    res.json({
      success: true,
      payment_url: payResult.paymentUrl,
      transaction_id: transactionId,
      pay_token: payResult.payToken,
      amount,
      fees,
      total: amount + fees,
      currency
    });
  } catch (err) {
    logger.error('POST /payments/initiate error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/webhook — Callback CinetPay (IPN)
router.post('/webhook', async (req, res) => {
  // Vérifier signature
  const signature = req.headers['x-cinetpay-signature'];
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));

  if (!verifyWebhookSignature(rawBody, signature)) {
    logger.warn('Webhook signature invalide');
    return res.status(401).json({ error: 'Signature invalide' });
  }

  const body = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;
  const { cpm_trans_id: transactionId, cpm_result, cpm_amount, cpm_currency, cpm_payment_config } = body;

  logger.info('Webhook CinetPay reçu', { transactionId, result: cpm_result });

  try {
    // Double vérification auprès de CinetPay
    const verification = await checkTransactionStatus(transactionId);

    const { data: tx } = await supabase
      .from('transactions')
      .select('*, campaigns(*)')
      .eq('transaction_id', transactionId)
      .single();

    if (!tx) {
      logger.warn('Transaction introuvable dans webhook', { transactionId });
      return res.status(404).json({ error: 'Transaction introuvable' });
    }

    // Éviter le traitement en double
    if (tx.status === 'completed') {
      return res.json({ message: 'Déjà traité' });
    }

    if (cpm_result === '00' && verification.status === 'ACCEPTED') {
      // ✅ PAIEMENT ACCEPTÉ
      const { error: updateErr } = await supabase.from('transactions')
        .update({
          status: 'completed',
          cinetpay_status: 'ACCEPTED',
          payment_method_detail: cpm_payment_config,
          completed_at: new Date().toISOString()
        })
        .eq('transaction_id', transactionId);

      if (updateErr) throw updateErr;

      // Mettre à jour la cagnotte
      const newRaised = (tx.campaigns.raised_amount || 0) + tx.net_amount;
      const newDonorCount = (tx.campaigns.donor_count || 0) + 1;

      await supabase.from('campaigns')
        .update({
          raised_amount: newRaised,
          donor_count: newDonorCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', tx.campaign_id);

      // Insérer le don publique
      await supabase.from('donations').insert({
        id: uuidv4(),
        campaign_id: tx.campaign_id,
        transaction_id: tx.id,
        amount: tx.net_amount,
        currency: tx.currency,
        donor_name: tx.donor_name,
        donor_email: tx.donor_email,
        anonymous: tx.anonymous,
        message: tx.message,
        created_at: new Date().toISOString()
      });

      // Emails de confirmation
      await mailer.donationConfirmed(tx.donor_email, {
        donorName: tx.donor_name,
        amount: tx.amount,
        currency: tx.currency,
        campaignTitle: tx.campaigns.title,
        txRef: transactionId
      });

      // Notifier l'organisateur
      const { data: organizer } = await supabase
        .from('profiles').select('full_name, email').eq('id', tx.campaigns.organizer_id).single();

      if (organizer?.email) {
        await mailer.newDonation(organizer.email, {
          organizer: organizer.full_name,
          donorName: tx.anonymous ? 'Anonyme' : tx.donor_name,
          amount: tx.net_amount,
          currency: tx.currency,
          campaignTitle: tx.campaigns.title,
          total: newRaised
        });
      }

      // Vérifier si objectif atteint
      if (newRaised >= tx.campaigns.goal_amount && tx.campaigns.raised_amount < tx.campaigns.goal_amount) {
        if (organizer?.email) {
          await mailer.goalReached(organizer.email, {
            organizer: organizer.full_name,
            campaignTitle: tx.campaigns.title,
            amount: tx.campaigns.goal_amount,
            currency: tx.campaigns.currency
          });
        }
        await supabase.from('campaigns')
          .update({ goal_reached_at: new Date().toISOString() })
          .eq('id', tx.campaign_id);
      }

      logger.info('Don traité avec succès', { transactionId, amount: tx.net_amount });
    } else {
      // ❌ PAIEMENT ÉCHOUÉ / ANNULÉ
      await supabase.from('transactions')
        .update({
          status: cpm_result === 'CANCELLED' ? 'cancelled' : 'failed',
          error_message: `CinetPay result: ${cpm_result}`,
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', transactionId);

      logger.info('Paiement refusé', { transactionId, result: cpm_result });
    }

    res.json({ message: 'OK' });
  } catch (err) {
    logger.error('Webhook processing error', { error: err.message, transactionId });
    res.status(500).json({ error: 'Erreur traitement webhook' });
  }
});

// GET /api/payments/status/:txId — Vérifier le statut
router.get('/status/:txId', async (req, res) => {
  try {
    const { data } = await supabase
      .from('transactions')
      .select('status, amount, currency, completed_at, campaign_id')
      .eq('transaction_id', req.params.txId)
      .single();

    if (!data) return res.status(404).json({ error: 'Transaction introuvable' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
