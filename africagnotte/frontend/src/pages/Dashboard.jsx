import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'

function StatCard({ value, label, trend, color = '#085041' }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem' }}>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{label}</div>
      {trend && <div style={{ fontSize: 12, color: '#1D9E75', fontWeight: 600, marginTop: '.4rem' }}>{trend}</div>}
    </div>
  )
}

export default function Dashboard() {
  const navigate  = useNavigate()
  const { user, profile, signOut } = useAuth()
  const [campaigns, setCampaigns]   = useState([])
  const [transactions, setTx]       = useState([])
  const [agents, setAgents]         = useState(null)
  const [tab, setTab]               = useState('campaigns') // campaigns | transactions | agents
  const [loading, setLoading]       = useState(true)
  const [withdrawModal, setWithdrawModal] = useState(null) // campaign à retirer

  useEffect(() => {
    if (!user) { navigate('/connexion'); return }
    loadData()
  }, [user])

  async function loadData() {
    setLoading(true)
    try {
      const [camps, txs] = await Promise.all([
        api.getMyCampaigns(),
        api.getMyTransactions(),
      ])
      setCampaigns(Array.isArray(camps) ? camps : [])
      setTx(Array.isArray(txs) ? txs : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadAgents() {
    try {
      const data = await api.getAgentsStatus()
      setAgents(data)
    } catch (e) {
      setAgents({ error: e.message })
    }
  }

  function handleTabChange(t) {
    setTab(t)
    if (t === 'agents' && !agents) loadAgents()
  }

  const totalRaised = campaigns.reduce((s, c) => s + (c.raised_amount || 0), 0)
  const activeCamps = campaigns.filter(c => c.status === 'active').length
  const totalDonors = campaigns.reduce((s, c) => s + (c.donor_count || 0), 0)

  const tabStyle = (t) => ({
    padding: '8px 20px', border: 'none', borderRadius: 8,
    background: tab === t ? '#1D9E75' : 'transparent',
    color: tab === t ? '#fff' : '#555',
    fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer'
  })

  const statusConfig = {
    active:         { label: 'Actif',            bg: '#E1F5EE', color: '#085041' },
    pending_review: { label: 'En révision',       bg: '#FAEEDA', color: '#854F0B' },
    ended:          { label: 'Terminé',           bg: '#f1f1f1', color: '#888'    },
    suspended:      { label: 'Suspendu',          bg: '#FAECE7', color: '#D85A30' },
  }
  const txStatusConfig = {
    completed: { label: 'Confirmé', color: '#1D9E75' },
    pending:   { label: 'En attente', color: '#854F0B' },
    failed:    { label: 'Échoué',   color: '#D85A30' },
    cancelled: { label: 'Annulé',   color: '#888'    },
  }

  return (
    <div style={{ maxWidth: 1000, margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.8rem' }}>Mon espace</h1>
          <p style={{ color: '#888', fontSize: 14 }}>
            {profile?.full_name || user?.email}
            {profile?.verified && <span style={{ marginLeft: 8, background: '#E1F5EE', color: '#085041', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>✓ Vérifié</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/creer')} style={{ padding: '9px 20px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>
            + Nouvelle cagnotte
          </button>
          <button onClick={signOut} style={{ padding: '9px 16px', border: '1.5px solid #e5e5e5', borderRadius: 8, background: 'transparent', color: '#888', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard value={totalRaised.toLocaleString() + ' XAF'} label="Total collecté" trend="↑ Mis à jour en temps réel" />
        <StatCard value={totalDonors} label="Donateurs total" />
        <StatCard value={activeCamps} label="Cagnottes actives" color="#1D9E75" />
        <StatCard value={campaigns.length} label="Cagnottes créées" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', background: '#f9f8f5', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        <button style={tabStyle('campaigns')}   onClick={() => handleTabChange('campaigns')}>📋 Mes cagnottes</button>
        <button style={tabStyle('transactions')} onClick={() => handleTabChange('transactions')}>💳 Transactions</button>
        <button style={tabStyle('agents')}       onClick={() => handleTabChange('agents')}>🤖 Agents</button>
      </div>

      {/* Tab: Cagnottes */}
      {tab === 'campaigns' && (
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e5e5', fontWeight: 600, fontSize: 14, display: 'flex', justifyContent: 'space-between' }}>
            <span>Mes cagnottes ({campaigns.length})</span>
          </div>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Chargement...</div>
          ) : campaigns.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
              <p style={{ color: '#888', marginBottom: '1rem' }}>Vous n'avez pas encore de cagnotte</p>
              <button onClick={() => navigate('/creer')} style={{ padding: '10px 24px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>
                Créer ma première cagnotte
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '.6rem 1.25rem', background: '#f9f8f5', fontSize: 11, fontWeight: 600, color: '#888' }}>
                <span>Titre</span><span>Collecté</span><span>Objectif</span><span>Statut</span><span>Actions</span>
              </div>
              {campaigns.map(c => {
                const s = statusConfig[c.status] || statusConfig.ended
                const pct = c.goal_amount ? Math.round(c.raised_amount / c.goal_amount * 100) : 0
                const available = (c.raised_amount || 0) - (c.withdrawn_amount || 0)
                return (
                  <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '.85rem 1.25rem', borderTop: '1px solid #f0f0f0', alignItems: 'center', fontSize: 13 }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{c.title.length > 40 ? c.title.slice(0,40) + '…' : c.title}</div>
                      <div style={{ height: 4, background: '#eee', borderRadius: 2, marginTop: 4, width: '80%' }}>
                        <div style={{ height: '100%', background: '#1D9E75', borderRadius: 2, width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                    <span style={{ fontWeight: 600 }}>{(c.raised_amount || 0).toLocaleString()} {c.currency}</span>
                    <span style={{ color: '#888' }}>{(c.goal_amount || 0).toLocaleString()}</span>
                    <span><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span></span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => navigate(`/cagnotte/${c.slug}`)} style={{ padding: '4px 10px', border: '1.5px solid #1D9E75', borderRadius: 6, background: 'transparent', color: '#1D9E75', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Voir</button>
                      {available >= 5000 && (
                        <button onClick={() => setWithdrawModal(c)} style={{ padding: '4px 10px', border: '1.5px solid #EF9F27', borderRadius: 6, background: 'transparent', color: '#854F0B', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                          💰 Retirer
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* Tab: Transactions */}
      {tab === 'transactions' && (
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e5e5', fontWeight: 600, fontSize: 14 }}>
            Historique des transactions ({transactions.length})
          </div>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Chargement...</div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>Aucune transaction pour l'instant</div>
          ) : (
            transactions.map((tx, i) => {
              const s = txStatusConfig[tx.status] || txStatusConfig.pending
              return (
                <div key={i} style={{ padding: '.85rem 1.25rem', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{tx.campaigns?.title || 'Cagnotte'}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                      {tx.transaction_id} · {new Date(tx.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>{(tx.amount || 0).toLocaleString()} {tx.currency}</div>
                    <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Tab: Agents */}
      {tab === 'agents' && (
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e5e5', fontWeight: 600, fontSize: 14 }}>
            🤖 Agents automatisés
          </div>
          {!agents ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Chargement des agents...</div>
          ) : agents.error ? (
            <div style={{ padding: '2rem', color: '#D85A30' }}>Erreur: {agents.error}</div>
          ) : (
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                {(agents.agents || []).map(a => (
                  <div key={a.name} style={{ border: '1px solid #e5e5e5', borderRadius: 10, padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem' }}>
                      <strong style={{ fontSize: 14 }}>{a.name}</strong>
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#E1F5EE', color: '#085041' }}>● {a.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>{a.schedule}</div>
                  </div>
                ))}
              </div>
              {agents.recent_logs?.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: '.75rem' }}>Derniers événements</div>
                  {agents.recent_logs.slice(0, 8).map((log, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '.4rem 0', borderBottom: '1px solid #f5f5f5', color: '#555' }}>
                      <span>📌 {log.event}</span>
                      <span style={{ color: '#aaa' }}>{new Date(log.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Retrait */}
      {withdrawModal && (
        <WithdrawModal
          campaign={withdrawModal}
          onClose={() => setWithdrawModal(null)}
          onSuccess={() => { setWithdrawModal(null); loadData() }}
        />
      )}
    </div>
  )
}

function WithdrawModal({ campaign, onClose, onSuccess }) {
  const available = (campaign.raised_amount || 0) - (campaign.withdrawn_amount || 0)
  const [amount, setAmount] = useState(Math.min(available, 50000))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleWithdraw() {
    if (amount < 5000) { setError('Minimum 5 000 XAF'); return }
    if (amount > available) { setError(`Maximum disponible: ${available.toLocaleString()} XAF`); return }
    setError(''); setLoading(true)
    try {
      await api.requestWithdrawal({ campaign_id: campaign.id, amount })
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>💰 Retirer mes fonds</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>×</button>
        </div>
        <div style={{ background: '#E1F5EE', borderRadius: 8, padding: '1rem', marginBottom: '1.25rem', fontSize: 13 }}>
          <div style={{ color: '#888', marginBottom: 4 }}>Disponible pour retrait</div>
          <div style={{ fontWeight: 700, fontSize: '1.4rem', color: '#085041' }}>{available.toLocaleString()} {campaign.currency}</div>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: '.4rem' }}>Montant à retirer *</label>
          <input type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value) || 0)} min={5000} max={available}
            style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
          <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Min: 5 000 XAF · Max: {available.toLocaleString()} XAF</div>
        </div>
        <div style={{ background: '#f9f8f5', borderRadius: 8, padding: '.75rem', marginBottom: '1.25rem', fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#888' }}>Vers Mobile Money</span>
            <span style={{ fontWeight: 600 }}>{campaign.withdrawal_phone || 'Non configuré'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>Opérateur</span>
            <span style={{ fontWeight: 600 }}>{campaign.withdrawal_operator || 'MTN'}</span>
          </div>
        </div>
        {error && <div style={{ padding: '.75rem', borderRadius: 8, background: '#FAECE7', color: '#D85A30', fontSize: 13, marginBottom: '1rem' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, border: '1.5px solid #e5e5e5', borderRadius: 8, background: 'transparent', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>Annuler</button>
          <button onClick={handleWithdraw} disabled={loading} style={{ flex: 2, padding: 12, background: loading ? '#9FE1CB' : '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '⏳ Traitement...' : `Retirer ${amount.toLocaleString()} ${campaign.currency}`}
          </button>
        </div>
      </div>
    </div>
  )
}
