/**
 * Routes Admin — Panneau d'administration AfriCagnotte
 * Accès restreint aux administrateurs (role: admin dans profiles)
 */
const express  = require('express')
const router   = express.Router()
const supabase = require('../lib/supabase')
const mailer   = require('../lib/mailer')
const logger   = require('../lib/logger')
const { requireAuth } = require('../middleware/auth')

// ─── Middleware admin ──────────────────────────────────────────────────────────
async function requireAdmin(req, res, next) {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', req.user.id)
    .single()

  if (!data || data.role !== 'admin') {
    return res.status(403).json({ error: 'Accès administrateur requis' })
  }
  next()
}

router.use(requireAuth)
router.use(requireAdmin)

// ─── Dashboard admin ──────────────────────────────────────────────────────────
// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [
      { count: totalCampaigns },
      { count: pendingCampaigns },
      { count: activeCampaigns },
      { count: totalUsers },
      { count: totalDonations },
      { data: recentTx },
      { data: platformStats }
    ] = await Promise.all([
      supabase.from('campaigns').select('*', { count: 'exact', head: true }),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('transactions').select('transaction_id, amount, currency, status, created_at, donor_name, campaigns(title)')
        .order('created_at', { ascending: false }).limit(10),
      supabase.from('platform_stats').select('*').eq('id', 'global').single()
    ])

    res.json({
      stats: {
        totalCampaigns, pendingCampaigns, activeCampaigns,
        totalUsers, totalDonations,
        totalRaised: platformStats?.data?.total_raised || 0
      },
      recentTransactions: recentTx || [],
      alerts: pendingCampaigns > 0
        ? [{ type: 'warning', message: `${pendingCampaigns} cagnotte(s) en attente de validation` }]
        : []
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Gestion des cagnottes ────────────────────────────────────────────────────
// GET /api/admin/campaigns?status=pending_review
router.get('/campaigns', async (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query
  let query = supabase
    .from('campaigns')
    .select('*, profiles:organizer_id(full_name, email, verified)')
    .order('created_at', { ascending: false })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// PATCH /api/admin/campaigns/:id/approve — Approuver une cagnotte
router.patch('/campaigns/:id/approve', async (req, res) => {
  const { data: campaign } = await supabase
    .from('campaigns')
    .update({ status: 'active', approved_at: new Date().toISOString(), approved_by: req.user.id })
    .eq('id', req.params.id)
    .select('*, profiles:organizer_id(full_name, email)')
    .single()

  if (!campaign) return res.status(404).json({ error: 'Cagnotte introuvable' })

  // Notifier l'organisateur
  if (campaign.profiles?.email) {
    await mailer.send(campaign.profiles.email,
      `✅ Votre cagnotte "${campaign.title}" est maintenant en ligne !`,
      `<p>Bonjour ${campaign.profiles.full_name},</p>
      <p>Bonne nouvelle ! Votre cagnotte <strong>"${campaign.title}"</strong> a été approuvée et est maintenant visible par tous les donateurs.</p>
      <p><a href="${process.env.FRONTEND_URL}/cagnotte/${campaign.slug}" style="background:#1D9E75;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Voir ma cagnotte →</a></p>
      <p>Partagez le lien pour commencer à recevoir des dons !</p>`
    )
  }

  logger.info('Cagnotte approuvée', { id: req.params.id, admin: req.user.id })
  res.json(campaign)
})

// PATCH /api/admin/campaigns/:id/reject — Rejeter une cagnotte
router.patch('/campaigns/:id/reject', async (req, res) => {
  const { reason = 'Non conforme aux conditions d\'utilisation' } = req.body

  const { data: campaign } = await supabase
    .from('campaigns')
    .update({ status: 'suspended', rejection_reason: reason, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select('*, profiles:organizer_id(full_name, email)')
    .single()

  if (!campaign) return res.status(404).json({ error: 'Cagnotte introuvable' })

  if (campaign.profiles?.email) {
    await mailer.send(campaign.profiles.email,
      `❌ Votre cagnotte "${campaign.title.slice(0,30)}" n'a pas été approuvée`,
      `<p>Bonjour ${campaign.profiles.full_name},</p>
      <p>Votre cagnotte <strong>"${campaign.title}"</strong> n'a pas pu être approuvée pour la raison suivante :</p>
      <p style="background:#FAECE7;padding:12px;border-radius:8px;color:#D85A30">${reason}</p>
      <p>Vous pouvez modifier votre cagnotte et la soumettre à nouveau depuis votre dashboard.</p>`
    )
  }

  res.json({ success: true, campaign })
})

// PATCH /api/admin/campaigns/:id/suspend — Suspendre une cagnotte active
router.patch('/campaigns/:id/suspend', async (req, res) => {
  const { reason } = req.body
  await supabase.from('campaigns')
    .update({ status: 'suspended', suspension_reason: reason })
    .eq('id', req.params.id)

  logger.warn('Cagnotte suspendue', { id: req.params.id, reason, admin: req.user.id })
  res.json({ success: true })
})

// ─── Gestion des utilisateurs ──────────────────────────────────────────────────
// GET /api/admin/users
router.get('/users', async (req, res) => {
  const { limit = 50, offset = 0, search } = req.query
  let query = supabase
    .from('profiles')
    .select('id, full_name, email, country, role, verified, created_at')
    .order('created_at', { ascending: false })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// PATCH /api/admin/users/:id/verify — Vérifier un organisateur
router.patch('/users/:id/verify', async (req, res) => {
  const { data } = await supabase
    .from('profiles')
    .update({ verified: true, verified_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single()

  res.json(data)
})

// PATCH /api/admin/users/:id/role — Changer le rôle
router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body
  if (!['user', 'admin', 'moderator'].includes(role)) {
    return res.status(400).json({ error: 'Rôle invalide' })
  }
  const { data } = await supabase
    .from('profiles').update({ role }).eq('id', req.params.id).select().single()
  res.json(data)
})

// ─── Statistiques avancées ────────────────────────────────────────────────────
// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  const { period = '30' } = req.query // jours
  const since = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: donsByDay },
    { data: donsByCountry },
    { data: donsByMethod },
    { data: topCampaigns }
  ] = await Promise.all([
    supabase.rpc('donations_by_day', { p_since: since }),
    supabase.from('transactions')
      .select('donor_country, amount')
      .eq('status', 'completed')
      .gte('created_at', since),
    supabase.from('transactions')
      .select('payment_method, amount')
      .eq('status', 'completed')
      .gte('created_at', since),
    supabase.from('campaigns')
      .select('title, raised_amount, donor_count, currency')
      .eq('status', 'active')
      .order('raised_amount', { ascending: false })
      .limit(10)
  ])

  // Agréger par pays
  const byCountry = {}
  ;(donsByCountry || []).forEach(d => {
    byCountry[d.donor_country] = (byCountry[d.donor_country] || 0) + d.amount
  })

  // Agréger par méthode
  const byMethod = {}
  ;(donsByMethod || []).forEach(d => {
    byMethod[d.payment_method] = (byMethod[d.payment_method] || 0) + d.amount
  })

  res.json({
    period: parseInt(period),
    donsByDay: donsByDay || [],
    byCountry,
    byMethod,
    topCampaigns: topCampaigns || []
  })
})

// ─── Signalements fraude ─────────────────────────────────────────────────────
// GET /api/admin/fraud-flags
router.get('/fraud-flags', async (req, res) => {
  const { data } = await supabase
    .from('fraud_flags')
    .select('*')
    .eq('resolved', false)
    .order('flagged_at', { ascending: false })
  res.json(data || [])
})

// PATCH /api/admin/fraud-flags/:id/resolve
router.patch('/fraud-flags/:id/resolve', async (req, res) => {
  await supabase.from('fraud_flags')
    .update({ resolved: true, resolved_by: req.user.id, resolved_at: new Date().toISOString() })
    .eq('id', req.params.id)
  res.json({ success: true })
})

// ─── Transactions ─────────────────────────────────────────────────────────────
// GET /api/admin/transactions
router.get('/transactions', async (req, res) => {
  const { status, limit = 50 } = req.query
  let query = supabase
    .from('transactions')
    .select('*, campaigns(title)')
    .order('created_at', { ascending: false })
    .limit(parseInt(limit))

  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

module.exports = router
