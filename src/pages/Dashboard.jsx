import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { LogOut, Zap, CalendarDays, BarChart2, TrendingUp, Clock, Map, Heart, CheckCircle2, AlertCircle, Settings, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const API_URL = (import.meta.env.VITE_API_URL || 'http://192.168.20.112:8000') + '/api/v1'

const TIME_RANGES = [
  { label: '7T', days: 7 },
  { label: '14T', days: 14 },
  { label: '30T', days: 30 },
  { label: '60T', days: 60 },
  { label: '90T', days: 90 },
  { label: '20W', days: 140 },
]

export default function Dashboard() {
  const { token, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [athlete, setAthlete] = useState(null)
  const [activities, setActivities] = useState([])
  const [weekStats, setWeekStats] = useState(null)
  const [trainingLoad, setTrainingLoad] = useState(null)
  const [trainingSessions, setTrainingSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState(7)
  const [view, setView] = useState('dashboard')
  const [oauthStatus, setOauthStatus] = useState({ strava: false, notion: false })

  useEffect(() => {
    fetchOauthStatus()
  }, [])

  useEffect(() => {
    fetchData()
  }, [selectedRange])

  useEffect(() => {
    if (view === 'kanban') {
      setTimeout(() => {
        const todayCol = document.querySelector('.kanban-column-today')
        if (todayCol) {
          todayCol.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        }
      }, 200)
    }
  }, [view, loading])

  const fetchData = async () => {
    setLoading(true)
    try {
      const headers = {
        'Authorization': `Bearer ${token}`
      }

      const [athleteRes, activitiesRes, statsRes, loadRes, sessionsRes] = await Promise.allSettled([
        fetch(`${API_URL}/athlete`, { headers }),
        fetch(`${API_URL}/activities?limit=100`, { headers }),
        fetch(`${API_URL}/stats/week?days=${selectedRange}`, { headers }),
        fetch(`${API_URL}/stats/training-load`, { headers }),
        fetch(`${API_URL}/training-sessions?days=90`, { headers })
      ])

      setAthlete(athleteRes.status === 'fulfilled' && athleteRes.value.ok ? await athleteRes.value.json() : null)
      setActivities(activitiesRes.status === 'fulfilled' && activitiesRes.value.ok ? await activitiesRes.value.json() : [])
      setWeekStats(statsRes.status === 'fulfilled' && statsRes.value.ok ? await statsRes.value.json() : null)
      setTrainingLoad(loadRes.status === 'fulfilled' && loadRes.value.ok ? await loadRes.value.json() : null)
      setTrainingSessions(sessionsRes.status === 'fulfilled' && sessionsRes.value.ok ? await sessionsRes.value.json() : [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const fetchOauthStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/oauth/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setOauthStatus(await res.json())
      }
    } catch (err) {
      console.error('Error fetching OAuth status:', err)
    }
  }

  const connectStrava = async () => {
    try {
      const res = await fetch(`${API_URL}/oauth/strava/authorize`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Error connecting Strava:', err)
    }
  }

  const getTypeEmoji = (type) => {
    const emojis = { Ride: '🚴', Run: '🏃', Swim: '🏊', Yoga: '🧘', Strength: '💪', Rest: '😴', VirtualRide: '🚴' }
    return emojis[type] || '🏃'
  }

  const buildKanbanData = () => {
    const now = new Date()
    const todayStr = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0')

    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset)
    monday.setHours(0, 0, 0, 0)

    const days = []
    for (let i = -3; i <= 10; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)

      const dateStr = date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0')

      const isToday = dateStr === todayStr
      const isPast = dateStr < todayStr

      const planned = trainingSessions.filter(s => s.date === dateStr)
      const completed = activities.filter(a => {
        if (!a.start_date_local) return false
        const actDate = a.start_date_local.substring(0, 10)
        return actDate === dateStr
      })

      const plannedKm = planned.reduce((sum, p) => sum + (p.distance || 0), 0)
      const actualKm = completed.reduce((sum, a) => sum + (a.distance || 0) / 1000, 0)

      let status = 'on-track'
      if (isPast && planned.length > 0) {
        if (actualKm < plannedKm * 0.5) status = 'under-trained'
        else if (actualKm > plannedKm * 1.5) status = 'over-trained'
      }

      days.push({
        date: date,
        dateStr: dateStr,
        dayName: date.toLocaleDateString('de-DE', { weekday: 'short' }),
        dayNum: date.getDate(),
        month: date.toLocaleDateString('de-DE', { month: 'short' }),
        isPast,
        isToday,
        planned,
        completed,
        plannedKm,
        actualKm,
        status
      })
    }
    return days
  }

  if (loading) return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--ring)]"></div>
    </div>
  )

  const kanbanData = buildKanbanData()

  const chartData = weekStats?.activities_by_day
    ? Object.entries(weekStats.activities_by_day).map(([date, data]) => ({
      date: formatDate(date),
      distance: Math.round(data.distance * 10) / 10,
      time: Math.round(data.time * 10) / 10
    })).sort((a, b) => new Date(a.date) - new Date(b.date))
    : []

  const loadChartData = trainingLoad?.daily_tss
    ? Object.entries(trainingLoad.daily_tss).map(([date, tss]) => ({
      date: new Date(date).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' }),
      tss: Math.round(tss)
    })).sort((a, b) => new Date(a.date) - new Date(b.date))
    : []

  return (
    <div className="min-h-screen bg-[var(--background)] pb-12 transition-colors duration-300">
      {/* Premium Navbar */}
      <nav className="glass sticky top-0 z-50 px-4 sm:px-6 lg:px-8 py-4 mb-8 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-[var(--ring)] to-purple-400 p-2 rounded-xl shadow-lg shadow-purple-500/20">
              <Zap className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                LoadLabs
              </h1>
              {athlete && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Willkommen zurück, {athlete.firstname}</p>}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl flex gap-1 border border-slate-200 dark:border-slate-700/50">
              <button
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <BarChart2 className="w-4 h-4" />
                <span className="hidden sm:inline">Stats</span>
              </button>
              <button
                onClick={() => setView('kanban')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'kanban' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
            </div>

            <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-[var(--ring)] transition-colors bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[var(--ring)]">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button onClick={() => navigate('/settings')} className="p-2 text-slate-400 hover:text-[var(--ring)] transition-colors bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[var(--ring)]">
              <Settings className="w-5 h-5" />
            </button>

            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* OAuth Connection Banner */}
        {!oauthStatus.strava && (
          <div className="mb-6 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500/20 p-2 rounded-lg">
                <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116z"/><path d="M7.778 13.828L12.17 2.4c.285-.77.892-1.228 1.588-1.228h2.735c.696 0 1.303.458 1.588 1.228l4.392 11.428c.285.77.053 1.656-.642 2.088l-6.12 3.815c-.696.434-1.634.434-2.33 0L6.7 15.916c-.695-.432-.836-1.318-.55-2.088l.628-2.814z"/></svg>
              </div>
              <div>
                <p className="font-medium text-slate-800 dark:text-white">Verbinde Strava</p>
                <p className="text-sm text-slate-500">Um deine Aktivitäten zu importieren</p>
              </div>
            </div>
            <button 
              onClick={connectStrava}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              Verbinden
            </button>
          </div>
        )}

        {view === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Training Load Header Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 flex transform group-hover:scale-110 transition-transform"><TrendingUp className="w-24 h-24 text-green-500" /></div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Fitness (CTL)</h3>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${trainingLoad?.ctl > trainingLoad?.atl ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-white'}`}>{trainingLoad?.ctl || 0}</span>
                  <span className="text-sm font-medium text-slate-400">TSS/Tag</span>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 flex transform group-hover:scale-110 transition-transform"><Clock className="w-24 h-24 text-purple-500" /></div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Müdigkeit (ATL)</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-purple-600 dark:text-purple-400">{trainingLoad?.atl || 0}</span>
                  <span className="text-sm font-medium text-slate-400">TSS/Tag</span>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 flex transform group-hover:scale-110 transition-transform"><Zap className="w-24 h-24 text-purple-500" /></div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Form (TSB)</h3>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${trainingLoad?.tsb >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400'}`}>{trainingLoad?.tsb > 0 && '+'}{trainingLoad?.tsb || 0}</span>
                  <span className="text-sm font-medium text-slate-400">Balance</span>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[var(--ring)]" /> Training Load Trend
                  </h3>
                </div>
                <div className="h-[250px] w-full min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                    <AreaChart data={loadChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', background: 'rgba(15,23,42,0.9)', border: 'none', color: '#fff' }} />
                      <Area type="monotone" dataKey="tss" stroke="var(--ring)" strokeWidth={3} fillOpacity={1} fill="url(#colorTss)" />
                      <defs>
                        <linearGradient id="colorTss" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--ring)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--ring)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Map className="w-5 h-5 text-[var(--ring)]" /> Distanz Historie
                  </h3>
                  <div className="flex gap-2 flex-wrap bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg">
                    {TIME_RANGES.map(range => (
                      <button
                        key={range.days}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${selectedRange === range.days ? 'bg-white dark:bg-slate-700 text-[var(--ring)] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                        onClick={() => setSelectedRange(range.days)}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Distanz</div>
                    <div className="text-lg font-bold text-slate-800 dark:text-white">{weekStats?.total_distance || 0} km</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Zeit</div>
                    <div className="text-lg font-bold text-slate-800 dark:text-white">{formatTime(weekStats?.total_time || 0)}</div>
                  </div>
                </div>

                <div className="h-[146px] w-full min-h-[146px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={146}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ borderRadius: '12px', background: 'rgba(15,23,42,0.9)', border: 'none', color: '#fff', fontSize: '13px' }} />
                      <Bar dataKey="distance" fill="url(#colorBar)" radius={[4, 4, 0, 0]} name="km" />
                      <defs>
                        <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fc4c02" />
                          <stop offset="100%" stopColor="#e34402" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-[var(--ring)]" /> Nächste Einheiten
                  </h3>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-3">
                  {trainingSessions.slice(0, 5).map(session => (
                    <div key={session.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                      <div className="text-2xl mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shadow-inner">{getTypeEmoji(session.type)}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800 dark:text-white text-sm">{session.name}</h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{session.date && new Date(session.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                          {session.duration && <span>{session.duration}m</span>}
                          {session.distance && <span>{session.distance}km</span>}
                        </div>
                        {session.description && <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 line-clamp-2">{session.description}</p>}
                      </div>
                    </div>
                  ))}
                  {trainingSessions.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8">
                      <CalendarDays className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm">Keine Einheiten geplant</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[var(--ring)]" /> Letzte Aktivitäten
                  </h3>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-3 max-h-[450px] overflow-y-auto custom-scrollbar">
                  {activities.slice(0, 15).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="text-xl bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">{getTypeEmoji(activity.type)}</div>
                        <div>
                          <h4 className="font-semibold text-slate-800 dark:text-white text-sm w-40 sm:w-64 truncate">{activity.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDate(activity.start_date_local)}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="font-bold text-slate-800 dark:text-white text-sm">{(activity.distance / 1000).toFixed(1)} km</span>
                        <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                          <span>{formatTime(activity.moving_time)}</span>
                          {activity.average_heartrate && <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-red-500" /> {Math.round(activity.average_heartrate)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-slate-400 py-8">
                      <p className="text-sm">Noch keine Aktivitäten hochgeladen</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {view === 'kanban' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-4">
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
              {kanbanData.map((day, idx) => (
                <div
                  key={idx}
                  className={`flex-none w-[280px] sm:w-[320px] rounded-2xl flex flex-col snap-center transition-all ${day.isToday
                    ? 'kanban-column-today border-2 border-[var(--ring)] bg-[var(--card)] shadow-xl shadow-orange-500/10'
                    : day.isPast
                      ? 'bg-slate-100/50 dark:bg-slate-800/30'
                      : 'bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700'
                    }`}
                >
                  <div className={`p-4 border-b ${day.isToday ? 'border-[var(--ring)]/20' : 'border-slate-200 dark:border-slate-700/50'} flex justify-between items-end`}>
                    <div>
                      <span className={`block font-bold text-lg ${day.isToday ? 'text-[var(--ring)]' : 'text-slate-800 dark:text-white'}`}>{day.dayName}</span>
                      <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{day.dayNum}. {day.month}</span>
                    </div>
                    {day.isToday && <span className="px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 rounded-md text-xs font-bold uppercase tracking-widest">Heute</span>}
                  </div>

                  <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto">
                    {/* Future: Planned */}
                    {!day.isPast && !day.isToday && day.planned.map((session, i) => (
                      <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm border-l-4 border-l-indigo-500">
                        <div className="flex items-center gap-3">
                          <span className="text-xl bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg">{getTypeEmoji(session.type)}</span>
                          <div>
                            <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">{session.name}</div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5">{session.duration}min • {session.distance}km</div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Past & Today: Completed vs Planned */}
                    {(day.isPast || day.isToday) && day.completed.map((activity, i) => (
                      <a key={i} href={`https://www.strava.com/activities/${activity.strava_id}`} target="_blank" rel="noopener noreferrer" className="block group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm hover:border-[var(--ring)] transition-colors border-l-4 border-l-green-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity"><ArrowRight className="w-4 h-4 text-slate-400" /></div>
                        <div className="flex items-center gap-3">
                          <span className="text-xl bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg">{getTypeEmoji(activity.type)}</span>
                          <div>
                            <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">{activity.name.slice(0, 25)}</div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5">{(activity.distance / 1000).toFixed(1)}km • {formatTime(activity.moving_time)}</div>
                          </div>
                        </div>
                      </a>
                    ))}

                    {/* Status badges */}
                    {(day.isPast || day.isToday) && day.planned.length > 0 && (
                      <div className={`mt-auto text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 justify-center ${day.status === 'under-trained' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                        day.status === 'over-trained' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' :
                          'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                        }`}>
                        {day.status === 'under-trained' ? <AlertCircle className="w-4 h-4" /> : day.status === 'over-trained' ? <TrendingUp className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>{day.status === 'under-trained' ? 'Zu wenig erfüllt' : day.status === 'over-trained' ? 'Mehr als geplant' : 'Soll erfüllt'}</span>
                      </div>
                    )}

                    {(day.isPast || day.isToday) && day.completed.length === 0 && day.planned.length > 0 && (
                      <div className="mt-auto text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 justify-center bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Ausgefallen</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
