# Sport Dashboard - Project Context

## Aktueller Stand
- **Datum:** 2026-02-22
- **Status:** Phase 2 abgeschlossen. Domain Modelle wurden angelegt und in die DB migriert.
- **Nächster Schritt:** Phase 3: External Integrations (Strava & Notion OAuth) umsetzen.

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
- [ ] **Step 3.1:** OAuth-Flow für Strava implementieren (Token-Verschlüsselung, Refresh-Logik).
- [ ] **Step 3.2:** Strava Sync-Logik migrieren & an neues Datenbank-Schema anpassen.
- [ ] **Step 3.3:** OAuth-Flow für Notion implementieren.
- [ ] **Step 3.4:** Notion Sync-Logik migrieren & an neues Datenbank-Schema anpassen.

### Phase 4: Performance Engine
- [ ] **Step 4.1:** TSS, CTL, ATL, TSB Berechnungen implementieren (42-Tage/7-Tage rollierend).
- [ ] **Step 4.2:** FTP, VO2max und Swim CSS Schätzlogiken implementieren.
- [ ] **Step 4.3:** Goal Forecasting (wahrscheinliches Erreichbarkeitsdatum, Readiness-Prozentsatz).
- [ ] **Step 4.4:** Hintergrund-Scheduler (Celery oder APScheduler) für tägliche Performance-Snapshots aufsetzen.

### Phase 5: Frontend Foundation
- [ ] **Step 5.1:** Update auf Tailwind CSS v4.
- [ ] **Step 5.2:** Grundgerüst & Routing (Protected Routes, Login/Signup Pages) aufbauen.
- [ ] **Step 5.3:** Auth-Context (JWT Handling, Token-Refresh) implementieren.

### Phase 6: Frontend Dashboards
- [ ] **Step 6.1:** Core Dashboard (Performance Metrics, CTL/ATL/TSB Charts).
- [ ] **Step 6.2:** Activity Sync & List Views.
- [ ] **Step 6.3:** Goal Forecasting & Planning Views (Notion-Integration).
- [ ] **Step 6.4:** Body Metrics & Profile Management.

---

*Hinweis: Diese Datei wird am Ende jedes relevanten Moduls aktualisiert, um den Fortschritt zu dokumentieren.*
