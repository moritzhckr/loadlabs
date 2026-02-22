import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Check, X, Loader2 } from 'lucide-react'

const API_URL = (import.meta.env.VITE_API_URL || 'http://192.168.20.112:8000') + '/api/v1'

export default function StravaCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const [status, setStatus] = useState('connecting')
  const [message, setMessage] = useState('Verbinde mit Strava...')

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDesc = searchParams.get('error_description')

    if (error || errorDesc) {
      setStatus('error')
      setMessage(errorDesc || error)
      return
    }

    if (!code) {
      setStatus('error')
      setMessage('Kein Authorization Code erhalten')
      return
    }

    if (!token) {
      setStatus('error')
      setMessage('Nicht eingeloggt')
      return
    }

    fetch(`${API_URL}/oauth/strava/callback?code=${code}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setStatus('success')
          setMessage(data.athlete 
            ? `Erfolgreich verbunden als ${data.athlete.firstname} ${data.athlete.lastname}!`
            : 'Erfolgreich mit Strava verbunden!'
          )
        } else {
          setStatus('error')
          setMessage(data.detail || 'Fehler bei der Verbindung')
        }
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.message)
      })
  }, [searchParams, token])

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => navigate('/settings'), 2000)
      return () => clearTimeout(timer)
    }
  }, [status, navigate])

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card rounded-2xl p-8 text-center">
        {status === 'connecting' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verbindung wird hergestellt...</h2>
            <p className="text-slate-500">Bitte warte einen Moment</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-green-600 dark:text-green-400">Erfolgreich!</h2>
            <p className="text-slate-600 dark:text-slate-400">{message}</p>
            <p className="text-sm text-slate-500 mt-4">Weiterleitung...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">Fehler</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{message}</p>
            <button
              onClick={() => navigate('/settings')}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium"
            >
              Zurück zu den Einstellungen
            </button>
          </>
        )}
      </div>
    </div>
  )
}
