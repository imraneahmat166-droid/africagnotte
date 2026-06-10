import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn({ email: form.email, password: form.password })
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
    <div style={{ maxWidth: 420, margin: '4rem auto', padding: '0 1.5rem' }}>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5', padding: '2rem' }}>
        <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.6rem', marginBottom: '.5rem', textAlign: 'center' }}>Connexion</h1>
        <p style={{ color: '#888', fontSize: 14, marginBottom: '1.5rem', textAlign: 'center' }}>
          Accédez à votre espace AfriCagnotte
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: '.4rem' }}>Email</label>
            <input
              type="email" required placeholder="jean@email.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: '.4rem' }}>Mot de passe</label>
            <input
              type="password" required placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {error && (
            <div style={{ padding: '.75rem 1rem', borderRadius: 8, background: '#FAECE7', color: '#D85A30', border: '1px solid #F5C4B3', fontSize: 13, marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 14, background: '#1D9E75', color: '#fff', border: 'none',
            borderRadius: 10, fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
            cursor: loading ? 'default' : 'pointer', opacity: loading ? .7 : 1
          }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#888', marginTop: '1.5rem' }}>
          Pas encore de compte ?{' '}
          <Link to="/inscription" style={{ color: '#1D9E75', fontWeight: 600, textDecoration: 'none' }}>Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}
