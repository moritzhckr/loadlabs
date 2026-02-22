import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const TIME_RANGES = [
  { label: '7T', days: 7 },
  { label: '14T', days: 14 },
  { label: '30T', days: 30 },
  { label: '60T', days: 60 },
  { label: '90T', days: 90 },
  { label: '20W', days: 140 },
]

function App() {
  const [athlete, setAthlete] = useState(null)
  const [activities, setActivities] = useState([])
  const [weekStats, setWeekStats] = useState(null)
  const [trainingLoad, setTrainingLoad] = useState(null)
  const [trainingSessions, setTrainingSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState(7)
  const [view, setView] = useState('dashboard') // 'dashboard' or 'kanban'
  
  useEffect(() => {
    fetchData()
  }, [selectedRange])
  
  // Scroll to today on kanban view
  useEffect(() => {
    if (view === 'kanban') {
      setTimeout(() => {
        const todayCol = document.querySelector('.kanban-column.today')
        if (todayCol) {
          todayCol.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        }
      }, 200)
    }
  }, [view, loading])
  
  const fetchData = async () => {
    setLoading(true)
    try {
      const [athleteRes, activitiesRes, statsRes, loadRes, sessionsRes] = await Promise.all([
        fetch(`${API_URL}/athlete`),
        fetch(`${API_URL}/activities?limit=100`),
        fetch(`${API_URL}/stats/week?days=${selectedRange}`),
        fetch(`${API_URL}/stats/training-load`),
        fetch(`${API_URL}/training-sessions?days=90`)
      ])
      
      setAthlete(await athleteRes.json())
      setActivities(await activitiesRes.json())
      setWeekStats(await statsRes.json())
      setTrainingLoad(await loadRes.json())
      setTrainingSessions(await sessionsRes.json())
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
  
  const getTypeEmoji = (type) => {
    const emojis = { Ride: '🚴', Run: '🏃', Swim: '🏊', Yoga: '🧘', Strength: '💪', Rest: '😴', VirtualRide: '🚴' }
    return emojis[type] || '🏃'
  }
  
  // Build Kanban data
  const buildKanbanData = () => {
    // Get today's date in local time
    const now = new Date()
    const todayStr = now.getFullYear() + '-' + 
      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
      String(now.getDate()).padStart(2, '0')
    
    // Get Monday of current week
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset)
    monday.setHours(0, 0, 0, 0)
    
    const days = []
    // Week from Monday to Sunday (about 2 weeks: few days before to 10 days after)
    for (let i = -3; i <= 10; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      
      // Format date as YYYY-MM-DD
      const dateStr = date.getFullYear() + '-' + 
        String(date.getMonth() + 1).padStart(2, '0') + '-' + 
        String(date.getDate()).padStart(2, '0')
      
      const isToday = dateStr === todayStr
      const isPast = dateStr < todayStr
      
      // Get planned sessions for this day
      const planned = trainingSessions.filter(s => s.date === dateStr)
      
      // Get completed activities for this day
      const completed = activities.filter(a => {
        if (!a.start_date_local) return false
        const actDate = a.start_date_local.substring(0, 10)
        return actDate === dateStr
      })
      
      // Calculate planned vs actual
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
  
  if (loading) return <div className="app">Loading...</div>
  
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
  
  // Dashboard View
  if (view === 'dashboard') {
    return (
      <div className="app">
        <header>
          <h1>🏃 Sport Dashboard</h1>
          {athlete && <p className="athlete">Willkommen zurück, {athlete.firstname}!</p>}
        </header>
        
        <div className="view-toggle">
          <button className="view-btn active">📊 Dashboard</button>
          <button className="view-btn" onClick={() => setView('kanban')}>📅 Kanban</button>
        </div>
        
        {/* Training Load */}
        <div className="section">
          <h2>💪 Training Load (CTL/ATL/TSB)</h2>
          <div className="load-grid">
            <div className={`load-card ${trainingLoad?.ctl > trainingLoad?.atl ? 'positive' : 'negative'}`}>
              <span className="load-value">{trainingLoad?.ctl || 0}</span>
              <span className="load-label">CTL (Fitness)</span>
            </div>
            <div className="load-card warning">
              <span className="load-value">{trainingLoad?.atl || 0}</span>
              <span className="load-label">ATL (Müdigkeit)</span>
            </div>
            <div className={`load-card ${trainingLoad?.tsb >= 0 ? 'positive' : 'negative'}`}>
              <span className="load-value">{trainingLoad?.tsb || 0}</span>
              <span className="load-label">TSB (Form)</span>
            </div>
          </div>
          <div className="load-chart">
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={loadChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{fontSize: 10}} />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="tss" stroke="#fc4c02" fill="#fc4c02" fillOpacity={0.3} name="TSS" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Training Sessions from Notion */}
        <div className="section">
          <h2>📋 Geplante Trainingseinheiten</h2>
          <div className="sessions-list">
            {trainingSessions.slice(0, 6).map(session => (
              <div key={session.id} className="session-card">
                <div className="session-icon">{getTypeEmoji(session.type)}</div>
                <div className="session-info">
                  <div className="session-name">{session.name}</div>
                  <div className="session-meta">
                    {session.date && new Date(session.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {session.duration && ` • ${session.duration}min`}
                    {session.distance && ` • ${session.distance}km`}
                  </div>
                  {session.description && <div className="session-desc">{session.description}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Range Selector */}
        <div className="range-selector">
          {TIME_RANGES.map(range => (
            <button 
              key={range.days}
              className={`range-btn ${selectedRange === range.days ? 'active' : ''}`}
              onClick={() => setSelectedRange(range.days)}
            >
              {range.label}
            </button>
          ))}
        </div>
        
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{weekStats?.total_distance || 0} km</span>
            <span className="stat-label">Distanz</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{formatTime(weekStats?.total_time || 0)}</span>
            <span className="stat-label">Trainingszeit</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{weekStats?.total_activities || 0}</span>
            <span className="stat-label">Aktivitäten</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{weekStats?.avg_heartrate || '—'}</span>
            <span className="stat-label">Ø Herzfrequenz</span>
          </div>
        </div>
        
        {/* Distance Chart */}
        <div className="section">
          <h2>📈 Distanz pro Tag</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{fontSize: 11}} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="distance" fill="#fc4c02" name="km" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Activities */}
        <div className="section">
          <h2>🏃 Letzte Aktivitäten</h2>
          <div className="activities-list">
            {activities.slice(0, 20).map((activity) => (
              <div key={activity.id} className="activity-card">
                <div className="activity-header">
                  <span>{getTypeEmoji(activity.type)}</span>
                  <span className="activity-name">{activity.name}</span>
                </div>
                <div className="activity-stats">
                  <span>{(activity.distance / 1000).toFixed(1)} km</span>
                  <span>{formatTime(activity.moving_time)}</span>
                  {activity.average_heartrate && <span>❤️ {Math.round(activity.average_heartrate)}</span>}
                </div>
                <div className="activity-date">{formatDate(activity.start_date_local)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  // Kanban View
  return (
    <div className="app kanban-view">
      <header>
        <h1>📅 Trainings-Kanban</h1>
        {athlete && <p className="athlete">{athlete.firstname}'sWochenübersicht</p>}
      </header>
      
      <div className="view-toggle">
        <button className="view-btn" onClick={() => setView('dashboard')}>📊 Dashboard</button>
        <button className="view-btn active">📅 Kanban</button>
      </div>
      
      <div className="kanban-board">
        {kanbanData.map((day, idx) => (
          <div key={idx} className={`kanban-column ${day.isPast ? 'past' : 'future'} ${day.isToday ? 'today' : ''} ${day.status}`}>
            <div className="column-header">
              <span className="day-name">{day.dayName}</span>
              <span className="day-num">{day.dayNum}. {day.month}</span>
            </div>
            
            <div className="column-content">
              {/* Planned Sessions (future only) */}
              {!day.isPast && !day.isToday && day.planned.map((session, i) => (
                <div key={i} className="kanban-card planned">
                  <div className="card-icon">{getTypeEmoji(session.type)}</div>
                  <div className="card-content">
                    <div className="card-title">{session.name}</div>
                    <div className="card-meta">{session.duration}min • {session.distance}km</div>
                  </div>
                </div>
              ))}
              
              {/* Completed Activities (past + today) */}
              {(day.isPast || day.isToday) && day.completed.map((activity, i) => (
                <a key={i} href={`https://www.strava.com/activities/${activity.strava_id}`} target="_blank" rel="noopener noreferrer" className="kanban-card completed">
                  <div className="card-icon">{getTypeEmoji(activity.type)}</div>
                  <div className="card-content">
                    <div className="card-title">{activity.name.slice(0, 25)}</div>
                    <div className="card-meta">{(activity.distance/1000).toFixed(1)}km • {formatTime(activity.moving_time)}</div>
                  </div>
                </a>
              ))}
              
              {/* Status indicator for past + today */}
              {(day.isPast || day.isToday) && day.planned.length > 0 && (
                <div className={`status-badge ${day.status}`}>
                  {day.status === 'under-trained' ? '⬇️ Zu wenig' : 
                   day.status === 'over-trained' ? '⬆️ Mehr als geplant' : '✅ Ziel erreicht'}
                </div>
              )}
              
              {/* Empty state */}
              {(day.isPast || day.isToday) && day.completed.length === 0 && day.planned.length > 0 && (
                <div className="status-badge missed">❌ Ausgefallen</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
