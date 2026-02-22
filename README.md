# 🏃 Sport Dashboard

> Triathlon Performance Platform mit Strava-Integration, PostgreSQL und React.

## 🚀 Quick Start

```bash
# Backend starten
cd backend && uvicorn app.main:app --reload --port 8000

# Frontend starten  
cd .. && npm run dev
```

- **Frontend:** http://192.168.20.112:3000
- **Backend API:** http://192.168.20.112:8000
- **API Docs:** http://192.168.20.112:8000/docs

## 📁 Struktur

```
sport-dashboard/
├── backend/
│   ├── app/
│   │   ├── api/routes/     # API Endpoints
│   │   ├── models/         # SQLAlchemy Models
│   │   ├── services/      # Business Logic
│   │   └── core/          # Config, Security
│   └── alembic/           # DB Migrations
├── src/
│   ├── pages/             # React Pages
│   └── context/           # Auth Context
└── docker-compose.yml     # PostgreSQL
```

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI, PostgreSQL, SQLAlchemy, Alembic |
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Auth | JWT (Access + Refresh) |
| OAuth | Strava, Notion |

## 🔑 Strava OAuth

**Client ID:** 13385  
**Redirect URI:** http://192.168.20.112:3000/oauth/strava/callback

### OAuth Flow

1. User klickt "Mit Strava verbinden"
2. Frontend → `GET /api/v1/oauth/strava/authorize` → erhält Authorization URL
3. Redirect zu Strava → User authorizes
4. Strava redirectet zu `/oauth/strava/callback?code=XXX`
5. Frontend tauscht Code gegen Token
6. Backend speichert Token verschlüsselt in DB

## 📊 API Endpoints

### Auth
- `POST /api/v1/auth/register` - User registrieren
- `POST /api/v1/auth/login` - Login (JWT)
- `POST /api/v1/auth/refresh` - Token refresh

### OAuth
- `GET /api/v1/oauth/status` - Verbindungsstatus
- `GET /api/v1/oauth/strava/authorize` - Strava OAuth starten
- `GET /api/v1/oauth/strava/callback` - OAuth Callback
- `POST /api/v1/oauth/strava/disconnect` - Strava trennen

### Strava
- `POST /api/v1/strava/sync` - Activities von Strava holen
- `GET /api/v1/strava/activities` - Aktivitäten aus DB

### Stats
- `GET /api/v1/stats/weekly` - Wochen-Stats
- `GET /api/v1/stats/summary` - Summary Stats

## 🔧 Environment Variables

Backend (.env):
```
STRAVA_CLIENT_ID=13385
STRAVA_CLIENT_SECRET=xxx
STRAVA_REDIRECT_URI=http://192.168.20.112:3000/oauth/strava/callback
NOTION_CLIENT_ID=xxx
NOTION_CLIENT_SECRET=xxx
NOTION_REDIRECT_URI=http://192.168.20.112:3000/oauth/notion/callback
DATABASE_URL=postgresql://user:pass@localhost:5432/sportdb
SECRET_KEY=xxx
```

Frontend (.env):
```
VITE_API_URL=http://192.168.20.112:8000
```

## 📝 To-Do

- [x] User Auth (JWT)
- [x] OAuth (Strava, Notion)
- [x] Strava Sync
- [x] Performance Metrics (CTL/ATL/TSB)
- [ ] Dashboard Charts
- [ ] Goal Forecasting
- [ ] Body Metrics
- [ ] Background Scheduler

---

*Last Updated: 2026-02-22*
