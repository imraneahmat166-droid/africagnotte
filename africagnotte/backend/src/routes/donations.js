// ─── donations.js ────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// GET /api/donations?campaign_id=xxx
router.get('/', async (req, res) => {
  const { campaign_id, limit = 20, offset = 0 } = req.query;
  if (!campaign_id) return res.status(400).json({ error: 'campaign_id requis' });

  const { data, error } = await supabase
    .from('donations')
    .select('id, amount, currency, donor_name, message, anonymous, created_at')
    .eq('campaign_id', campaign_id)
    .order('created_at', { ascending: false })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
