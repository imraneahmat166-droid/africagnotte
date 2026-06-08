/**
 * AfriCagnotte — Client API avec authentification dynamique
 */
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

let _getToken = null

export function setTokenProvider(fn) {
  _getToken = fn
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (_getToken) {
    const token = await _getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (res.status === 401) throw new Error('Session expirée, veuillez vous reconnecter')
  if (res.status === 403) throw new Error('Accès non autorisé')
  if (res.status === 404) throw new Error('Ressource introuvable')
  const data = await res.json().catch(() => ({ error: `Erreur ${res.status}` }))
  if (!res.ok) throw new Error(data.error || `Erreur serveur ${res.status}`)
  return data
}

export const api = {
  getCampaigns: (params = {}) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined && v !== ''))).toString()
    return request(`/api/campaigns${q ? '?' + q : ''}`)
  },
  getCampaign:       (slug)  => request(`/api/campaigns/${slug}`),
  createCampaign:    (body)  => request('/api/campaigns', { method: 'POST', body: JSON.stringify(body) }),
  updateCampaign:    (id, b) => request(`/api/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  deleteCampaign:    (id)    => request(`/api/campaigns/${id}`, { method: 'DELETE' }),
  initiatePayment:   (body)  => request('/api/payments/initiate', { method: 'POST', body: JSON.stringify(body) }),
  checkPayment:      (txId)  => request(`/api/payments/status/${txId}`),
  getDonations:      (cId)   => request(`/api/donations?campaign_id=${cId}`),
  getMe:             ()      => request('/api/users/me'),
  updateMe:          (b)     => request('/api/users/me', { method: 'PATCH', body: JSON.stringify(b) }),
  getMyCampaigns:    ()      => request('/api/users/me/campaigns'),
  getMyTransactions: ()      => request('/api/users/me/transactions'),
  requestWithdrawal: (b)     => request('/api/withdrawals', { method: 'POST', body: JSON.stringify(b) }),
  getAgentsStatus:   ()      => request('/api/agents/status'),
  health:            ()      => request('/health'),
}

// ── Notifications ───────────────────────────────────────
export const notifApi = {
  getNotifications:        (p={}) => request(`/api/notifications?${new URLSearchParams(p)}`),
  markNotificationsRead:   ()     => request('/api/notifications/read-all', { method: 'PATCH' }),
  markOneRead:             (id)   => request(`/api/notifications/${id}/read`, { method: 'PATCH' }),
}
