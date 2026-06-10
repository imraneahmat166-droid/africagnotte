import React, { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { api } from './lib/api'

// ─── Composant Bouton Retour ─────────────────────────────────────────────────
function BackButton({ to, label = '← Retour' }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => to ? navigate(to) : navigate(-1)}
      style={{
        background: 'none', border: 'none', color: '#1D9E75',
        fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 0', marginBottom: 16, fontWeight: 500
      }}
    >
      {label}
    </button>
  )
}

// ─── Navigation principale ───────────────────────────────────────────────────
function Nav() {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <nav style={{
      background: '#fff', borderBottom: '1px solid #e5e5e5',
      padding: '0 2rem', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: 64,
      position: 'sticky', top: 0, zIndex: 100
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 32, height: 32, background: '#1D9E75', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>🌍</div>
        <span style={{ fontWeight: 700, fontSize: '1.4rem', color: '#085041' }}>AfriCagnotte</span>
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {[['/', 'Accueil'], ['/explorer', 'Explorer'], ['/creer', 'Créer'], ['/dashboard', 'Dashboard']].map(([path, label]) => (
          <Link key={path} to={path} style={{
            color: isActive(path) ? '#1D9E75' : '#555',
            textDecoration: 'none', fontSize: 14, fontWeight: isActive(path) ? 600 : 500,
            borderBottom: isActive(path) ? '2px solid #1D9E75' : '2px solid transparent',
            paddingBottom: 4
          }}>{label}</Link>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Link to="/connexion" style={{ padding: '9px 20px', border: '1.5px solid #1D9E75', borderRadius: 8, color: '#1D9E75', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Connexion</Link>
        <Link to="/creer" style={{ padding: '9px 20px', background: '#1D9E75', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Lancer ma cagnotte</Link>
      </div>
    </nav>
  )
}

// ─── Page Accueil ─────────────────────────────────────────────────────────────
function Home() {
  const navigate = useNavigate()
  const DEMO_CAMPAIGNS = [
    { id: 1, slug: 'operation-mama-marie', title: 'Opération urgente pour Mama Marie', category: 'Santé', country: '🇨🇲 Cameroun', emoji: '🏥', raised: 242500, goal: 500000, donors: 34, currency: 'XAF' },
    { id: 2, slug: 'bourse-brazzaville', title: 'Bourse scolaire pour 5 lycéens', category: 'Éducation', country: '🇨🇬 Congo', emoji: '📚', raised: 100000, goal: 300000, donors: 18, currency: 'XAF' },
    { id: 3, slug: 'maraichage-ngaoundere', title: 'Projet maraîchage féminin', category: 'Business', country: '🇨🇲 Cameroun', emoji: '🌱', raised: 145000, goal: 200000, donors: 29, currency: 'XAF' },
    { id: 4, slug: 'festival-gabon', title: 'Festival culturel Afrique Centrale', category: 'Culture', country: '🇬🇦 Gabon', emoji: '🎭', raised: 210000, goal: 800000, donors: 41, currency: 'XAF' },
  ]

  return (
    <div>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#085041,#1D9E75,#5DCAA5)', padding: '5rem 2rem 4rem', textAlign: 'center', color: '#fff' }}>
        <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '2.8rem', lineHeight: 1.2, marginBottom: '1rem' }}>
          La cagnotte solidaire<br /><span style={{ color: '#FAC775' }}>de l'Afrique Centrale</span>
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: 540, margin: '0 auto 2rem' }}>
          Mobile Money, cartes bancaires — collectez des fonds facilement au Cameroun, RDC, Gabon et partout dans la région.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/creer')} style={{ padding: '14px 28px', background: '#fff', color: '#085041', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>🚀 Lancer ma cagnotte</button>
          <button onClick={() => navigate('/explorer')} style={{ padding: '14px 28px', background: 'rgba(255,255,255,.15)', color: '#fff', borderRadius: 10, border: '1.5px solid rgba(255,255,255,.4)', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Explorer les projets</button>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem', opacity: .85 }}>
          {['🇨🇲 Cameroun','🇨🇩 RD Congo','🇬🇦 Gabon','🇨🇬 Congo','🇨🇫 RCA','🇬🇶 Guinée Éq.','🇹🇩 Tchad'].map(c => (
            <span key={c} style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{c}</span>
          ))}
        </div>
      </div>
      {/* Stats */}
      <div style={{ background: '#fff', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap', borderBottom: '1px solid #e5e5e5' }}>
        {[['2 847','Cagnottes actives'],['485M XAF','Collectés'],['34 200','Donateurs'],['7 pays','Couverts']].map(([n,l]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#085041' }}>{n}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      {/* Cagnottes en vedette */}
      <div style={{ padding: '3rem 2rem' }}>
        <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.8rem', marginBottom: '.5rem' }}>Cagnottes en vedette</h2>
        <p style={{ color: '#888', marginBottom: '2rem', fontSize: 14 }}>Des projets qui ont besoin de votre soutien</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.5rem' }}>
          {DEMO_CAMPAIGNS.map(c => <CampaignCard key={c.id} campaign={c} />)}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button onClick={() => navigate('/explorer')} style={{ padding: '12px 32px', border: '1.5px solid #1D9E75', borderRadius: 10, background: 'transparent', color: '#1D9E75', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Voir toutes les cagnottes →</button>
        </div>
      </div>
    </div>
  )
}

// ─── Carte Cagnotte ───────────────────────────────────────────────────────────
function CampaignCard({ campaign: c }) {
  const navigate = useNavigate()
  const pct = Math.round(c.raised / c.goal * 100)
  return (
    <div onClick={() => navigate(`/cagnotte/${c.slug}`)} style={{
      background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5',
      overflow: 'hidden', cursor: 'pointer', transition: 'transform .2s,box-shadow .2s'
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.08)' }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ height: 160, background: 'linear-gradient(135deg,#9FE1CB,#1D9E75)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', position: 'relative' }}>
        <span>{c.emoji}</span>
        <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,.5)', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{c.country}</span>
      </div>
      <div style={{ padding: '1rem' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#1D9E75', textTransform: 'uppercase', letterSpacing: .5, marginBottom: '.4rem' }}>{c.category}</div>
        <div style={{ fontWeight: 600, fontSize: '.95rem', marginBottom: '.5rem', lineHeight: 1.4 }}>{c.title}</div>
        <div style={{ background: '#eee', borderRadius: 4, height: 6, marginBottom: '.5rem' }}>
          <div style={{ background: '#1D9E75', borderRadius: 4, height: '100%', width: `${Math.min(pct,100)}%` }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888' }}>
          <span style={{ fontWeight: 700, color: '#1a1a1a', fontSize: 13 }}>{c.raised.toLocaleString()} {c.currency}</span>
          <span>{pct}% de l'objectif</span>
        </div>
      </div>
    </div>
  )
}

// ─── Page Explorer ────────────────────────────────────────────────────────────
function Explorer() {
  const ALL = [
    { id:1, slug:'operation-mama-marie', title:'Opération urgente Mama Marie', category:'Santé', country:'🇨🇲 Cameroun', emoji:'🏥', raised:242500, goal:500000, donors:34, currency:'XAF' },
    { id:2, slug:'bourse-brazzaville', title:'Bourse scolaire Brazzaville', category:'Éducation', country:'🇨🇬 Congo', emoji:'📚', raised:100000, goal:300000, donors:18, currency:'XAF' },
    { id:3, slug:'maraichage-ngaoundere', title:'Maraîchage féminin Ngaoundéré', category:'Business', country:'🇨🇲 Cameroun', emoji:'🌱', raised:145000, goal:200000, donors:29, currency:'XAF' },
    { id:4, slug:'urgence-kinshasa', title:'Reconstruction après incendie Kinshasa', category:'Urgence', country:'🇨🇩 RD Congo', emoji:'🔥', raised:320000, goal:1000000, donors:52, currency:'XAF' },
    { id:5, slug:'festival-gabon', title:'Festival culturel Afrique Centrale', category:'Culture', country:'🇬🇦 Gabon', emoji:'🎭', raised:210000, goal:800000, donors:41, currency:'XAF' },
    { id:6, slug:'centre-sante-bouar', title:'Centre de santé rural — Bouar', category:'Santé', country:'🇨🇫 RCA', emoji:'⚕️', raised:560000, goal:2000000, donors:87, currency:'XAF' },
  ]
  const [filter, setFilter] = useState('')
  const filtered = filter ? ALL.filter(c => c.category === filter) : ALL

  return (
    <div style={{ padding: '2rem' }}>
      <BackButton to="/" label="← Accueil" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.8rem', marginBottom: '.25rem' }}>Toutes les cagnottes</h1>
          <p style={{ color: '#888', fontSize: 14 }}>{filtered.length} cagnottes trouvées</p>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '8px 12px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontFamily: 'inherit', fontSize: 14 }}>
          <option value="">Toutes catégories</option>
          {['Santé','Éducation','Business','Urgence','Culture','Environnement'].map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.5rem' }}>
        {filtered.map(c => <CampaignCard key={c.id} campaign={c} />)}
      </div>
    </div>
  )
}

// ─── Page Détail Cagnotte ─────────────────────────────────────────────────────
function CampaignDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [amount, setAmount] = useState(5000)
  const [pm, setPm] = useState('mtn')
  const [showModal, setShowModal] = useState(false)

  // Données de démo (en prod: useEffect → api.getCampaign(slug))
  const campaign = {
    title: 'Opération urgente pour Mama Marie',
    category: 'Santé', country: '🇨🇲 Cameroun', emoji: '🏥',
    raised: 242500, goal: 500000, donors: 34, currency: 'XAF',
    organizer: 'Jean Mballa', org_init: 'JM',
    description: "Mama Marie, 58 ans, a besoin d'une opération chirurgicale urgente au CHU de Yaoundé. Chaque don peut lui sauver la vie.",
    amounts: [2000, 5000, 10000, 25000],
    usage: ['60% Frais opération', '25% Médicaments', '15% Transport'],
    slug, id: '1'
  }
  const pct = Math.round(campaign.raised / campaign.goal * 100)

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1.5rem' }}>
      <BackButton label="← Retour aux cagnottes" to="/explorer" />

      {/* Hero image */}
      <div style={{ borderRadius: 12, height: 300, background: 'linear-gradient(135deg,#9FE1CB,#0F6E56)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', marginBottom: '2rem' }}>
        {campaign.emoji}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
            {[campaign.category, campaign.country].map(t => (
              <span key={t} style={{ background: '#E1F5EE', color: '#085041', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{t}</span>
            ))}
          </div>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.9rem', marginBottom: '.75rem' }}>{campaign.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '1rem', background: '#f9f8f5', borderRadius: 8, marginBottom: '1.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1D9E75', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>{campaign.org_init}</div>
            <div><strong style={{ fontSize: 14 }}>{campaign.organizer}</strong><br /><span style={{ fontSize: 12, color: '#888' }}>Organisateur vérifié ✓</span></div>
          </div>
          <p style={{ color: '#555', lineHeight: 1.8, fontSize: '.95rem', marginBottom: '1.5rem' }}>{campaign.description}</p>
          <div style={{ background: '#f9f8f5', borderRadius: 8, padding: '1rem' }}>
            <strong style={{ fontSize: 14 }}>💰 Utilisation des fonds</strong>
            <ul style={{ marginTop: '.75rem', paddingLeft: '1.25rem', color: '#555', fontSize: 14, lineHeight: 2 }}>
              {campaign.usage.map(u => <li key={u}>{u}</li>)}
            </ul>
          </div>
        </div>

        {/* Box don */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5', padding: '1.5rem', position: 'sticky', top: 80, alignSelf: 'start' }}>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: '2rem', color: '#085041' }}>{campaign.raised.toLocaleString()} <span style={{ fontSize: '1rem', color: '#888', fontFamily: 'inherit' }}>XAF</span></div>
          <p style={{ fontSize: 13, color: '#888', marginBottom: '1rem' }}>sur {campaign.goal.toLocaleString()} XAF — {pct}% atteint</p>
          <div style={{ background: '#eee', borderRadius: 4, height: 6, marginBottom: '.5rem' }}>
            <div style={{ background: '#1D9E75', height: '100%', width: `${pct}%`, borderRadius: 4 }}></div>
          </div>
          <p style={{ fontSize: 13, color: '#555', marginBottom: '1.25rem' }}>💚 {campaign.donors} donateurs</p>

          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '.6rem' }}>Choisir un montant</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '.5rem', marginBottom: '1rem' }}>
            {campaign.amounts.map(a => (
              <button key={a} onClick={() => setAmount(a)} style={{
                padding: 10, border: `1.5px solid ${amount === a ? '#1D9E75' : '#e5e5e5'}`,
                borderRadius: 8, background: amount === a ? '#E1F5EE' : '#fff',
                color: amount === a ? '#085041' : '#1a1a1a', fontFamily: 'inherit',
                fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}>{a.toLocaleString()}</button>
            ))}
          </div>
          <input type="number" placeholder="Autre montant (XAF)" onChange={e => setAmount(parseInt(e.target.value) || 0)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, marginBottom: '1rem', outline: 'none' }} />

          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '.6rem' }}>Moyen de paiement</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '1rem' }}>
            {[['mtn','📱 MTN Mobile'],['orange','🟠 Orange'],['airtel','📶 Airtel'],['card','💳 Carte']].map(([key, label]) => (
              <button key={key} onClick={() => setPm(key)} style={{
                padding: 10, border: `1.5px solid ${pm === key ? '#EF9F27' : '#e5e5e5'}`,
                borderRadius: 8, background: pm === key ? '#FAEEDA' : '#fff',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
              }}>{label}</button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} style={{ width: '100%', padding: '14px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Faire un don 💚
          </button>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#888', marginTop: '.75rem' }}>🔒 Sécurisé via CinetPay</p>
        </div>
      </div>

      {showModal && <PaymentModal campaign={campaign} amount={amount} paymentMethod={pm} onClose={() => setShowModal(false)} />}
    </div>
  )
}

// ─── Modal Paiement ───────────────────────────────────────────────────────────
function PaymentModal({ campaign, amount, paymentMethod, onClose }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1=form, 2=loading, 3=success
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [error, setError] = useState('')
  const [txRef, setTxRef] = useState('')
  const fees = Math.round(amount * 0.02)
  const total = amount + fees

  async function handlePay() {
    if (!form.name || !form.email) { setError('Prénom et email requis'); return }
    if (paymentMethod !== 'card' && !form.phone) { setError('Numéro de téléphone requis pour Mobile Money'); return }
    setError(''); setStep(2)

    try {
      const result = await api.initiatePayment({
        campaign_id: campaign.id,
        amount, currency: campaign.currency,
        donor_name: form.name, donor_email: form.email,
        donor_phone: form.phone, payment_method: paymentMethod,
        anonymous: false
      })
      if (result.payment_url) {
        // En production: rediriger vers la page CinetPay
        // window.location.href = result.payment_url
        // Pour la démo:
        setTxRef(result.transaction_id)
        setStep(3)
      }
    } catch (err) {
      setError(err.message)
      setStep(1)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 12, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Finaliser votre don 💚</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>×</button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          {/* Indicateur étapes */}
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem' }}>
            {[1,2,3].map(s => (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: step > s ? '#1D9E75' : step === s ? '#EF9F27' : '#eee' }}></div>
            ))}
          </div>

          {step === 1 && (
            <>
              {/* Résumé */}
              <div style={{ background: '#E1F5EE', borderRadius: 8, padding: '1rem', marginBottom: '1.25rem' }}>
                {[['Cagnotte', campaign.title.slice(0,35)+'...'],['Montant', `${amount.toLocaleString()} XAF`],['Frais (2%)', `${fees.toLocaleString()} XAF`]].map(([k,v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: '.4rem' }}><span>{k}</span><span style={{ fontWeight: 500 }}>{v}</span></div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#085041', borderTop: '1px solid #9FE1CB', paddingTop: '.5rem', marginTop: '.25rem' }}>
                  <span>Total</span><span>{total.toLocaleString()} XAF</span>
                </div>
              </div>
              {[['name','text','Votre prénom *','Jean'],['email','email','Email *','jean@email.com']].map(([k,t,l,p]) => (
                <div key={k} style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: '.4rem' }}>{l}</label>
                  <input type={t} placeholder={p} value={form[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              {paymentMethod !== 'card' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: '.4rem' }}>Numéro Mobile Money *</label>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <select style={{ padding: '10px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                      <option>🇨🇲 +237</option><option>🇨🇩 +243</option><option>🇬🇦 +241</option>
                    </select>
                    <input type="tel" placeholder="6XXXXXXXX" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                      style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, outline: 'none' }} />
                  </div>
                </div>
              )}
              {error && <div style={{ padding: '.75rem 1rem', borderRadius: 8, background: '#FAECE7', color: '#D85A30', border: '1px solid #F5C4B3', fontSize: 13, marginBottom: '1rem' }}>{error}</div>}
              <button onClick={handlePay} style={{ width: '100%', padding: 14, background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Payer {total.toLocaleString()} XAF
              </button>
              <p style={{ textAlign: 'center', fontSize: 11, color: '#888', marginTop: '.75rem' }}>🔒 Sécurisé par <strong style={{ color: '#EF9F27' }}>CinetPay</strong></p>
            </>
          )}

          {step === 2 && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</div>
              <p style={{ fontWeight: 600 }}>Connexion à CinetPay...</p>
              <p style={{ color: '#888', fontSize: 14, marginTop: '.5rem' }}>Veuillez patienter, nous traitons votre paiement.</p>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: 64, height: 64, background: '#E1F5EE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1rem' }}>✅</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '.5rem' }}>Don confirmé !</h3>
              <p style={{ color: '#555', fontSize: 14 }}>Merci pour votre générosité. Un SMS de confirmation vous sera envoyé.</p>
              <div style={{ background: '#E1F5EE', borderRadius: 8, padding: '1rem', margin: '1rem 0', fontSize: 13 }}>
                <div style={{ color: '#888' }}>Référence transaction</div>
                <div style={{ fontWeight: 700, color: '#085041' }}>{txRef}</div>
              </div>
              <button onClick={() => { onClose(); navigate('/') }} style={{ padding: '10px 24px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>
                Retour à l'accueil
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page Créer ───────────────────────────────────────────────────────────────
function Create() {
  const navigate = useNavigate()
  const [category, setCategory] = useState('Santé')
  const [currency, setCurrency] = useState('XAF')

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1.5rem' }}>
      <BackButton label="← Retour" />
      <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '2rem', marginBottom: '.5rem' }}>Créer ma cagnotte</h1>
      <p style={{ color: '#888', marginBottom: '1.5rem' }}>Remplissez les informations pour lancer votre collecte.</p>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5', padding: '2rem' }}>
        {[
          ['1', 'Informations de base'],
          ['2', 'Catégorie'],
          ['3', 'Objectif financier'],
          ['4', 'Coordonnées retrait']
        ].map(([num, title], idx) => (
          <div key={num} style={{ marginBottom: idx < 3 ? '2rem' : 0, paddingBottom: idx < 3 ? '2rem' : 0, borderBottom: idx < 3 ? '1px solid #e5e5e5' : 'none' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span style={{ width: 24, height: 24, background: '#1D9E75', color: '#fff', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{num}</span>
              {title}
            </h3>
            {idx === 0 && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: '.4rem' }}>Titre *</label>
                  <input type="text" placeholder="Ex: Traitement médical de Mama Josephine" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: '.4rem' }}>Description *</label>
                  <textarea placeholder="Expliquez votre situation..." style={{ width: '100%', minHeight: 100, padding: '10px 12px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box', resize: 'vertical', outline: 'none' }}></textarea>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: '.4rem' }}>Pays</label>
                    <select style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, background: '#fff' }}>
                      {['🇨🇲 Cameroun','🇨🇩 RD Congo','🇬🇦 Gabon','🇨🇬 Congo-Brazza','🇨🇫 RCA','🇬🇶 Guinée Éq.','🇹🇩 Tchad'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: '.4rem' }}>Ville</label>
                    <input type="text" placeholder="Douala, Kinshasa..." style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </div>
              </>
            )}
            {idx === 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.5rem' }}>
                {['🏥 Santé','📚 Éducation','💼 Business','🚨 Urgence','🎨 Culture','🌱 Environnement'].map(c => {
                  const label = c.split(' ').slice(1).join(' ')
                  return (
                    <button key={c} onClick={() => setCategory(label)} style={{
                      padding: 8, border: `1.5px solid ${category === label ? '#1D9E75' : '#e5e5e5'}`,
                      borderRadius: 8, background: category === label ? '#E1F5EE' : '#fff',
                      color: category === label ? '#085041' : '#1a1a1a', fontSize: 12, fontWeight: 500, cursor: 'pointer'
                    }}>{c}</button>
                  )
                })}
              </div>
            )}
            {idx === 2 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: '.4rem' }}>Montant cible *</label>
                  <input type="number" placeholder="500 000" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: '.4rem' }}>Devise</label>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    {['XAF','CDF','EUR'].map(c => (
                      <button key={c} onClick={() => setCurrency(c)} style={{
                        flex: 1, padding: 9, border: `1.5px solid ${currency === c ? '#1D9E75' : '#e5e5e5'}`,
                        borderRadius: 8, background: currency === c ? '#E1F5EE' : '#fff',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', color: currency === c ? '#085041' : '#1a1a1a'
                      }}>{c}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {idx === 3 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: '.4rem' }}>Prénom *</label>
                    <input type="text" placeholder="Jean" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: '.4rem' }}>Nom *</label>
                    <input type="text" placeholder="Mballa" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: '.4rem' }}>Numéro Mobile Money</label>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <select style={{ padding: 10, border: '1.5px solid #e5e5e5', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                    <option>🇨🇲 +237</option><option>🇨🇩 +243</option><option>🇬🇦 +241</option>
                  </select>
                  <input type="tel" placeholder="6XXXXXXXX" style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, outline: 'none' }} />
                </div>
              </>
            )}
          </div>
        ))}
        <button onClick={() => navigate('/dashboard')} style={{ width: '100%', padding: 14, background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: '1.5rem' }}>
          🚀 Publier ma cagnotte
        </button>
      </div>
    </div>
  )
}

// ─── Page Dashboard ───────────────────────────────────────────────────────────
function Dashboard() {
  const navigate = useNavigate()
  return (
    <div style={{ maxWidth: 1000, margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.8rem' }}>Mon espace</h1>
          <p style={{ color: '#888', fontSize: 14 }}>Jean-Paul Mballa</p>
        </div>
        <button onClick={() => navigate('/creer')} style={{ padding: '9px 20px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>+ Nouvelle cagnotte</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[['342 500 XAF','Collectés','↑ +12% ce mois'],['47','Donateurs','↑ +8 cette semaine'],['2','Cagnottes actives',''],['68%','Objectif atteint','']].map(([n,l,t]) => (
          <div key={l} style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#085041' }}>{n}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{l}</div>
            {t && <div style={{ fontSize: 12, color: '#1D9E75', fontWeight: 600, marginTop: '.4rem' }}>{t}</div>}
          </div>
        ))}
      </div>

      {/* Mes cagnottes */}
      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e5e5', fontWeight: 600, fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Mes cagnottes</span>
          <button onClick={() => navigate('/creer')} style={{ fontSize: 12, color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>+ Créer</button>
        </div>
        {[
          ['🏥 Opération de Mama Marie','242 500 XAF','500 000 XAF','Actif','#E1F5EE','#085041','operation-mama-marie'],
          ['📚 Bourse lycée Brazzaville','100 000 XAF','300 000 XAF','Actif','#E1F5EE','#085041','bourse-brazzaville'],
          ['🌱 Maraîchage Ngaoundéré','85 000 XAF','200 000 XAF','Terminé','#f1f1f1','#888','maraichage-ngaoundere'],
        ].map(([title, raised, goal, status, bg, color, slug]) => (
          <div key={title} style={{ padding: '.75rem 1.25rem', borderBottom: '1px solid #e5e5e5', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px', alignItems: 'center', fontSize: 13 }}>
            <span style={{ fontWeight: 500 }}>{title}</span>
            <span>{raised}</span>
            <span>{goal}</span>
            <span><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color }}>{status}</span></span>
            <span><button onClick={() => navigate(`/cagnotte/${slug}`)} style={{ padding: '5px 10px', border: '1.5px solid #1D9E75', borderRadius: 6, background: 'transparent', color: '#1D9E75', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Voir</button></span>
          </div>
        ))}
      </div>

      {/* Transactions */}
      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e5e5', fontWeight: 600, fontSize: 14 }}>Dernières transactions</div>
        {[
          ['Don reçu — MTN Mobile Money','Opération Mama Marie • il y a 2h','+5 000 XAF','#1D9E75'],
          ['Don reçu — Orange Money','Bourse lycée • il y a 5h','+10 000 XAF','#1D9E75'],
          ['Don reçu — Carte Visa','Opération Mama Marie • hier','+25 000 XAF','#1D9E75'],
          ['Retrait vers Mobile Money','MTN +237 6XX XXX • il y a 3 jours','-50 000 XAF','#854F0B'],
        ].map(([title, sub, amount, color]) => (
          <div key={title} style={{ padding: '.75rem 1.25rem', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <div><div style={{ fontWeight: 500 }}>{title}</div><div style={{ fontSize: 11, color: '#888' }}>{sub}</div></div>
            <span style={{ fontWeight: 700, color }}>{amount}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page Success Paiement ────────────────────────────────────────────────────
function PaymentSuccess() {
  const navigate = useNavigate()
  const [txId] = useState(() => new URLSearchParams(window.location.search).get('tx') || '')

  useEffect(() => {
    // Vérifier le statut réel auprès du backend
    if (txId) api.checkPayment(txId).catch(() => {})
  }, [txId])

  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ width: 80, height: 80, background: '#E1F5EE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem' }}>✅</div>
      <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.8rem', marginBottom: '.75rem' }}>Paiement confirmé !</h2>
      <p style={{ color: '#555', marginBottom: '1.5rem' }}>Merci pour votre don. Un email de confirmation vous a été envoyé.</p>
      {txId && <div style={{ background: '#E1F5EE', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem', fontSize: 13 }}>
        <div style={{ color: '#888' }}>Référence</div>
        <div style={{ fontWeight: 700, color: '#085041' }}>{txId}</div>
      </div>}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button onClick={() => navigate('/explorer')} style={{ padding: '12px 24px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>Explorer d'autres cagnottes</button>
        <button onClick={() => navigate('/')} style={{ padding: '12px 24px', border: '1.5px solid #1D9E75', background: 'transparent', color: '#1D9E75', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>Accueil</button>
      </div>
    </div>
  )
}

// ─── 404 ──────────────────────────────────────────────────────────────────────
function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌍</div>
      <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.8rem', marginBottom: '.75rem' }}>Page introuvable</h2>
      <p style={{ color: '#555', marginBottom: '2rem' }}>Cette page n'existe pas ou a été déplacée.</p>
      <button onClick={() => navigate(-1)} style={{ padding: '12px 24px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer', marginRight: '1rem' }}>← Revenir</button>
      <button onClick={() => navigate('/')} style={{ padding: '12px 24px', border: '1.5px solid #1D9E75', background: 'transparent', color: '#1D9E75', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>Accueil</button>
    </div>
  )
}

// ─── App principale ───────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/"                element={<Home />} />
        <Route path="/explorer"        element={<Explorer />} />
        <Route path="/cagnotte/:slug"  element={<CampaignDetail />} />
        <Route path="/creer"           element={<Create />} />
        <Route path="/dashboard"       element={<Dashboard />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="*"                element={<NotFound />} />
      </Routes>
      <Routes>
        <Route path="/"                element={<Home />} />
        <Route path="/explorer"        element={<Explorer />} />
        <Route path="/cagnotte/:slug"  element={<CampaignDetail />} />
        <Route path="/creer"           element={<Create />} />
        <Route path="/dashboard"       element={<Dashboard />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="*"                element={<NotFound />} />
      </Routes>
      <Route path="/connexion"       element={<Connexion />} />
        <Route path="/inscription"     element={<Inscription />} />
      <footer style={{ background: '#085041', color: 'rgba(255,255,255,.8)', padding: '2rem', textAlign: 'center', fontSize: 13, marginTop: '4rem' }}>
        <strong style={{ color: '#fff' }}>AfriCagnotte</strong> — La cagnotte solidaire de l'Afrique Centrale<br />
        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '.75rem' }}>
          {['🇨🇲 Cameroun','🇨🇩 RDC','🇬🇦 Gabon','🇨🇬 Congo','🇨🇫 RCA','🇬🇶 Guinée Éq.','🇹🇩 Tchad'].map(c => <span key={c}>{c}</span>)}
        </div>
      </footer>
    </BrowserRouter>
  )
}
