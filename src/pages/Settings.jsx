import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Settings, Loader2, Activity, Link, Unlink, RefreshCw, Check, X, ArrowLeft } from 'lucide-react'

const API_URL = (import.meta.env.VITE_API_URL || 'http://192.168.20.112:8000') + '/api/v1'

export default function SettingsPage() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [stravaStatus, setStravaStatus] = useState({ connected: false, expires_at: null })
  const [notionStatus, setNotionStatus] = useState({ connected: false, expires_at: null })
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [activities, setActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(false)

  useEffect(() => {
    fetchOAuthStatus()
  }, [])

  const fetchOAuthStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/oauth/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStravaStatus(data.strava)
        setNotionStatus(data.notion)
      }
    } catch (err) {
      console.error('Failed to fetch OAuth status:', err)
    }
    setLoading(false)
  }

  const connectStrava = async () => {
    setConnecting(true)
    try {
      const res = await fetch(`${API_URL}/oauth/strava/authorize`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.url) {
        sessionStorage.setItem('strava_oauth_pending', 'true')
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Failed to start Strava OAuth:', err)
      setConnecting(false)
    }
  }

  const disconnectStrava = async () => {
    if (!confirm('Strava-Verbindung wirklich entfernen?')) return
    
    setDisconnecting(true)
    try {
      const res = await fetch(`${API_URL}/oauth/strava/disconnect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setStravaStatus({ connected: false, expires_at: null })
        setActivities([])
      }
    } catch (err) {
      console.error('Failed to disconnect:', err)
    }
    setDisconnecting(false)
  }

  const syncActivities = async () => {
    setSyncing(true)
    setSyncResult(null)
    
    try {
      const res = await fetch(`${API_URL}/strava/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (res.ok) {
        setSyncResult({ success: true, count: data.new_activities })
        loadActivities()
      } else {
        setSyncResult({ success: false, error: data.detail || 'Fehler' })
      }
    } catch (err) {
      setSyncResult({ success: false, error: err.message })
    }
    
    setSyncing(false)
  }

  const loadActivities = async () => {
    if (!stravaStatus.connected) return
    
    setLoadingActivities(true)
    try {
      const res = await fetch(`${API_URL}/strava/activities?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setActivities(data)
      }
    } catch (err) {
      console.error('Failed to load activities:', err)
    }
    setLoadingActivities(false)
  }

  useEffect(() => {
    if (stravaStatus.connected) {
      loadActivities()
    }
  }, [stravaStatus.connected])

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unbekannt'
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const getSportIcon = (type) => {
    const icons = {
      'Run': '🏃', 'Ride': '🚴', 'Swim': '🏊',
      'Walk': '🚶', 'Workout': '💪', 'WeightTraining': '🏋️',
      'Yoga': '🧘', 'Rowing': '🚣'
    }
    return icons[type] || '🏃'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pb-12">
      <nav className="glass sticky top-0 z-50 px-4 sm:px-6 lg:px-8 py-4 mb-8 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="bg-gradient-to-tr from-orange-500 to-orange-400 p-2 rounded-xl">
              <Settings className="text-white h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold">Einstellungen</h1>
          </div>
          <button onClick={logout} className="text-sm text-red-500 hover:text-red-600">Ausloggen</button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 space-y-6">
        
        {/* Strava */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-orange-500/20 p-3 rounded-xl">
              <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116z"/>
                <path d="M7.778 13.828L12.17 2.4c.285-.77.892-1.228 1.588-1.228h2.735c.696 0 1.303.458 1.588 1.228l4.392 11.428c.285.77.053 1.656-.642 2.088l-6.12 3.815c-.696.434-1.634.434-2.33 0L6.7 15.916c-.695-.432-.836-1.318-.55-2.088l.628-2.814z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Strava</h2>
              <p className="text-sm text-slate-500">
                {stravaStatus.connected ? `Verbunden bis ${formatDate(stravaStatus.expires_at)}` : 'Synchronisiere deine Aktivitäten'}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              stravaStatus.connected 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {stravaStatus.connected ? (
                <span className="flex items-center gap-1"><Check className="w-4 h-4" /> Verbunden</span>
              ) : (
                <span className="flex items-center gap-1"><X className="w-4 h-4" /> Nicht verbunden</span>
              )}
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            {!stravaStatus.connected ? (
              <button
                onClick={connectStrava}
                disabled={connecting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-medium"
              >
                {connecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link className="w-5 h-5" />}
                {connecting ? 'Verbinde...' : 'Mit Strava verbinden'}
              </button>
            ) : (
              <>
                <button
                  onClick={syncActivities}
                  disabled={syncing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-medium"
                >
                  {syncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                  {syncing ? 'Synchronisiere...' : 'Jetzt synchronisieren'}
                </button>
                <button
                  onClick={disconnectStrava}
                  disabled={disconnecting}
                  className="px-4 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl font-medium"
                >
                  {disconnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Unlink className="w-5 h-5" />}
                </button>
              </>
            )}
          </div>

          {syncResult && (
            <div className={`p-4 rounded-xl mb-6 ${
              syncResult.success 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              {syncResult.success ? (
                <span className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  {syncResult.count} neue Aktivitäten synchronisiert!
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <X className="w-5 h-5" />
                  {syncResult.error}
                </span>
              )}
            </div>
          )}

          {stravaStatus.connected && activities.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-3">Letzte Aktivitäten</h3>
              <div className="space-y-2">
                {activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getSportIcon(act.type)}</span>
                      <div>
                        <div className="font-medium text-sm line-clamp-1">{act.name}</div>
                        <div className="text-xs text-slate-500">
                          {act.start_date ? new Date(act.start_date).toLocaleDateString('de-DE') : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">{(act.distance / 1000).toFixed(1)} km</div>
                      <div className="text-xs text-slate-500">{formatDuration(act.moving_time)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notion Placeholder */}
        <div className="glass-card rounded-2xl p-6 opacity-60">
          <div className="flex items-center gap-4">
            <div className="bg-slate-200 dark:bg-slate-700 p-3 rounded-xl">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.886l-15.177.887c-.56.047-.747.327-.747.933z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Notion</h2>
              <p className="text-sm text-slate-500">Ziele und Planung - Demnächst</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
