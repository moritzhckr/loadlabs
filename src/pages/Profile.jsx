import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { User, Loader2, Save, ArrowLeft, Sun, Moon, Scale, Ruler, Heart, MapPin } from 'lucide-react'

const API_URL = (import.meta.env.VITE_API_URL || 'http://192.168.20.112:8000') + '/api/v1'

export default function ProfilePage() {
  const { token, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [metrics, setMetrics] = useState([])
  
  const [formData, setFormData] = useState({
    weight: 70,
    height: '',
    resting_hr: '',
    max_hr: '',
    timezone: 'UTC',
    location: ''
  })

  useEffect(() => {
    fetchProfile()
    fetchMetrics()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setFormData({
          weight: data.weight || 70,
          height: data.height || '',
          resting_hr: data.resting_hr || '',
          max_hr: data.max_hr || '',
          timezone: data.timezone || 'UTC',
          location: data.location || ''
        })
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    }
    setLoading(false)
  }

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_URL}/metrics?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMetrics(data)
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    
    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          weight: parseFloat(formData.weight),
          height: formData.height ? parseFloat(formData.height) : null,
          resting_hr: formData.resting_hr ? parseInt(formData.resting_hr) : null,
          max_hr: formData.max_hr ? parseInt(formData.max_hr) : null,
          timezone: formData.timezone,
          location: formData.location || null
        })
      })
      
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save profile:', err)
    }
    
    setSaving(false)
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
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
            <div className="bg-gradient-to-tr from-purple-500 to-purple-400 p-2 rounded-xl">
              <User className="text-white h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold">Profil</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-[var(--ring)] transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={logout} className="text-sm text-red-500 hover:text-red-600">Ausloggen</button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 space-y-6">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Körperdaten */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Körperdaten</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">
                  <Scale className="w-4 h-4 inline mr-1" /> Gewicht (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">
                  <Ruler className="w-4 h-4 inline mr-1" /> Größe (cm)
                </label>
                <input
                  type="number"
                  step="1"
                  value={formData.height}
                  onChange={(e) => handleChange('height', e.target.value)}
                  placeholder="175"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">
                  <Heart className="w-4 h-4 inline mr-1" /> Ruhepuls (bpm)
                </label>
                <input
                  type="number"
                  value={formData.resting_hr}
                  onChange={(e) => handleChange('resting_hr', e.target.value)}
                  placeholder="60"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">
                  <Heart className="w-4 h-4 inline mr-1" /> Max. Puls (bpm)
                </label>
                <input
                  type="number"
                  value={formData.max_hr}
                  onChange={(e) => handleChange('max_hr', e.target.value)}
                  placeholder="190"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Standort */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Standort</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-500 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" /> Ort
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="Berlin, Germany"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">Zeitzone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="UTC">UTC</option>
                  <option value="Europe/Berlin">Europe/Berlin</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Speichern Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-medium"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Speichere...' : 'Änderungen speichern'}
          </button>
          
          {saved && (
            <div className="text-center text-green-500 font-medium">
              ✓ Profil erfolgreich gespeichert!
            </div>
          )}
        </form>

        {/* Gewichtsverlauf */}
        {metrics.length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Gewichtsverlauf</h2>
            <div className="space-y-2">
              {metrics.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-sm text-slate-500">
                    {new Date(m.date).toLocaleDateString('de-DE')}
                  </span>
                  <span className="font-medium">{m.weight} kg</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
