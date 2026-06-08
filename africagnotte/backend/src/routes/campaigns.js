const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../lib/supabase');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const logger = require('../lib/logger');

// GET /api/campaigns — Liste avec filtres
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, country, status = 'active', limit = 20, offset = 0, search } = req.query;

    let query = supabase
      .from('campaigns')
      .select(`
        id, title, slug, description, category, country, city,
        goal_amount, raised_amount, currency, donor_count,
        cover_emoji, status, end_date, created_at,
        profiles:organizer_id ( id, full_name, avatar_url, verified )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (category) query = query.eq('category', category);
    if (country)  query = query.eq('country', country);
    if (search)   query = query.ilike('title', `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ campaigns: data, total: count, offset, limit });
  } catch (err) {
    logger.error('GET /campaigns error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/campaigns/:slug — Détail d'une cagnotte
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        profiles:organizer_id ( id, full_name, avatar_url, verified, phone_country ),
        donations ( id, amount, currency, donor_name, anonymous, created_at, message )
      `)
      .eq('slug', req.params.slug)
      .neq('status', 'deleted')
      .single();

    if (error || !data) return res.status(404).json({ error: 'Cagnotte introuvable' });

    // Incrémenter les vues
    await supabase.from('campaigns')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id);

    // Masquer les dons anonymes
    data.donations = (data.donations || []).map(d => ({
      ...d,
      donor_name: d.anonymous ? 'Anonyme' : d.donor_name
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/campaigns — Créer une cagnotte
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      title, description, category, country, city,
      goal_amount, currency = 'XAF', end_date,
      cover_emoji, cover_image_url,
      withdrawal_phone, withdrawal_operator, withdrawal_country_code
    } = req.body;

    // Validation
    if (!title || !description || !goal_amount || !category) {
      return res.status(400).json({ error: 'Champs obligatoires manquants: title, description, goal_amount, category' });
    }
    if (goal_amount < 1000) {
      return res.status(400).json({ error: 'Objectif minimum: 1 000 XAF' });
    }

    // Générer un slug unique
    const baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50);
    const slug = `${baseSlug}-${uuidv4().slice(0, 6)}`;

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        id: uuidv4(),
        organizer_id: req.user.id,
        title, description, category, country, city,
        goal_amount, raised_amount: 0, currency,
        end_date: end_date || null,
        cover_emoji: cover_emoji || '🌍',
        cover_image_url: cover_image_url || null,
        slug, status: 'pending_review',
        withdrawal_phone, withdrawal_operator,
        withdrawal_country_code,
        donor_count: 0, view_count: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('Cagnotte créée', { id: data.id, slug, organizer: req.user.id });
    res.status(201).json(data);
  } catch (err) {
    logger.error('POST /campaigns error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/campaigns/:id — Modifier (organisateur uniquement)
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est le propriétaire
    const { data: existing } = await supabase
      .from('campaigns').select('organizer_id').eq('id', req.params.id).single();

    if (!existing || existing.organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const allowed = ['title', 'description', 'cover_emoji', 'cover_image_url', 'end_date'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('campaigns').update(updates).eq('id', req.params.id).select().single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/campaigns/:id — Soft delete
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('campaigns').select('organizer_id, raised_amount').eq('id', req.params.id).single();

    if (!existing || existing.organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    if (existing.raised_amount > 0) {
      return res.status(400).json({ error: 'Impossible de supprimer une cagnotte avec des dons' });
    }

    await supabase.from('campaigns').update({ status: 'deleted' }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
