/**
 * Service Upload d'images
 * Stockage dans Supabase Storage (bucket: campaign-images)
 * Redimensionnement automatique + validation
 */
const supabase = require('./supabase')
const logger   = require('./logger')

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_MB   = 5
const BUCKET        = 'campaign-images'

/**
 * Upload une image depuis un buffer base64
 * @param {string} base64Data  - "data:image/jpeg;base64,/9j/..."
 * @param {string} campaignId  - ID de la cagnotte
 * @param {string} userId      - ID de l'utilisateur
 * @returns {string} URL publique de l'image
 */
async function uploadCampaignImage(base64Data, campaignId, userId) {
  // Parser le base64
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
  if (!matches) throw new Error('Format base64 invalide')

  const mimeType  = matches[1]
  const buffer    = Buffer.from(matches[2], 'base64')

  // Validation type
  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw new Error(`Type non autorisé. Formats acceptés: JPG, PNG, WebP`)
  }

  // Validation taille
  const sizeMB = buffer.length / (1024 * 1024)
  if (sizeMB > MAX_SIZE_MB) {
    throw new Error(`Image trop lourde (${sizeMB.toFixed(1)}MB). Maximum: ${MAX_SIZE_MB}MB`)
  }

  const ext      = mimeType.split('/')[1].replace('jpeg', 'jpg')
  const filename = `${userId}/${campaignId}/${Date.now()}.${ext}`

  // Upload vers Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: mimeType,
      upsert: true,
      cacheControl: '3600'
    })

  if (error) {
    logger.error('Upload image échoué', { error: error.message, filename })
    throw new Error(`Erreur upload: ${error.message}`)
  }

  // Obtenir l'URL publique
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filename)

  logger.info('Image uploadée', { filename, sizeMB: sizeMB.toFixed(2) })
  return publicUrl
}

/**
 * Supprimer une image
 */
async function deleteImage(imageUrl) {
  try {
    // Extraire le path depuis l'URL
    const urlParts = imageUrl.split(`/${BUCKET}/`)
    if (urlParts.length < 2) return
    const filePath = urlParts[1].split('?')[0]

    await supabase.storage.from(BUCKET).remove([filePath])
    logger.info('Image supprimée', { filePath })
  } catch (err) {
    logger.warn('Erreur suppression image', { error: err.message })
  }
}

module.exports = { uploadCampaignImage, deleteImage }
