import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'

const inputStyle = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #e5e5e5',
  borderRadius: 8, fontFamily: 'inherit', fontSize: 14,
  boxSizing: 'border-box', outline: 'none', transition: 'border-color .2s'
}
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: '.4rem' }

export default function CreateCampaign() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep]     = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [form, setForm]     = useState({
    title: '', description: '', category: 'Santé',
    country: 'CM', city: '', goal_amount: '', currency: 'XAF',
    end_date: '', cover_emoji: '🌍',
    withdrawal_phone: '', withdrawal_operator: 'MTN', withdrawal_country_code: '+237'
  })

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const CATEGORIES = [
    ['🏥','Santé'],['📚','Éducation'],['💼','Business'],
    ['🚨','Urgence'],['🎨','Culture'],['🌱','Environnement'],['⛪','Religion'],['📦','Autre']
  ]
  const COUNTRIES = [
    ['CM','🇨🇲 Cameroun','+237'],['CD','🇨🇩 RD Congo','+243'],
    ['GA','🇬🇦 Gabon','+241'],['CG','🇨🇬 Congo-Brazza','+242'],
    ['CF','🇨🇫 RCA','+236'],['GQ','🇬🇶 Guinée Éq.','+240'],['TD','🇹🇩 Tchad','+235']
  ]
  const EMOJIS = ['🌍','🏥','📚','💼','🚨','🎨','🌱','⛪','💪','❤️','🤝','✊','🌟','🏡','👨‍👩‍👧','🙏']

  const canNext1 = form.title.length >= 10 && form.description.length >= 30
  const canNext2 = form.goal_amount >= 1000
  const canSubmit = form.withdrawal_phone.length >= 8

  async function handleSubmit() {
    if (!user) { navigate('/connexion'); return }
    setLoading(true); setError('')
    try {
      const data = await api.createCampaign({
        ...form,
        goal_amount: parseInt(form.goal_amount),
        end_date: form.end_date || undefined
      })
      navigate('/dashboard', { state: { newCampaign: data } })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const stepBar = (
    <div style={{ display: 'flex', gap: '.5rem', marginBottom: '2rem' }}>
      {[1,2,3].map(s => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flex: 1 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: step > s ? '#1D9E75' : step === s ? '#085041' : '#e5e5e5',
            color: step >= s ? '#fff' : '#888', fontSize: 13, fontWeight: 700, flexShrink: 0
          }}>{step > s ? '✓' : s}</div>
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: step > s ? '#1D9E75' : '#e5e5e5' }} />
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ maxWidth: 680, margin: '2rem auto', padding: '0 1.5rem' }}>
      <button onClick={() => step > 1 ? setStep(s => s-1) : navigate(-1)} style={{ background: 'none', border: 'none', color: '#1D9E75', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', marginBottom: 16, fontWeight: 500 }}>
        ← {step > 1 ? `Retour à l'étape ${step-1}` : 'Retour'}
      </button>
      <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '2rem', marginBottom: '.5rem' }}>
        {step === 1 ? 'Décrivez votre cagnotte' : step === 2 ? 'Fixez votre objectif' : 'Coordonnées de retrait'}
      </h1>
      <p style={{ color: '#888', marginBottom: '1.5rem', fontSize: 14 }}>Étape {step} sur 3</p>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5', padding: '2rem' }}>
        {stepBar}

        {/* ÉTAPE 1 — Description */}
        {step === 1 && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Titre de votre cagnotte * <span style={{ color: '#aaa', fontWeight: 400 }}>({form.title.length}/100)</span></label>
              <input type="text" maxLength={100} value={form.title} onChange={e => update('title', e.target.value)}
                placeholder="Ex: Opération urgente pour ma mère au CHU de Yaoundé" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Description détaillée * <span style={{ color: '#aaa', fontWeight: 400 }}>({form.description.length}/2000)</span></label>
              <textarea maxLength={2000} value={form.description} onChange={e => update('description', e.target.value)}
                placeholder="Expliquez votre situation, pourquoi vous avez besoin d'aide et comment les fonds seront utilisés..."
                rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Catégorie *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.4rem' }}>
                {CATEGORIES.map(([emoji, cat]) => (
                  <button key={cat} onClick={() => update('category', cat)} style={{
                    padding: '8px 4px', border: `1.5px solid ${form.category === cat ? '#1D9E75' : '#e5e5e5'}`,
                    borderRadius: 8, background: form.category === cat ? '#E1F5EE' : '#fff',
                    color: form.category === cat ? '#085041' : '#1a1a1a', fontSize: 12, fontWeight: 500, cursor: 'pointer'
                  }}>{emoji} {cat}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>Pays *</label>
                <select value={form.country} onChange={e => { update('country', e.target.value); update('withdrawal_country_code', COUNTRIES.find(c=>c[0]===e.target.value)?.[2]||'+237') }}
                  style={{ ...inputStyle, background: '#fff' }}>
                  {COUNTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Ville</label>
                <input type="text" value={form.city} onChange={e => update('city', e.target.value)}
                  placeholder="Douala, Kinshasa..." style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Icône de la cagnotte</label>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => update('cover_emoji', e)} style={{
                    width: 40, height: 40, border: `2px solid ${form.cover_emoji === e ? '#1D9E75' : '#e5e5e5'}`,
                    borderRadius: 8, background: form.cover_emoji === e ? '#E1F5EE' : '#fff', fontSize: '1.3rem', cursor: 'pointer'
                  }}>{e}</button>
                ))}
              </div>
            </div>
            <button disabled={!canNext1} onClick={() => setStep(2)} style={{
              width: '100%', padding: 14, background: canNext1 ? '#1D9E75' : '#ccc',
              color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
              cursor: canNext1 ? 'pointer' : 'not-allowed'
            }}>Continuer →</button>
            {!canNext1 && <p style={{ textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: '.5rem' }}>Titre (min 10 car.) et description (min 30 car.) requis</p>}
          </>
        )}

        {/* ÉTAPE 2 — Objectif */}
        {step === 2 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={labelStyle}>Montant cible * (min 1 000)</label>
                <input type="number" min={1000} value={form.goal_amount} onChange={e => update('goal_amount', parseInt(e.target.value)||'')}
                  placeholder="500 000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Devise</label>
                <div style={{ display: 'flex', gap: '.4rem' }}>
                  {['XAF','CDF','EUR'].map(c => (
                    <button key={c} onClick={() => update('currency', c)} style={{
                      flex: 1, padding: 10, border: `1.5px solid ${form.currency === c ? '#1D9E75' : '#e5e5e5'}`,
                      borderRadius: 8, background: form.currency === c ? '#E1F5EE' : '#fff',
                      color: form.currency === c ? '#085041' : '#1a1a1a', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                    }}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Date limite (optionnel)</label>
              <input type="date" value={form.end_date} onChange={e => update('end_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]} style={inputStyle} />
              <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Sans date limite, votre cagnotte reste active indéfiniment.</p>
            </div>
            {form.goal_amount >= 1000 && (
              <div style={{ background: '#E1F5EE', borderRadius: 10, padding: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: 13, color: '#085041', fontWeight: 600, marginBottom: '.5rem' }}>Récapitulatif</div>
                <div style={{ fontSize: 14, color: '#0F6E56' }}>
                  Objectif : <strong>{parseInt(form.goal_amount).toLocaleString()} {form.currency}</strong><br/>
                  Frais plateforme (2%) : <strong>{Math.round(parseInt(form.goal_amount)*0.02).toLocaleString()} {form.currency}</strong><br/>
                  Vous recevrez : <strong>{Math.round(parseInt(form.goal_amount)*0.98).toLocaleString()} {form.currency}</strong>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: 12, border: '1.5px solid #e5e5e5', borderRadius: 8, background: 'transparent', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>← Retour</button>
              <button disabled={!canNext2} onClick={() => setStep(3)} style={{
                flex: 2, padding: 12, background: canNext2 ? '#1D9E75' : '#ccc',
                color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                cursor: canNext2 ? 'pointer' : 'not-allowed'
              }}>Continuer →</button>
            </div>
          </>
        )}

        {/* ÉTAPE 3 — Retrait */}
        {step === 3 && (
          <>
            <div style={{ background: '#FAEEDA', borderRadius: 8, padding: '1rem', marginBottom: '1.25rem', fontSize: 13 }}>
              ⚠️ Ces coordonnées serviront à transférer les fonds collectés sur votre Mobile Money.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>Prénom *</label>
                <input type="text" placeholder="Jean" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Nom *</label>
                <input type="text" placeholder="Mballa" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Numéro Mobile Money *</label>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <select value={form.withdrawal_country_code} onChange={e => update('withdrawal_country_code', e.target.value)}
                  style={{ ...inputStyle, width: 'auto', minWidth: 100 }}>
                  {COUNTRIES.map(([, label, code]) => <option key={code} value={code}>{code}</option>)}
                </select>
                <input type="tel" value={form.withdrawal_phone} onChange={e => update('withdrawal_phone', e.target.value)}
                  placeholder="6XXXXXXXX" style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Opérateur Mobile Money *</label>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                {['MTN','ORANGE','AIRTEL','MOOV'].map(op => (
                  <button key={op} onClick={() => update('withdrawal_operator', op)} style={{
                    flex: 1, padding: 10, border: `1.5px solid ${form.withdrawal_operator === op ? '#1D9E75' : '#e5e5e5'}`,
                    borderRadius: 8, background: form.withdrawal_operator === op ? '#E1F5EE' : '#fff',
                    color: form.withdrawal_operator === op ? '#085041' : '#1a1a1a', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                  }}>{op}</button>
                ))}
              </div>
            </div>
            {error && <div style={{ padding: '.75rem', borderRadius: 8, background: '#FAECE7', color: '#D85A30', border: '1px solid #F5C4B3', fontSize: 13, marginBottom: '1rem' }}>⚠️ {error}</div>}
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: 12, border: '1.5px solid #e5e5e5', borderRadius: 8, background: 'transparent', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>← Retour</button>
              <button disabled={!canSubmit || loading} onClick={handleSubmit} style={{
                flex: 2, padding: 12, background: (canSubmit && !loading) ? '#1D9E75' : '#ccc',
                color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                cursor: (canSubmit && !loading) ? 'pointer' : 'not-allowed'
              }}>
                {loading ? '⏳ Publication...' : '🚀 Publier ma cagnotte'}
              </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: '.75rem' }}>
              Votre cagnotte sera vérifiée par notre équipe avant d'être publiée (sous 24h).
            </p>
          </>
        )}
      </div>
    </div>
  )
}
