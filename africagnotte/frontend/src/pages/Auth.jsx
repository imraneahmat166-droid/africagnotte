import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const inputStyle = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #e5e5e5',
  borderRadius: 8, fontFamily: 'inherit', fontSize: 14,
  boxSizing: 'border-box', outline: 'none', transition: 'border .2s'
}

export function Connexion() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await signIn(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect'
        : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🌍</div>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.8rem', marginBottom: '.25rem' }}>Bon retour !</h1>
          <p style={{ color: '#888', fontSize: 14 }}>Connectez-vous à votre compte AfriCagnotte</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: '.4rem' }}>Email *</label>
              <input type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="jean@email.com" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>Mot de passe *</label>
                <Link to="/mot-de-passe-oublie" style={{ fontSize: 12, color: '#1D9E75', textDecoration: 'none' }}>Oublié ?</Link>
              </div>
              <input type="password" required value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••" style={inputStyle} />
            </div>
            {error && (
              <div style={{ padding: '.75rem 1rem', borderRadius: 8, background: '#FAECE7', color: '#D85A30', border: '1px solid #F5C4B3', fontSize: 13, marginBottom: '1rem' }}>
                ⚠️ {error}
              </div>
            )}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 14, background: loading ? '#9FE1CB' : '#1D9E75',
              color: '#fff', border: 'none', borderRadius: 10,
              fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer'
            }}>
              {loading ? '⏳ Connexion...' : 'Se connecter'}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#888', marginTop: '1.25rem' }}>
            Pas encore de compte ?{' '}
            <Link to="/inscription" style={{ color: '#1D9E75', fontWeight: 600, textDecoration: 'none' }}>Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export function Inscription() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [form, setForm]       = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas'); return }
    if (form.password.length < 8) { setError('Mot de passe minimum 8 caractères'); return }
    setError(''); setLoading(true)
    try {
      await signUp({ email: form.email, password: form.password, fullName: form.fullName })
      setSuccess(true)
    } catch (err) {
      setError(err.message === 'User already registered'
        ? 'Un compte existe déjà avec cet email'
        : err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ width: 72, height: 72, background: '#E1F5EE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.5rem' }}>✅</div>
        <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.6rem', marginBottom: '.75rem' }}>Compte créé !</h2>
        <p style={{ color: '#555', marginBottom: '1.5rem' }}>Un email de confirmation a été envoyé à <strong>{form.email}</strong>. Cliquez sur le lien pour activer votre compte.</p>
        <button onClick={() => navigate('/connexion')} style={{ padding: '12px 28px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>
          Aller à la connexion
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🌍</div>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.8rem', marginBottom: '.25rem' }}>Créer un compte</h1>
          <p style={{ color: '#888', fontSize: 14 }}>Rejoignez la communauté AfriCagnotte</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            {[
              ['fullName', 'text', 'Nom complet *', 'Jean Mballa'],
              ['email',    'email', 'Email *',      'jean@email.com'],
              ['password', 'password', 'Mot de passe * (min. 8 caractères)', '••••••••'],
              ['confirm',  'password', 'Confirmer le mot de passe *', '••••••••'],
            ].map(([key, type, label, placeholder]) => (
              <div key={key} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: '.4rem' }}>{label}</label>
                <input type={type} required value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder} style={inputStyle} />
              </div>
            ))}
            {error && (
              <div style={{ padding: '.75rem 1rem', borderRadius: 8, background: '#FAECE7', color: '#D85A30', border: '1px solid #F5C4B3', fontSize: 13, marginBottom: '1rem' }}>
                ⚠️ {error}
              </div>
            )}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 14, background: loading ? '#9FE1CB' : '#1D9E75',
              color: '#fff', border: 'none', borderRadius: 10,
              fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer'
            }}>
              {loading ? '⏳ Création...' : 'Créer mon compte 🚀'}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#888', marginTop: '1.25rem' }}>
            Déjà un compte ?{' '}
            <Link to="/connexion" style={{ color: '#1D9E75', fontWeight: 600, textDecoration: 'none' }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
