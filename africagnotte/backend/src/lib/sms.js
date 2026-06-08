/**
 * Service SMS — Notifications par SMS
 * Utilise Twilio avec fallback sur Africa's Talking (opérateurs locaux)
 * Africa's Talking supporte MTN, Orange, Airtel en Afrique Centrale
 */
const axios  = require('axios')
const logger = require('./logger')

// ─── Twilio ───────────────────────────────────────────────────────────────────
async function sendTwilio(to, message) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const from       = process.env.TWILIO_PHONE || '+15005550006'

  if (!accountSid || !authToken) throw new Error('Twilio non configuré')

  const resp = await axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    new URLSearchParams({ To: to, From: from, Body: message }),
    { auth: { username: accountSid, password: authToken }, timeout: 10000 }
  )
  return resp.data
}

// ─── Africa's Talking (opérateurs locaux — recommandé pour l'Afrique) ─────────
async function sendAfricasTalking(to, message) {
  const apiKey   = process.env.AT_API_KEY
  const username = process.env.AT_USERNAME || 'sandbox'

  if (!apiKey) throw new Error("Africa's Talking non configuré")

  const resp = await axios.post(
    'https://api.africastalking.com/version1/messaging',
    new URLSearchParams({ username, to, message, from: process.env.AT_SENDER_ID || '' }),
    {
      headers: {
        'apiKey': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      timeout: 10000
    }
  )
  return resp.data
}

// ─── Envoi principal avec fallback ────────────────────────────────────────────
async function sendSMS(phone, message) {
  // Normaliser le numéro (+237XXXXXXXXX)
  const normalized = phone.startsWith('+') ? phone : `+${phone}`

  try {
    // Priorité 1 : Africa's Talking (meilleure couverture locale)
    if (process.env.AT_API_KEY) {
      await sendAfricasTalking(normalized, message)
      logger.info(`SMS AT envoyé à ${normalized.slice(0, 8)}...`)
      return true
    }
    // Priorité 2 : Twilio
    if (process.env.TWILIO_ACCOUNT_SID) {
      await sendTwilio(normalized, message)
      logger.info(`SMS Twilio envoyé à ${normalized.slice(0, 8)}...`)
      return true
    }
    logger.warn('Aucun provider SMS configuré — SMS ignoré')
    return false
  } catch (err) {
    logger.error('Erreur envoi SMS', { phone: normalized.slice(0, 8), error: err.message })
    // Ne pas faire rater la transaction si SMS échoue
    return false
  }
}

// ─── Messages SMS prédéfinis ──────────────────────────────────────────────────
const sms = {
  donationConfirmed: (phone, { amount, currency, campaignTitle, txRef }) =>
    sendSMS(phone, `AfriCagnotte: Votre don de ${amount.toLocaleString()} ${currency} pour "${campaignTitle.slice(0,30)}" a ete recu. Ref: ${txRef}. Merci!`),

  newDonation: (phone, { amount, currency, donorName }) =>
    sendSMS(phone, `AfriCagnotte: Nouveau don de ${amount.toLocaleString()} ${currency} recu de ${donorName}. Consultez votre dashboard: africagnotte.com/dashboard`),

  withdrawalSent: (phone, { amount, currency }) =>
    sendSMS(phone, `AfriCagnotte: Virement de ${amount.toLocaleString()} ${currency} envoye sur votre Mobile Money. Disponible sous 24h.`),

  campaignExpiring: (phone, { daysLeft, campaignTitle }) =>
    sendSMS(phone, `AfriCagnotte: Votre cagnotte "${campaignTitle.slice(0,25)}" expire dans ${daysLeft} jour(s). Partagez-la pour maximiser les dons!`),

  otp: (phone, { code }) =>
    sendSMS(phone, `AfriCagnotte: Votre code de verification est ${code}. Valable 10 minutes. Ne le partagez pas.`),
}

module.exports = { sendSMS, sms }
