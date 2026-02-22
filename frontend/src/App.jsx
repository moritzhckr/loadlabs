import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import './App.css'

const API_URL = 'http://localhost:8000'

function App() {
  const [athlete, setAthlete] = useState(null)
  const [activities, setActivities] = useState([])
  const [weekStats, setWeekStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [athleteRes, activitiesRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/athlete`),
        fetch(`${API_URL}/activities?limit=10`),
        fetch(`${API_URL}/stats/week`)
      ])
      
      setAthlete(await athleteRes.json())
      setActivities(await activitiesRes.json())
      setWeekStats(await statsRes.json())
    } catch (err) {
      console.error('Error fetching data:', err)
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

  if (loading) {
    return <div className="app"><div className="loading">Loading...</div></div>
  }

  // Prepare chart data
  const chartData = weekStats?.activities_by_day 
    ? Object.entries(weekStats.activities_by_day).map(([date, data]) => ({
        date: formatDate(date),
        distance: Math.round(data.distance * 10) / 10,
        time: Math.round(data.time)
      }))
    : []

  return (
    <div className="app">
      <header>
        <h1>🏃 Sport Dashboard</h1>
        {athlete && <p className="athlete">Willkommen zurück, {athlete.firstname}!</p>}
      </header>

      {/* Week Stats */}
      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{weekStats?.total_distance || 0} km</span>
          <span className="stat-label">Diese Woche</span>
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
      </section>

      {/* Weekly Chart */}
      <section className="chart-section">
        <h2>📈 Wochenübersicht</h2>
        <div className="chart">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="distance" fill="#fc4c02" name="km" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recent Activities */}
      <section className="activities-section">
        <h2>🏃 Letzte Aktivitäten</h2>
        <div className="activities-list">
          {activities.map((activity) => (
            <div key={activity.id} className="activity-card">
              <div className="activity-header">
                <span className="activity-type">{activity.type === 'Ride' ? '🚴' : '🏃'}</span>
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
      </section>
    </div>
  )
}

export default App
