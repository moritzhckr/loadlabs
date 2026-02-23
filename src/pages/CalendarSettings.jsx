import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { Calendar, Upload, Trash2, Loader2, Check, X, Link } from 'lucide-react'

const API_URL = (import.meta.env.VITE_API_URL || 'http://192.168.20.112:8000') + '/api/v1'

export default function CalendarSettings() {
  const { token } = useAuth()
  const fileInputRef = useRef(null)
  
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [calendarUrl, setCalendarUrl] = useState('')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/calendar/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
      }
    } catch (err) {
      console.error('Failed to fetch calendar events:', err)
    }
    setLoading(false)
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setImporting(true)
    setImportResult(null)
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const res = await fetch(`${API_URL}/calendar/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      
      if (res.ok) {
        setImportResult({ success: true, message: data.message })
        fetchEvents()
      } else {
        setImportResult({ success: false, error: data.detail })
      }
    } catch (err) {
      setImportResult({ success: false, error: err.message })
    }
    
    setImporting(false)
  }

  const handleUrlImport = async () => {
    if (!calendarUrl.trim()) return
    
    setImporting(true)
    setImportResult(null)
    
    try {
      const res = await fetch(`${API_URL}/calendar/import-url?url=${encodeURIComponent(calendarUrl)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (res.ok) {
        setImportResult({ success: true, message: data.message })
        fetchEvents()
        setCalendarUrl('')
      } else {
        setImportResult({ success: false, error: data.detail })
      }
    } catch (err) {
      setImportResult({ success: false, error: err.message })
    }
    
    setImporting(false)
  }

  const clearEvents = async () => {
    if (!confirm('Alle Kalender-Einträge löschen?')) return
    
    try {
      await fetch(`${API_URL}/calendar/events`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setEvents([])
    } catch (err) {
      console.error('Failed to clear events:', err)
    }
  }

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('de-DE', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-blue-500/20 p-3 rounded-xl">
          <Calendar className="text-blue-500 w-6 h-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Kalender</h2>
          <p className="text-sm text-slate-500">iCal Import (.ics Datei)</p>
        </div>
        {events.length > 0 && (
          <button
            onClick={clearEvents}
            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
            title="Alle löschen"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Import */}
      <div className="mb-6">
        <input
          type="file"
          ref={fileInputRef}
          accept=".ics"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium"
        >
          {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          {importing ? 'Importiere...' : 'iCal Datei hochladen'}
        </button>
      </div>

      {/* URL Import */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-500 mb-2">
          <Link className="w-4 h-4 inline mr-1" /> Oder .ics URL einfügen
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={calendarUrl}
            onChange={(e) => setCalendarUrl(e.target.value)}
            placeholder="https://calendar.google.com/calendar/ical/..."
            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleUrlImport}
            disabled={importing || !calendarUrl.trim()}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium"
          >
            Import
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Google Calendar: Kalender → Einstellungen → Kalender exportieren → "ICAL" Link kopieren
        </p>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className={`p-4 rounded-xl mb-6 ${
          importResult.success 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }`}>
          {importResult.success ? (
            <span className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              {importResult.message}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <X className="w-5 h-5" />
              {importResult.error}
            </span>
          )}
        </div>
      )}

      {/* Events List */}
      {events.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-500 mb-3">
            {events.length} Termin{events.length !== 1 ? 'e' : ''}
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.slice(0, 10).map((event) => (
              <div key={event.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="font-medium text-sm line-clamp-1">{event.title}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {formatDateTime(event.start)} - {formatDateTime(event.end)}
                </div>
              </div>
            ))}
            {events.length > 10 && (
              <div className="text-sm text-slate-500 text-center py-2">
                + {events.length - 10} mehr
              </div>
            )}
          </div>
        </div>
      )}

      {events.length === 0 && !importResult && (
        <div className="text-center text-slate-500 py-4">
          Noch keine Kalender-Einträge importiert
        </div>
      )}
    </div>
  )
}
