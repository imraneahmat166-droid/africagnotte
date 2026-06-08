const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

// GET /api/users/me
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error) {
    // Créer le profil s'il n'existe pas
    const { data: newProfile } = await supabase.from('profiles').insert({
      id: req.user.id,
      email: req.user.email,
      full_name: req.user.user_metadata?.full_name || req.user.email.split('@')[0],
      created_at: new Date().toISOString()
    }).select().single();
    return res.json(newProfile);
  }
  res.json(data);
});

// PATCH /api/users/me
router.patch('/me', requireAuth, async (req, res) => {
  const allowed = ['full_name', 'phone', 'country', 'city', 'bio', 'avatar_url'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('profiles').update(updates).eq('id', req.user.id).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/users/me/campaigns
router.get('/me/campaigns', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, title, slug, status, raised_amount, goal_amount, currency, donor_count, created_at')
    .eq('organizer_id', req.user.id)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/users/me/transactions
router.get('/me/transactions', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('transaction_id, amount, currency, status, payment_method, created_at, campaigns(title)')
    .eq('donor_email', req.user.email)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
