require('dotenv').config()
const express    = require('express')
const helmet     = require('helmet')
const cors       = require('cors')
const morgan     = require('morgan')
const rateLimit  = require('express-rate-limit')
const { startAgents } = require('./agents/runner')
const logger     = require('./lib/logger')

const app = express()

app.use(helmet())
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
}))
app.use(rateLimit({ windowMs: 15*60*1000, max: 300, message: { error: 'Trop de requêtes' } }))
app.use('/api/payments/initiate', rateLimit({ windowMs: 60*1000, max: 10, message: { error: 'Trop de tentatives de paiement' } }))
app.use('/api/upload', rateLimit({ windowMs: 60*1000, max: 5, message: { error: "Trop d'uploads" } }))

app.use('/api/payments/webhook',   express.raw({ type: '*/*' }))
app.use('/api/withdrawals/webhook',express.raw({ type: '*/*' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }))

app.use('/api/campaigns',     require('./routes/campaigns'))
app.use('/api/payments',      require('./routes/payments'))
app.use('/api/donations',     require('./routes/donations'))
app.use('/api/users',         require('./routes/users'))
app.use('/api/withdrawals',   require('./routes/withdrawals'))
app.use('/api/upload',        require('./routes/upload'))
app.use('/api/notifications', require('./routes/notifications'))
app.use('/api/agents',        require('./routes/agents'))
app.use('/api/admin',         require('./routes/admin'))

app.get('/health', (req, res) => res.json({
  status: 'ok', version: '2.0.0', timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV,
  agents: process.env.AGENT_CRON_ENABLED === 'true' ? 'running' : 'disabled',
  services: {
    supabase: !!process.env.SUPABASE_URL,
    cinetpay: !!process.env.CINETPAY_API_KEY,
    smtp:     !!process.env.SMTP_USER,
    sms_at:   !!process.env.AT_API_KEY,
  }
}))

app.use((err, req, res, next) => {
  logger.error(`${err.status||500} — ${err.message}`, { path: req.path })
  res.status(err.status||500).json({ error: process.env.NODE_ENV==='production' ? 'Erreur interne' : err.message })
})
app.use((req, res) => res.status(404).json({ error: `Route introuvable: ${req.method} ${req.path}` }))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  logger.info(`✅ AfriCagnotte API v2 — port ${PORT} | ${process.env.NODE_ENV}`)
  if (process.env.AGENT_CRON_ENABLED === 'true') { startAgents(); logger.info('🤖 Agents démarrés') }
})

module.exports = app
