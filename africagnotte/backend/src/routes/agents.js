const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// GET /api/agents/status — état des agents (admin)
router.get('/status', async (req, res) => {
  const { data: logs } = await supabase
    .from('agent_logs')
    .select('event, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  res.json({
    agents: [
      { name: 'Expiration',     schedule: 'Toutes les heures',    status: 'active' },
      { name: 'Rappel',         schedule: 'Chaque jour à 9h',     status: 'active' },
      { name: 'Fraude',         schedule: 'Toutes les 30 min',    status: 'active' },
      { name: 'Stats',          schedule: 'Toutes les 15 min',    status: 'active' },
      { name: 'Nettoyage',      schedule: 'Chaque jour à 2h',     status: 'active' },
      { name: 'Réconciliation', schedule: 'Toutes les 2 heures',  status: 'active' },
    ],
    recent_logs: logs || []
  });
});

module.exports = router;
