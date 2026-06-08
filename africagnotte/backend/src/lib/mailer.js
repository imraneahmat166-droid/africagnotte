const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

const BASE_STYLE = `
  font-family:'Segoe UI',Arial,sans-serif;
  background:#f9f8f5;padding:0;margin:0;
`;
const CARD_STYLE = `
  max-width:520px;margin:32px auto;
  background:#fff;border-radius:12px;
  border:1px solid #e5e5e5;overflow:hidden;
`;
const HEADER_STYLE = `
  background:linear-gradient(135deg,#085041,#1D9E75);
  padding:24px 32px;color:#fff;
`;
const BODY_STYLE = `padding:28px 32px;`;
const BTN_STYLE = `
  display:inline-block;padding:12px 28px;
  background:#1D9E75;color:#fff;
  border-radius:8px;text-decoration:none;
  font-weight:600;font-size:15px;margin:16px 0;
`;

function template(title, bodyHtml) {
  return `
  <!DOCTYPE html><html><body style="${BASE_STYLE}">
  <div style="${CARD_STYLE}">
    <div style="${HEADER_STYLE}">
      <div style="font-size:22px;font-weight:700">🌍 AfriCagnotte</div>
      <div style="opacity:.85;font-size:14px;margin-top:4px">${title}</div>
    </div>
    <div style="${BODY_STYLE}">${bodyHtml}</div>
    <div style="padding:16px 32px;background:#f9f8f5;text-align:center;font-size:12px;color:#888">
      AfriCagnotte · <a href="${process.env.FRONTEND_URL}" style="color:#1D9E75">africagnotte.com</a>
      · <a href="${process.env.FRONTEND_URL}/unsubscribe" style="color:#888">Se désabonner</a>
    </div>
  </div></body></html>`;
}

async function send(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: `"AfriCagnotte" <${process.env.SMTP_USER}>`,
      to, subject, html
    });
    logger.info(`Email envoyé à ${to}`, { messageId: info.messageId });
    return true;
  } catch (err) {
    logger.error('Email error', { to, error: err.message });
    return false;
  }
}

const emails = {
  // Confirmation don
  donationConfirmed: (to, { donorName, amount, currency, campaignTitle, txRef }) =>
    send(to, `✅ Votre don de ${amount.toLocaleString()} ${currency} a été reçu`, template(
      'Confirmation de don',
      `<p>Bonjour <strong>${donorName}</strong>,</p>
      <p>Votre don de <strong style="color:#1D9E75">${amount.toLocaleString()} ${currency}</strong>
      pour la cagnotte <em>"${campaignTitle}"</em> a bien été reçu.</p>
      <p style="background:#E1F5EE;border-radius:8px;padding:12px 16px;font-size:13px">
        📄 Référence : <strong>${txRef}</strong>
      </p>
      <p>Merci pour votre générosité ! Votre soutien fait une vraie différence.</p>
      <a href="${process.env.FRONTEND_URL}/campaigns" style="${BTN_STYLE}">Voir la cagnotte</a>`
    )),

  // Notification organisateur — nouveau don
  newDonation: (to, { organizer, donorName, amount, currency, campaignTitle, total }) =>
    send(to, `💚 Nouveau don de ${amount.toLocaleString()} ${currency} reçu !`, template(
      'Nouveau don reçu',
      `<p>Bonjour <strong>${organizer}</strong>,</p>
      <p><strong>${donorName}</strong> vient de faire un don de
      <strong style="color:#1D9E75">${amount.toLocaleString()} ${currency}</strong>
      pour votre cagnotte <em>"${campaignTitle}"</em>.</p>
      <p>Total collecté : <strong style="font-size:1.2em;color:#0F6E56">${total.toLocaleString()} ${currency}</strong></p>
      <a href="${process.env.FRONTEND_URL}/dashboard" style="${BTN_STYLE}">Voir mon dashboard</a>`
    )),

  // Rappel fin de campagne
  campaignExpiringSoon: (to, { organizer, campaignTitle, daysLeft, raised, goal, currency }) =>
    send(to, `⏰ Votre cagnotte expire dans ${daysLeft} jours`, template(
      'Rappel d\'expiration',
      `<p>Bonjour <strong>${organizer}</strong>,</p>
      <p>Votre cagnotte <em>"${campaignTitle}"</em> expire dans <strong>${daysLeft} jours</strong>.</p>
      <p>Vous avez collecté <strong>${raised.toLocaleString()} ${currency}</strong>
      sur <strong>${goal.toLocaleString()} ${currency}</strong>
      (${Math.round(raised/goal*100)}%).</p>
      <p>Partagez votre lien pour maximiser les dons avant la fin !</p>
      <a href="${process.env.FRONTEND_URL}/dashboard" style="${BTN_STYLE}">Gérer ma cagnotte</a>`
    )),

  // Objectif atteint
  goalReached: (to, { organizer, campaignTitle, amount, currency }) =>
    send(to, `🎉 Félicitations ! Objectif atteint pour "${campaignTitle}"`, template(
      '🎉 Objectif atteint !',
      `<p>Bonjour <strong>${organizer}</strong>,</p>
      <p>Incroyable ! Votre cagnotte <em>"${campaignTitle}"</em> a atteint son objectif de
      <strong style="color:#1D9E75">${amount.toLocaleString()} ${currency}</strong> !</p>
      <p>Vous pouvez maintenant demander le virement des fonds collectés.</p>
      <a href="${process.env.FRONTEND_URL}/dashboard/withdraw" style="${BTN_STYLE}">Retirer mes fonds</a>`
    )),

  // Virement effectué
  withdrawalProcessed: (to, { name, amount, currency, phone, ref }) =>
    send(to, `💰 Virement de ${amount.toLocaleString()} ${currency} effectué`, template(
      'Virement effectué',
      `<p>Bonjour <strong>${name}</strong>,</p>
      <p>Un virement de <strong>${amount.toLocaleString()} ${currency}</strong>
      a été effectué vers votre numéro Mobile Money <strong>${phone}</strong>.</p>
      <p style="background:#E1F5EEA;border-radius:8px;padding:12px 16px;font-size:13px">
        Référence : <strong>${ref}</strong>
      </p>
      <p>Le montant peut prendre jusqu'à 24h pour apparaître sur votre compte.</p>`
    )),
};

module.exports = emails;
