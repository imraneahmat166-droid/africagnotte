import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'

export default function NotificationBell() {
  const [open, setOpen]         = useState(false)
  const [notifications, setNotifs] = useState([])
  const [unread, setUnread]     = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    loadNotifs()
    // Vérifier toutes les 30 secondes
    const interval = setInterval(loadNotifs, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadNotifs() {
    try {
      const data = await api.getNotifications?.() || { notifications: [], unread_count: 0 }
      setNotifs(data.notifications || [])
      setUnread(data.unread_count || 0)
    } catch { /* pas connecté */ }
  }

  async function markAllRead() {
    try {
      await api.markNotificationsRead?.()
      setUnread(0)
      setNotifs(ns => ns.map(n => ({ ...n, read: true })))
    } catch { }
  }

  const ICONS = {
    donation_received: '💚',
    campaign_approved: '✅',
    campaign_expiring: '⏰',
    withdrawal_done:   '💰',
    goal_reached:      '🎉',
    default:           '📌'
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(o => !o); if (!open && unread > 0) markAllRead() }}
        style={{ position: 'relative', background: 'none', border: '1.5px solid #e5e5e5', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, background: '#D85A30', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: 44, width: 320, background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,.12)', zIndex: 200, overflow: 'hidden' }}>
          <div style={{ padding: '.75rem 1rem', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', fontSize: 12, color: '#1D9E75', cursor: 'pointer', fontFamily: 'inherit' }}>
                Tout marquer lu
              </button>
            )}
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#888', fontSize: 13 }}>
                Aucune notification pour l'instant
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{ padding: '.75rem 1rem', borderBottom: '1px solid #f5f5f5', background: n.read ? '#fff' : '#f0fdf8', display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{ICONS[n.type] || ICONS.default}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: n.read ? 400 : 600, fontSize: 13 }}>{n.title}</div>
                    {n.body && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{n.body}</div>}
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>{new Date(n.created_at).toLocaleString('fr-FR')}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
