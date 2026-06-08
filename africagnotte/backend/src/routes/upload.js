const express = require('express')
const router  = express.Router()
const { uploadCampaignImage } = require('../lib/storage')
const { requireAuth } = require('../middleware/auth')
const logger  = require('../lib/logger')

// POST /api/upload/campaign-image
router.post('/campaign-image', requireAuth, async (req, res) => {
  try {
    const { image, campaign_id } = req.body
    if (!image)       return res.status(400).json({ error: 'Image requise (base64)' })
    if (!campaign_id) return res.status(400).json({ error: 'campaign_id requis' })

    // Vérifier que l'image n'est pas trop grande (5MB base64 ≈ 3.75MB fichier)
    if (image.length > 7 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image trop grande (max 5MB)' })
    }

    const url = await uploadCampaignImage(image, campaign_id, req.user.id)
    res.json({ url, success: true })
  } catch (err) {
    logger.error('Upload error', { error: err.message })
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
