const express  = require('express')
const router   = express.Router()
const supabase = require('../lib/supabase')
const { requireAuth } = require('../middleware/auth')

router.use(requireAuth)

// GET /api/notifications — Liste des notifications
router.get('/', async (req, res) => {
  const { limit = 20, unread_only = false } = req.query
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(parseInt(limit))

  if (unread_only === 'true') query = query.eq('read', false)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.user.id)
    .eq('read', false)

  res.json({ notifications: data || [], unread_count: unreadCount || 0 })
})

// PATCH /api/notifications/read-all — Tout marquer comme lu
router.patch('/read-all', async (req, res) => {
  await supabase.from('notifications')
    .update({ read: true })
    .eq('user_id', req.user.id)
    .eq('read', false)
  res.json({ success: true })
})

// PATCH /api/notifications/:id/read — Marquer une notification comme lue
router.patch('/:id/read', async (req, res) => {
  await supabase.from('notifications')
    .update({ read: true })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
  res.json({ success: true })
})

module.exports = router
