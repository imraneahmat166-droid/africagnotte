import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function adminRequest(path, options = {}, getToken) {
  const token = await getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data
}

export default function Admin() {
  const navigate = useNavigate()
  const { user, getToken } = useAuth()
  const [tab, setTab]             = useState('dashboard')
  const [dashData, setDashData]   = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [users, setUsers]         = useState([])
  const [transactions, setTxs]    = useState([])
  const [fraudFlags, setFraud]    = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')

  useEffect(() => { loadTab(tab) }, [tab])

  async function loadTab(t) {
    setLoading(true); setError('')
    try {
      if (t === 'dashboard') {
        const d = await adminRequest('/api/admin/dashboard', {}, getToken)
        setDashData(d)
      } else if (t === 'campaigns') {
        const d = await adminRequest('/api/admin/campaigns?limit=100', {}, getToken)
        setCampaigns(Array.isArray(d) ? d : [])
      } else if (t === 'users') {
        const d = await adminRequest('/api/admin/users?limit=100', {}, getToken)
        setUsers(Array.isArray(d) ? d : [])
      } else if (t === 'transactions') {
        const d = await adminRequest('/api/admin/transactions?limit=100', {}, getToken)
        setTxs(Array.isArray(d) ? d : [])
      } else if (t === 'fraud') {
        const d = await adminRequest('/api/admin/fraud-flags', {}, getToken)
        setFraud(Array.isArray(d) ? d : [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function approveCampaign(id) {
    try {
      await adminRequest(`/api/admin/campaigns/${id}/approve`, { method: 'PATCH' }, getToken)
      setCampaigns(cs => cs.map(c => c.id === id ? { ...c, status: 'active' } : c))
    } catch (err) { alert(err.message) }
  }

  async function rejectCampaign(id) {
    const reason = prompt('Raison du rejet :')
    if (!reason) return
    try {
      await adminRequest(`/api/admin/campaigns/${id}/reject`, {
        method: 'PATCH', body: JSON.stringify({ reason })
      }, getToken)
      setCampaigns(cs => cs.map(c => c.id === id ? { ...c, status: 'suspended' } : c))
    } catch (err) { alert(err.message) }
  }

  async function verifyUser(id) {
    try {
      await adminRequest(`/api/admin/users/${id}/verify`, { method: 'PATCH' }, getToken)
      setUsers(us => us.map(u => u.id === id ? { ...u, verified: true } : u))
    } catch (err) { alert(err.message) }
  }

  async function resolveFlag(id) {
    try {
      await adminRequest(`/api/admin/fraud-flags/${id}/resolve`, { method: 'PATCH' }, getToken)
      setFraud(fs => fs.filter(f => f.id !== id))
    } catch (err) { alert(err.message) }
  }

  const tabStyle = (t) => ({
    padding: '8px 18px', border: 'none', borderRadius: 8,
    background: tab === t ? '#085041' : 'transparent',
    color: tab === t ? '#fff' : '#555',
    fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer'
  })

  const statusColors = {
    active:         { bg: '#E1F5EE', color: '#085041' },
    pending_review: { bg: '#FAEEDA', color: '#854F0B' },
    suspended:      { bg: '#FAECE7', color: '#D85A30' },
    ended:          { bg: '#f1f1f1', color: '#888' },
  }

  return (
    <div style={{ maxWidth: 1100, margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.8rem' }}>🛡️ Administration</h1>
          <p style={{ color: '#888', fontSize: 13 }}>Panneau de gestion AfriCagnotte</p>
        </div>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 16px', border: '1.5px solid #e5e5e5', borderRadius: 8, background: 'transparent', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', color: '#555' }}>
          ← Dashboard
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', background: '#f9f8f5', padding: 4, borderRadius: 10, width: 'fit-content', flexWrap: 'wrap' }}>
        {[['dashboard','📊 Tableau de bord'],['campaigns','📋 Cagnottes'],['users','👥 Utilisateurs'],['transactions','💳 Transactions'],['fraud','🚨 Fraude']].map(([t, l]) => (
          <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      {error && (
        <div style={{ padding: '1rem', borderRadius: 8, background: '#FAECE7', color: '#D85A30', marginBottom: '1rem', fontSize: 13 }}>
          ⚠️ {error} — Vérifiez que vous avez le rôle admin dans Supabase.
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>Chargement...</div>
      ) : (
        <>
          {/* ── Dashboard ── */}
          {tab === 'dashboard' && dashData && (
            <>
              {dashData.alerts?.map((a, i) => (
                <div key={i} style={{ padding: '1rem', borderRadius: 8, background: '#FAEEDA', color: '#854F0B', border: '1px solid #FAC775', marginBottom: '1rem', fontSize: 14, fontWeight: 500 }}>
                  ⚠️ {a.message}
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  ['📋', dashData.stats.totalCampaigns,  'Cagnottes totales'],
                  ['⏳', dashData.stats.pendingCampaigns,'En attente'],
                  ['✅', dashData.stats.activeCampaigns, 'Actives'],
                  ['👥', dashData.stats.totalUsers,      'Utilisateurs'],
                  ['💳', dashData.stats.totalDonations,  'Dons confirmés'],
                  ['💰', (dashData.stats.totalRaised||0).toLocaleString()+' XAF','Total collecté'],
                ].map(([icon, val, label]) => (
                  <div key={label} style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '.4rem' }}>{icon}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#085041' }}>{val}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e5e5', fontWeight: 600, fontSize: 14 }}>Dernières transactions</div>
                {(dashData.recentTransactions || []).map((tx, i) => (
                  <div key={i} style={{ padding: '.75rem 1.25rem', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{tx.donor_name} → {tx.campaigns?.title?.slice(0,30)}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{tx.transaction_id} · {new Date(tx.created_at).toLocaleString('fr-FR')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700 }}>{tx.amount?.toLocaleString()} {tx.currency}</div>
                      <div style={{ fontSize: 11, color: tx.status === 'completed' ? '#1D9E75' : '#EF9F27' }}>{tx.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Cagnottes ── */}
          {tab === 'campaigns' && (
            <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Cagnottes ({campaigns.length})</span>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  {['','pending_review','active','suspended','ended'].map(s => (
                    <button key={s} onClick={() => adminRequest(`/api/admin/campaigns${s?`?status=${s}`:''}?limit=100`,{},getToken).then(d=>setCampaigns(Array.isArray(d)?d:[]))}
                      style={{ padding: '4px 10px', border: '1.5px solid #e5e5e5', borderRadius: 6, background: 'transparent', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {s || 'Toutes'}
                    </button>
                  ))}
                </div>
              </div>
              {campaigns.map(c => {
                const sc = statusColors[c.status] || statusColors.ended
                return (
                  <div key={c.id} style={{ padding: '.85rem 1.25rem', borderBottom: '1px solid #f5f5f5', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', alignItems: 'center', gap: '1rem', fontSize: 13 }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{c.title?.slice(0,45)}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{c.profiles?.full_name} · {c.country} · {new Date(c.created_at).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{(c.raised_amount||0).toLocaleString()} {c.currency}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>/ {(c.goal_amount||0).toLocaleString()}</div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color, justifySelf: 'start' }}>{c.status}</span>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {c.status === 'pending_review' && (
                        <>
                          <button onClick={() => approveCampaign(c.id)} style={{ padding: '4px 10px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>✅ Approuver</button>
                          <button onClick={() => rejectCampaign(c.id)} style={{ padding: '4px 10px', background: '#D85A30', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>❌ Rejeter</button>
                        </>
                      )}
                      {c.status === 'active' && (
                        <button onClick={() => { if(confirm('Suspendre cette cagnotte ?')) adminRequest(`/api/admin/campaigns/${c.id}/suspend`,{method:'PATCH',body:JSON.stringify({reason:'Contrôle administratif'})},getToken).then(()=>loadTab('campaigns')) }}
                          style={{ padding: '4px 10px', background: '#FAECE7', color: '#D85A30', border: '1px solid #F5C4B3', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>⏸ Suspendre</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Utilisateurs ── */}
          {tab === 'users' && (
            <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Utilisateurs ({users.length})</span>
                <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ padding: '6px 12px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
              </div>
              {users.filter(u => !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.includes(search)).map(u => (
                <div key={u.id} style={{ padding: '.75rem 1.25rem', borderBottom: '1px solid #f5f5f5', display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', alignItems: 'center', fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{u.full_name}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{u.country}</div>
                  </div>
                  <span style={{ color: '#888', fontSize: 12 }}>{u.email}</span>
                  <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: u.role === 'admin' ? '#E6F1FB' : '#f1f1f1', color: u.role === 'admin' ? '#185FA5' : '#888' }}>{u.role}</span>
                  <span>{u.verified ? <span style={{ color: '#1D9E75', fontWeight: 600 }}>✓ Vérifié</span> : <span style={{ color: '#aaa' }}>Non vérifié</span>}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {!u.verified && (
                      <button onClick={() => verifyUser(u.id)} style={{ padding: '4px 8px', background: '#E1F5EE', color: '#085041', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Vérifier</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Transactions ── */}
          {tab === 'transactions' && (
            <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e5e5', fontWeight: 600, fontSize: 14 }}>
                Transactions ({transactions.length})
              </div>
              {transactions.map((tx, i) => (
                <div key={i} style={{ padding: '.75rem 1.25rem', borderBottom: '1px solid #f5f5f5', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', alignItems: 'center', fontSize: 12 }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{tx.transaction_id}</div>
                    <div style={{ color: '#888' }}>{tx.donor_name} · {tx.donor_email}</div>
                  </div>
                  <span>{tx.campaigns?.title?.slice(0,20)}</span>
                  <span style={{ fontWeight: 700 }}>{(tx.amount||0).toLocaleString()} {tx.currency}</span>
                  <span style={{ textTransform: 'uppercase', fontSize: 11 }}>{tx.payment_method}</span>
                  <span style={{ color: tx.status==='completed'?'#1D9E75':tx.status==='failed'?'#D85A30':'#EF9F27', fontWeight: 600, fontSize: 11 }}>{tx.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Fraude ── */}
          {tab === 'fraud' && (
            <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e5e5', fontWeight: 600, fontSize: 14 }}>
                🚨 Signalements fraude ({fraudFlags.length})
              </div>
              {fraudFlags.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>✅ Aucun signalement en attente</div>
              ) : fraudFlags.map(f => (
                <div key={f.id} style={{ padding: '.85rem 1.25rem', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>📧 {f.donor_email}</div>
                    <div style={{ fontSize: 12, color: '#D85A30' }}>{f.reason}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{new Date(f.flagged_at).toLocaleString('fr-FR')}</div>
                  </div>
                  <button onClick={() => resolveFlag(f.id)} style={{ padding: '6px 14px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                    ✅ Résoudre
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
