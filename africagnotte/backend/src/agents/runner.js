/**
 * ╔══════════════════════════════════════════════════════╗
 * ║     AfriCagnotte — Agents Automatisés                ║
 * ║     Gestion autonome de la plateforme 24/7           ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Agents disponibles :
 *   🤖 Agent Expiration    — expire les cagnottes terminées
 *   🤖 Agent Rappel        — envoie des emails de rappel avant fin
 *   🤖 Agent Fraude        — détecte et signale les paiements suspects
 *   🤖 Agent Stats         — met à jour les statistiques globales
 *   🤖 Agent Nettoyage     — purge les transactions expirées
 *   🤖 Agent Réconciliation— vérifie les paiements pending trop longs
 */
const cron = require('node-cron');
const logger = require('../lib/logger');

const expirationAgent    = require('./expiration');
const reminderAgent      = require('./reminder');
const fraudAgent         = require('./fraud');
const statsAgent         = require('./stats');
const cleanupAgent       = require('./cleanup');
const reconciliationAgent= require('./reconciliation');

let agentsStarted = false;

function startAgents() {
  if (agentsStarted) return;
  agentsStarted = true;

  logger.info('🤖 Démarrage des agents automatisés AfriCagnotte...');

  // ─── Agent Expiration ────────────────────────────────
  // Toutes les heures — expire les cagnottes dont la date est passée
  cron.schedule('0 * * * *', async () => {
    logger.info('[Agent Expiration] Démarrage...');
    try {
      const result = await expirationAgent.run();
      logger.info('[Agent Expiration] ✅ Terminé', result);
    } catch (err) {
      logger.error('[Agent Expiration] ❌ Erreur', { error: err.message });
    }
  });

  // ─── Agent Rappel ────────────────────────────────────
  // Chaque jour à 9h00 — rappels J-7, J-3, J-1
  cron.schedule('0 9 * * *', async () => {
    logger.info('[Agent Rappel] Démarrage...');
    try {
      const result = await reminderAgent.run();
      logger.info('[Agent Rappel] ✅ Terminé', result);
    } catch (err) {
      logger.error('[Agent Rappel] ❌ Erreur', { error: err.message });
    }
  });

  // ─── Agent Fraude ─────────────────────────────────────
  // Toutes les 30 minutes — détecte les activités suspectes
  cron.schedule('*/30 * * * *', async () => {
    try {
      const result = await fraudAgent.run();
      if (result.flagged > 0) {
        logger.warn('[Agent Fraude] ⚠️ Activité suspecte détectée', result);
      }
    } catch (err) {
      logger.error('[Agent Fraude] ❌ Erreur', { error: err.message });
    }
  });

  // ─── Agent Stats ─────────────────────────────────────
  // Toutes les 15 minutes — met à jour les stats globales
  cron.schedule('*/15 * * * *', async () => {
    try {
      await statsAgent.run();
    } catch (err) {
      logger.error('[Agent Stats] ❌ Erreur', { error: err.message });
    }
  });

  // ─── Agent Nettoyage ─────────────────────────────────
  // Tous les jours à 2h00 — purge les données obsolètes
  cron.schedule('0 2 * * *', async () => {
    logger.info('[Agent Nettoyage] Démarrage...');
    try {
      const result = await cleanupAgent.run();
      logger.info('[Agent Nettoyage] ✅ Terminé', result);
    } catch (err) {
      logger.error('[Agent Nettoyage] ❌ Erreur', { error: err.message });
    }
  });

  // ─── Agent Réconciliation ─────────────────────────────
  // Toutes les 2 heures — vérifie les paiements pending > 2h
  cron.schedule('0 */2 * * *', async () => {
    logger.info('[Agent Réconciliation] Démarrage...');
    try {
      const result = await reconciliationAgent.run();
      if (result.reconciled > 0) {
        logger.info('[Agent Réconciliation] ✅ Transactions réconciliées', result);
      }
    } catch (err) {
      logger.error('[Agent Réconciliation] ❌ Erreur', { error: err.message });
    }
  });

  logger.info('✅ Tous les agents sont actifs');
}

module.exports = { startAgents };
