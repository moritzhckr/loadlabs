# 🏃 Personal Sport Dashboard

> Dein eigenes Sport-Analytics-Dashboard mit Strava-Integration, Notion-Planung und Custom-DB.

## 📡 Datenquellen

| Quelle | Daten | Status |
|--------|-------|--------|
| **Strava** | Aktivitäten (Laufen, Rad, Schwimmen, etc.) | TODO |
| **Notion** | Trainingspläne, Ziele, periodicity | TODO |
| **Eigene DB** | Lokale Datenspeicherung | TODO |

## 🎯 Konzept (Version 1.0)

### Datenmodell

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Strava    │────▶│  Sync Layer  │────▶│  SQLite DB  │
│   (API)     │     │  (Python)    │     │             │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                     │
                           ▼                     ▼
                    ┌──────────────┐     ┌─────────────┐
                    │   Notion     │◀───▶│  Dashboard  │
                    │  (Pläne)     │     │  (React)    │
                    └──────────────┘     └─────────────┘
```

### Kernfunktionen

1. **Strava Sync** (täglich/automatisch)
   - OAuth 2.0 Authentifizierung
   - Activities: Distance, Duration, Pace, HR, Power, Elevation
   - Gear (Fahrrad, Schuhe)
   - Personal Records

2. **Notion Integration**
   - Trainingswochenpläne abrufen
   - Saisonziele
   - periodicity / Trainingsblock-Planung

3. **Lokale DB (SQLite)**
   - `activities` - alle Strava-Aktivitäten
   - `plans` - Notion-Trainingspläne
   - `goals` - Saisonziele
   - `prs` - Personal Records

4. **Dashboard-Views**
   - **Wochenübersicht**: Aktuelle Training Load, Distanz, Zeit
   - **Monatsheatmap**: Aktive Tage
   - **Vergleich**: Diese Woche vs letzte Woche / Monat
   - **Ziel-Fortschritt**: Distance/Time Goals

## 🚀 Implementierung

### Phase 1: Setup & Daten-Sync
- [ ] Projekt-Struktur (backend/, frontend/, db/)
- [ ] Strava App registrieren (developer.strava.com)
- [ ] Python-Script: Strava OAuth + Activities fetch
- [ ] SQLite DB Schema
- [ ] Notion API Sync (Training Plans)

### Phase 2: Dashboard
- [ ] React App aufsetzen
- [ ] Week Overview Chart
- [ ] Activity Calendar Heatmap
- [ ] Goal Progress Bars

### Phase 3: Analytics
- [ ] Training Load Berechnung (CTL/ATL/TSB)
- [ ] Pace/Heart Rate Charts
- [ ] Week-over-Week Comparison

## 💡 Feature-Ideen (Phase 2+)

### 🥗 Ernährung & Recovery
- **Essensplanung** integrieren (Notion DB → Dashboard)
- Kalorien-Tracking (Strava CAL → Food DB)
- Hydration-Tracker

### 🤖 AI & Automation
- Automatische Trainingsplan-Erstellung basierend auf Ziel
- Weekly Report per Email/Telegram
- AI-Coach: Trainingsvorschläge nach Recovery

### 📊 Visualisierung
- 3D Activity Map (Leaflet/Three.js)
- Live-Dashboard für TV/Display
- Wearable Sync (Apple Health / Google Fit)

### 🎮 Gamification
- Achievements / Badges
- Strava-Segmente nachbauen
- Year in Sport Summary

### 🔗 Integrationen
- **HomeAssistant** → Trainingsraum-Beleuchtung
- **Notion** ←→ Kalender-Sync
- **Telegram** → Push Notifications

## 🛠 Tech Stack

- **Backend:** Python (FastAPI)
- **DB:** SQLite
- **Frontend:** React + Vite
- **Charts:** Recharts
- **Hosting:** Local / Docker

## 📁 Struktur

```
sport-dashboard/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI app
│   │   ├── strava.py        # Strava API client
│   │   ├── notion.py        # Notion API client
│   │   └── db.py            # SQLite models
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   └── pages/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 📝 Notion Tasks

- [ ] Projekt-Struktur aufsetzen
- [ ] Strava API OAuth
- [ ] Lokale DB aufsetzen
- [ ] Notion Sync
- [ ] Dashboard bauen

---

*Erstellt: 22.02.2026*
