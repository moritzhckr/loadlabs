# SPORT DASHBOARD – MASTER SPECIFICATION (AI-READY)

## Project Vision
Build a production-grade, multi-user, triathlon-focused performance intelligence platform.

The system must:
- Support authentication and multi-user architecture
- Integrate Strava and Notion via OAuth
- Compute advanced endurance metrics (TSS, CTL, ATL, TSB)
- Model performance progression
- Forecast goal achievement probability and timeline
- Incorporate body metrics and availability constraints
- Be architected cleanly for future AI coaching integration

This specification is written to be used as an AI system prompt for implementation.

---

# 1. PRODUCT SCOPE

## Target Audience
Triathlon athletes (Swim, Bike, Run) with performance ambitions.

## Initial Deployment
- Local development
- Later public hosted SaaS

## Core Design Principles
- Clean Architecture
- Strict separation of concerns
- No shortcuts or technical debt
- Production-ready patterns from day one
- Fully extensible for AI-coach layer

---

# 2. SYSTEM ARCHITECTURE

## Backend
- FastAPI
- PostgreSQL
- SQLAlchemy ORM
- Alembic migrations
- JWT authentication (access + refresh tokens)
- OAuth2 for Strava and Notion
- Background scheduler for projections and token refresh

## Frontend
- React 19
- Vite
- Tailwind CSS v4
- Modern component architecture
- Protected routes
- Animated dashboards
- Goal intelligence views

---

# 3. CORE DOMAIN MODELS

## User
- id
- email
- password_hash
- created_at
- is_active

## UserProfile
- user_id
- weight (required)
- height
- resting_hr
- max_hr
- timezone
- location
- latitude
- longitude

## OAuthConnection
- user_id
- provider ("strava", "notion")
- access_token (encrypted)
- refresh_token (encrypted)
- expires_at

## Athlete
Linked 1:1 with user.

## Activity
Imported from Strava.
Includes:
- sport_type (swim/bike/run)
- duration
- distance
- avg_hr
- avg_power
- elevation
- tss

## PerformanceSnapshot (daily)
- date
- ctl
- atl
- tsb
- estimated_vo2max
- estimated_ftp
- fatigue_index

## Goal
Types:
- event
- performance
- body_composition

Fields:
- title
- target_value
- metric_type
- event_date (nullable)
- status

## BodyMetric
- date
- weight

## Availability
- weekday
- available_minutes
- preferred_time_window

## BlockedPeriod
- start_date
- end_date
- reason

---

# 4. PERFORMANCE ENGINE

## Training Metrics
- TSS calculation
- CTL (42-day rolling exponential)
- ATL (7-day rolling exponential)
- TSB = CTL - ATL

## Performance Estimation
- FTP estimation (bike power trends)
- VO2max estimation (run pace + HR trends)
- Swim CSS estimation (if data available)

## Goal Forecasting
For each active goal:
1. Evaluate current performance state
2. Determine required performance level
3. Model training adaptation curve
4. Estimate realistic achievement date
5. Calculate probability/confidence score

Outputs:
- current_projection
- required_ctl
- readiness_percentage
- estimated_achievement_date
- confidence_score

---

# 5. BODY & ENERGY MODEL

Weight is mandatory.

System must:
- Track weight trend
- Estimate energy expenditure from TSS and HR
- Adjust performance projections relative to W/kg

---

# 6. CONTEXT MODEL

Future-ready integration for:
- Weather
- Daylight
- Indoor/outdoor bias

Availability constraints must influence:
- Projection realism
- Training load simulation

---

# 7. SECURITY

- Password hashing via bcrypt
- Encrypted OAuth tokens
- JWT access and refresh tokens
- Role-ready architecture (future admin roles)

---

# 8. FUTURE AI LAYER (NOT YET IMPLEMENTED)

The architecture must allow:
- AI coach module
- Prompt-based weekly training suggestions
- Natural language performance summaries

All projection logic must be deterministic and separate from AI components.

---

# END OF MASTER SPEC

