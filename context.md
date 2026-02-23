# LoadLabs - Project Context

## Aktueller Stand
- **Datum:** 2026-02-23
- **Status:** ✅ LAUFEND - Profile & Body Metrics
- **GitHub:** https://github.com/moritzhckr/loadlabs

## Letzte Änderungen
- 23.02.2026: Profile Page mit Körperdaten (Gewicht, Größe, Ruhe-/Max-Puls, Ort, Zeitzone)
- 23.02.2026: Body Metrics Verlauf (wird automatisch bei jedem Save gespeichert)
- 23.02.2026: Profile API Endpoints (GET/PUT /profile, GET/POST /metrics)

## Letzte Änderungen
- 23.02.2026: Rebranding "Sport Dashboard" → "LoadLabs"
- 23.02.2026: Dark Mode Fix (Tailwind v4 @variant dark:, ThemeContext mit localStorage)
- 23.02.2026: Theme Toggle Button auf Dashboard & Settings

## Rebranding Checkliste
- [x] index.html Title → "LoadLabs"
- [x] Dashboard.jsx Header → "LoadLabs"
- [x] Register.jsx Text → "LoadLabs"
- [x] README.md aktualisiert
- [ ] GitHub Repo umbenennen (sport-dashboard → loadlabs) → **Manuell auf GitHub!**

## Features
- ✅ User Auth (JWT)
- ✅ Strava OAuth (Token automatisch verschlüsselt)
- ✅ Strava Sync (alle Aktivitäten importiert)
- ✅ Token Refresh (automatisch, 5 min Buffer)
- ✅ User Profile (Gewicht, Größe, Puls, Ort, Zeitzone)
- ✅ Body Metrics Verlauf (automatisch gespeichert)

## Technische Details
- Backend: FastAPI auf Port 8000
- Frontend: Vite/React auf Port 3000
- DB: SQLite (sport_dashboard.db)
- Token: JWT mit Access/Refresh

## Nächste Schritte
1. Dashboard mit echten Daten visualisieren (CTL/ATL/TSB Charts)
2. Notion OAuth implementieren
3. Body Metrics Diagramm (Visualisierung des Verlaufs)

---

## Implementierungsstrategie & TO-DO Plan

### Phase 1: Backend Foundation (Infrastruktur & Auth)
- [x] **Step 1.1:** Setup PostgreSQL & Alembic
- [x] **Step 1.2:** Implementierung der User-Authentifizierung (JWT)
- [x] **Step 1.3:** Setup der geschützten FastAPI-Routen

### Phase 2: Domain Modeling & Database
- [x] **Step 2.1:** Core-Modelle implementiert
- [x] **Step 2.2:** Alembic-Migrations

### Phase 3: External Integrations (Strava & Notion)
- [x] **Step 3.1:** Strava OAuth + Token Refresh ✅
- [x] **Step 3.2:** Strava Sync ✅
- [ ] **Step 3.3:** Notion OAuth
- [ ] **Step 3.4:** Notion Sync

### Phase 4: Performance Engine
- [x] **Step 4.1:** TSS, CTL, ATL, TSB Berechnungen
- [x] **Step 4.2:** PerformanceEngine Service
- [ ] **Step 4.3:** ML/AI Vorbereitungen (verschoben)
- [ ] **Step 4.4:** Hintergrund-Scheduler

### Phase 5: Frontend Foundation
- [x] **Step 5.1:** Tailwind CSS v4
- [x] **Step 5.2:** Routing & Auth-Context

### Phase 6: Frontend Dashboards
- [x] **Step 6.0:** API Endpoints
- [ ] **Step 6.1:** Core Dashboard (Charts) ← NÄCHSTER
- [x] **Step 6.2:** Activity Sync & Settings
- [ ] **Step 6.3:** Goal Forecasting (Notion)
- [x] **Step 6.4:** Body Metrics & Profile ✅

---

*Hinweis: Diese Datei wird am Ende jedes relevanten Moduls aktualisiert.*
