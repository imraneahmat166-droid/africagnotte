const { createClient } = require('@supabase/supabase-js');
const logger = require('../lib/logger');

// Client avec anon key pour vérifier les JWT utilisateurs
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Middleware d'authentification — vérifie le JWT Supabase
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

  if (error || !user) {
    logger.warn('Auth failed', { error: error?.message });
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }

  req.user = user;
  next();
}

/**
 * Middleware optionnel — enrichit req.user si token présent mais ne bloque pas
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user } } = await supabaseAuth.auth.getUser(token);
    if (user) req.user = user;
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
