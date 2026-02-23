import React, { useMemo } from 'react'
import { Tooltip } from 'recharts'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', '']

// Intensity levels (0-4)
const getIntensityColor = (value, isDark) => {
  if (!value || value === 0) return isDark ? '#1e293b' : '#e2e8f0'
  const max = Math.max(...Object.values(value).filter(v => v > 0))
  if (!max) return isDark ? '#1e293b' : '#e2e8f0'
  
  const ratio = value / max
  if (ratio <= 0.25) return isDark ? '#065f46' : '#a7f3d0'
  if (ratio <= 0.5) return isDark ? '#059669' : '#34d399'
  if (ratio <= 0.75) return isDark ? '#10b981' : '#10b981'
  return isDark ? '#34d399' : '#047857'
}

const formatDate = (date) => {
  return date.toISOString().split('T')[0]
}

export default function ActivityHeatmap({ activities = [], isDark = false }) {
  const heatmapData = useMemo(() => {
    // Build activity map by date
    const activityMap = {}
    activities.forEach(activity => {
      if (!activity.start_date_local) return
      const date = activity.start_date_local.split('T')[0]
      const distance = (activity.distance || 0) / 1000 // km
      const time = activity.moving_time || 0 // seconds
      
      if (!activityMap[date]) {
        activityMap[date] = { distance: 0, time: 0, count: 0 }
      }
      activityMap[date].distance += distance
      activityMap[date].time += time
      activityMap[date].count += 1
    })

    // Generate calendar grid (52 weeks)
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 364) // ~52 weeks
    
    // Align to Sunday
    while (startDate.getDay() !== 0) {
      startDate.setDate(startDate.getDate() - 1)
    }

    const weeks = []
    let currentDate = new Date(startDate)
    
    for (let week = 0; week < 53; week++) {
      const weekData = []
      for (let day = 0; day < 7; day++) {
        const dateStr = formatDate(currentDate)
        const data = activityMap[dateStr] || { distance: 0, time: 0, count: 0 }
        
        // Use distance for intensity (can be changed to time)
        const intensityValue = data.distance
        
        weekData.push({
          date: dateStr,
          day,
          distance: data.distance,
          time: data.time,
          count: data.count,
          intensity: intensityValue
        })
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      weeks.push(weekData)
    }

    return weeks
  }, [activities])

  const totalStats = useMemo(() => {
    return activities.reduce((acc, activity) => {
      if (!activity.start_date_local) return acc
      return {
        distance: acc.distance + (activity.distance || 0) / 1000,
        time: acc.time + (activity.moving_time || 0),
        count: acc.count + 1
      }
    }, { distance: 0, time: 0, count: 0 })
  }, [activities])

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  // Get month labels
  const monthLabels = useMemo(() => {
    const labels = []
    let lastMonth = -1
    
    heatmapData.forEach((week, weekIdx) => {
      const firstDay = week[0]
      if (firstDay) {
        const month = new Date(firstDay.date).getMonth()
        if (month !== lastMonth) {
          labels.push({ month: MONTHS[month], week: weekIdx })
          lastMonth = month
        }
      }
    })
    
    return labels
  }, [heatmapData])

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--ring)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Activity Calendar
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Wenig</span>
            <div className="flex gap-0.5">
              {[0.1, 0.3, 0.5, 0.7, 1].map((val, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-sm"
                  style={{ 
                    backgroundColor: val <= 0.1 
                      ? (isDark ? '#1e293b' : '#e2e8f0')
                      : val <= 0.3 
                        ? (isDark ? '#065f46' : '#a7f3d0')
                        : val <= 0.5 
                          ? (isDark ? '#059669' : '#34d399')
                          : val <= 0.7
                            ? (isDark ? '#10b981' : '#10b981')
                            : (isDark ? '#34d399' : '#047857')
                  }}
                />
              ))}
            </div>
            <span className="text-slate-500 dark:text-slate-400">Viel</span>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
          <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Jahr</div>
          <div className="text-lg font-bold text-slate-800 dark:text-white">{totalStats.distance.toFixed(0)} km</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
          <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Zeit</div>
          <div className="text-lg font-bold text-slate-800 dark:text-white">{formatTime(totalStats.time)}</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
          <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Trainings</div>
          <div className="text-lg font-bold text-slate-800 dark:text-white">{totalStats.count}</div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-0">
          {/* Month Labels */}
          <div className="flex ml-8 mb-1">
            {monthLabels.map((item, i) => (
              <div 
                key={i} 
                className="text-xs text-slate-400 dark:text-slate-500"
                style={{ 
                  marginLeft: i === 0 ? item.week * 14 : (item.week - monthLabels[i-1].week) * 14 - 24,
                  width: 24
                }}
              >
                {item.month}
              </div>
            ))}
          </div>
          
          <div className="flex gap-1">
            {/* Day Labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {DAYS.map((day, i) => (
                <div key={i} className="h-3 text-xs text-slate-400 dark:text-slate-500 w-6 flex items-center">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Weeks */}
            <div className="flex gap-0.5">
              {heatmapData.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-0.5">
                  {week.map((day, dayIdx) => (
                    <Tooltip
                      key={day.date}
                      content={
                        <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
                          <div className="font-semibold">{new Date(day.date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                          {day.count > 0 ? (
                            <div className="text-slate-300 mt-1">
                              <div>{day.distance.toFixed(1)} km</div>
                              <div>{formatTime(day.time)}</div>
                              <div>{day.count} Aktivität{day.count > 1 ? 'en' : ''}</div>
                            </div>
                          ) : (
                            <div className="text-slate-400 mt-1">Keine Aktivität</div>
                          )}
                        </div>
                      }
                      cursor={false}
                    >
                      <div
                        className="w-3 h-3 rounded-sm transition-transform hover:scale-125 cursor-pointer"
                        style={{ backgroundColor: getIntensityColor(day.intensity, isDark) }}
                      />
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
