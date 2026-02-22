# 🏃 Personal Sport Dashboard

> Dein eigenes Sport-Analytics-Dashboard mit Strava-Integration, Notion-Planung und Custom-DB.

## 📡 Datenquellen

| Quelle | Daten | Status |
|--------|-------|--------|
| **Strava** | Aktivitäten (Laufen, Rad, Schwimmen, etc.) | Geplant |
| **Notion** | Trainingspläne, Ziele, periodicity | Geplant |
| **Eigene DB** | Lokale Datenspeicherung | TODO |

## 🎯 Kernfeatures

### Phase 1: Daten-Sync
- [ ] Strava API Integration (OAuth)
- [ ] Aktivitäten abrufen (Distanz, Zeit, Pace, Herzfrequenz)
- [ ] Notion-Trainingspläne importieren
- [ ] Lokale SQLite/PostgreSQL DB aufsetzen

### Phase 2: Dashboard
- [ ] Übersicht: Aktuelle Woche/Monat
- [ ] Aktivitäts-Kalender (Heatmap)
- [ ] Fortschritt gegenüber Zielen

### Phase 3: Analytics
- [ ] Strava-ähnliche Charts (Wochenvergleich, Pace-Analyse)
- [ ] Training Load / FTP Berechnung
- [ ] Prognosen (Endurance Score)

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

- **Backend:** Python (FastAPI) / Node.js
- **DB:** SQLite (dev) / PostgreSQL (prod)
- **Frontend:** React / Vue / Svelte
- **Charts:** Chart.js / Recharts / D3

## 📁 Struktur

```
sport-dashboard/
├── backend/          # API & Data Sync
├── frontend/        # Dashboard UI
├── db/              # Database models
├── scripts/         # Strava/Notion sync scripts
└── docs/            # API Docs
```

---

*Erstellt: 22.02.2026*
