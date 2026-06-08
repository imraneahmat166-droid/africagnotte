/**
 * Service CinetPay — Intégration complète
 * Mobile Money (MTN, Orange, Airtel) + Carte bancaire
 */
const axios = require('axios');
const crypto = require('crypto');
const logger = require('./logger');

const CINETPAY_BASE = process.env.CINETPAY_BASE_URL || 'https://api-checkout.cinetpay.com/v2';
const API_KEY = process.env.CINETPAY_API_KEY;
const SITE_ID = process.env.CINETPAY_SITE_ID;
const SECRET = process.env.CINETPAY_SECRET_KEY;

/**
 * Initier un paiement CinetPay
 * @param {Object} params
 * @param {string} params.transactionId  - ID unique de la transaction
 * @param {number} params.amount         - Montant en XAF (min 100)
 * @param {string} params.currency       - XAF | CDF | EUR
 * @param {string} params.description    - Description du don
 * @param {string} params.customerName   - Nom du donateur
 * @param {string} params.customerEmail  - Email du donateur
 * @param {string} params.customerPhone  - Téléphone (Mobile Money)
 * @param {string} params.paymentMethod  - MOBILE_MONEY | CREDIT_CARD
 * @param {string} params.returnUrl      - URL de retour après paiement
 * @param {string} params.notifyUrl      - URL du webhook
 */
async function initiatePayment(params) {
  const payload = {
    apikey: API_KEY,
    site_id: SITE_ID,
    transaction_id: params.transactionId,
    amount: params.amount,
    currency: params.currency || 'XAF',
    alternative_currency: '',
    description: params.description,
    customer_name: params.customerName,
    customer_surname: params.customerSurname || '',
    customer_email: params.customerEmail,
    customer_phone_number: params.customerPhone,
    customer_address: params.customerAddress || '',
    customer_city: params.customerCity || '',
    customer_country: params.customerCountry || 'CM',
    customer_state: params.customerState || '',
    customer_zip_code: params.customerZip || '',
    notify_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
    return_url: `${process.env.FRONTEND_URL}/payment/success?tx=${params.transactionId}`,
    channels: params.paymentMethod === 'card' ? 'CREDIT_CARD' : 'MOBILE_MONEY',
    metadata: JSON.stringify({ campaign_id: params.campaignId, donor_id: params.donorId }),
    lang: 'fr',
    invoice_data: {}
  };

  try {
    const response = await axios.post(`${CINETPAY_BASE}/payment`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    const data = response.data;

    if (data.code === '201') {
      return {
        success: true,
        paymentUrl: data.data.payment_url,
        payToken: data.data.pay_token,
        transactionId: params.transactionId
      };
    } else {
      logger.error('CinetPay error', { code: data.code, message: data.message, data });
      return { success: false, error: data.message || 'Erreur CinetPay', code: data.code };
    }
  } catch (err) {
    logger.error('CinetPay request failed', { error: err.message });
    throw new Error(`Erreur de connexion CinetPay: ${err.message}`);
  }
}

/**
 * Vérifier le statut d'une transaction
 */
async function checkTransactionStatus(transactionId) {
  try {
    const response = await axios.post(`${CINETPAY_BASE}/payment/check`, {
      apikey: API_KEY,
      site_id: SITE_ID,
      transaction_id: transactionId
    }, { timeout: 10000 });

    const data = response.data;
    return {
      success: data.code === '00',
      status: data.data?.status,
      amount: data.data?.amount,
      currency: data.data?.currency,
      paymentMethod: data.data?.payment_method,
      operatorId: data.data?.operator_id,
      raw: data
    };
  } catch (err) {
    logger.error('CinetPay check failed', { transactionId, error: err.message });
    throw err;
  }
}

/**
 * Vérifier la signature du webhook CinetPay
 */
function verifyWebhookSignature(rawBody, signature) {
  if (!SECRET) return true; // Skip en dev sans secret
  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature || ''),
    Buffer.from(expected)
  );
}

/**
 * Demander un virement (retrait) vers Mobile Money
 */
async function requestWithdrawal(params) {
  const payload = {
    apikey: API_KEY,
    site_id: SITE_ID,
    transaction_id: params.transactionId,
    amount: params.amount,
    currency: params.currency || 'XAF',
    client_name: params.recipientName,
    client_msisdn: params.phone,
    channel: params.channel || 'MTN', // MTN | ORANGE | AIRTEL
    notify_url: `${process.env.BACKEND_URL}/api/withdrawals/webhook`,
    lang: 'fr',
    comment: params.comment || 'Retrait AfriCagnotte'
  };

  try {
    const response = await axios.post(`${CINETPAY_BASE}/transfer/money/send/contact`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    return response.data;
  } catch (err) {
    logger.error('Withdrawal request failed', { error: err.message });
    throw err;
  }
}

module.exports = { initiatePayment, checkTransactionStatus, verifyWebhookSignature, requestWithdrawal };
