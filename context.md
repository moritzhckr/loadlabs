# Sport Dashboard - Project Context

## Aktueller Stand
- **Datum:** 2026-02-22 22:30
- **Status:** Backend + Frontend laufen. Strava OAuth muss getestet werden.
- **Letzte Änderung:** Sync-Button nutzt jetzt POST statt GET

## Laufende Services
- **Backend:** FastAPI auf http://192.168.20.112:8000
- **Frontend:** Vite/React auf http://192.168.20.112:3000

## Credentials
- **Strava Client ID:** 13385
- **Strava Client Secret:** 7bc0ad9af48f0d8c8d3cbe72012630829cddc531
- **Redirect URI:** http://192.168.20.112:3000/oauth/strava/callback

## Letzte Änderungen
- 22.02.2026: Settings.jsx gefixt (2x fehlendes `/>` bei Loader2)
- 22.02.2026: Projekt auf GitHub hochgeladen

## Technische Details
- Backend: FastAPI auf Port 8000
- Frontend: Vite/React auf Port 3000
- DB: SQLite (sport_dashboard.db)
- Token: JWT mit Access/Refresh

## Nächste Schritte
1. Strava OAuth im Browser testen
2. Token eingeben falls OAuth nicht funktioniert
3. Sync testen

---

## Implementierungsstrategie & TO-DO Plan

Diese Roadmap zielt darauf ab, das bisherige SQLite-Prototyp-Setup durch eine skalierbare, production-ready PostgreSQL-Architektur mit sauberer Authentifizierung und Domain-Trennung zu ersetzen. Jeder Schritt wird separat implementiert, getestet und als einzelner Commit versioniert.

### Phase 1: Backend Foundation (Infrastruktur & Auth)
- [x] **Step 1.1:** Setup PostgreSQL & Alembic (Docker-Compose für lokale DB erstellen, Alembic initialisieren).
- [x] **Step 1.2:** Implementierung der User-Authentifizierung (JWT, bcrypt, User-Model, Auth-Routes).
- [x] **Step 1.3:** Setup der geschützten FastAPI-Routen (Dependencies, Security).

### Phase 2: Domain Modeling & Database
- [x] **Step 2.1:** Implementierung der Core-Modelle (`UserProfile`, `OAuthConnection`, `Athlete`, `Activity`, `PerformanceSnapshot`, `Goal`, `BodyMetric`, `Availability`, `BlockedPeriod`).
- [x] **Step 2.2:** Alembic-Migrations für alle neuen Modelle generieren und anwenden.

### Phase 3: External Integrations (Strava & Notion)
- [x] **Step 3.1:** OAuth-Flow für Strava implementieren (Token-Verschlüsselung, Refresh-Logik).
- [x] **Step 3.2:** Strava Sync-Logik migrieren & an neues Datenbank-Schema anpassen.
- [x] **Step 3.3:** OAuth-Flow für Notion implementieren.
- [x] **Step 3.4:** Notion Sync-Logik migrieren & an neues Datenbank-Schema anpassen.

### Phase 4: Performance Engine
- [x] **Step 4.1:** TSS, CTL, ATL, TSB Berechnungen implementieren (42-Tage/7-Tage rollierend).
- [x] **Step 4.2:** Abstraktion in eine Service-Klasse (`PerformanceEngine`).
- [ ] **Step 4.3:** ML/AI Vorbereitungen (Dumb Baseline Model für Vorhersagen - *verschoben auf später*).
- [ ] **Step 4.4:** Hintergrund-Scheduler (Celery oder APScheduler) für tägliche Performance-Snapshots aufsetzen.

### Phase 5: Frontend Foundation
- [x] **Step 5.1:** Update auf Tailwind CSS v4.
- [x] **Step 5.2:** Grundgerüst & Routing (Protected Routes, Login/Signup Pages) aufbauen.
- [x] **Step 5.3:** Auth-Context (JWT Handling, Token-Refresh) implementieren.

### Phase 6: Frontend Dashboards
- [x] **Step 6.0:** API Endpoints für Dashboard implementiert (/athlete, /activities, /stats/*, /training-sessions)
- [ ] **Step 6.1:** Core Dashboard (Performance Metrics, CTL/ATL/TSB Charts) mit echten Daten.
- [x] **Step 6.2:** Activity Sync & Settings Page mit Strava Verbindung.
- [ ] **Step 6.3:** Goal Forecasting & Planning Views (Notion-Integration).
- [ ] **Step 6.4:** Body Metrics & Profile Management.

---

*Hinweis: Diese Datei wird am Ende jedes relevanten Moduls aktualisiert, um den Fortschritt zu dokumentieren.*
