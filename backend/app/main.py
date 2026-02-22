"""
FastAPI Backend for Sport Dashboard
"""
import sys
sys.path.insert(0, '.')
sys.path.insert(0, 'backend')

import os
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import requests
from dotenv import load_dotenv

from db.models import get_session, Activity, Athlete

load_dotenv('backend/.env')

app = FastAPI(title="Sport Dashboard API")

# Enable CORS - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Strava API Helper
def get_strava_headers():
    access_token = os.getenv("STRAVA_ACCESS_TOKEN")
    return {"Authorization": f"Bearer {access_token}"}


def ensure_valid_token():
    """Check and refresh token if needed"""
    # For now, just return the headers
    # TODO: Implement token refresh logic
    return get_strava_headers()


# API Models
class ActivityOut(BaseModel):
    id: int
    strava_id: str
    name: str
    type: str
    sport_type: Optional[str]
    distance: Optional[float]
    moving_time: Optional[int]
    elapsed_time: Optional[int]
    average_speed: Optional[float]
    max_speed: Optional[float]
    average_heartrate: Optional[float]
    max_heartrate: Optional[float]
    average_watts: Optional[float]
    total_elevation_gain: Optional[float]
    gear_name: Optional[str]
    start_date_local: Optional[str]
    timezone: Optional[str]


class WeekStats(BaseModel):
    total_distance: float
    total_time: int
    total_activities: int
    avg_heartrate: Optional[float]
    activities_by_day: dict


class AthleteOut(BaseModel):
    id: int
    strava_id: str
    firstname: str
    lastname: str
    city: Optional[str]
    country: Optional[str]


class TrainingLoad(BaseModel):
    ctl: float  # Chronic Training Load (42-day)
    atl: float  # Acute Training Load (7-day)
    tsb: float  # Training Stress Balance
    daily_tss: dict  # TSS per day for chart


# Routes
@app.get("/")
def root():
    return {"message": "Sport Dashboard API", "version": "1.0"}


@app.get("/athlete", response_model=AthleteOut)
def get_athlete():
    session = get_session()
    athlete = session.query(Athlete).first()
    if not athlete:
        session.close()
        raise HTTPException(status_code=404, detail="No athlete found")
    
    result = AthleteOut(
        id=athlete.id,
        strava_id=athlete.strava_id,
        firstname=athlete.firstname,
        lastname=athlete.lastname,
        city=athlete.city,
        country=athlete.country
    )
    session.close()
    return result


@app.get("/activities", response_model=List[ActivityOut])
def get_activities(limit: int = 10):
    session = get_session()
    activities = session.query(Activity).order_by(Activity.start_date_local.desc()).limit(limit).all()
    
    result = []
    for a in activities:
        result.append(ActivityOut(
            id=a.id,
            strava_id=a.strava_id,
            name=a.name,
            type=a.type or "Unknown",
            sport_type=a.sport_type,
            distance=round(a.distance, 2) if a.distance else None,
            moving_time=a.moving_time,
            elapsed_time=a.elapsed_time,
            average_speed=round(a.average_speed, 2) if a.average_speed else None,
            max_speed=round(a.max_speed, 2) if a.max_speed else None,
            average_heartrate=round(a.average_heartrate, 1) if a.average_heartrate else None,
            max_heartrate=a.max_heartrate,
            average_watts=round(a.average_watts, 1) if a.average_watts else None,
            total_elevation_gain=round(a.total_elevation_gain, 1) if a.total_elevation_gain else None,
            gear_name=a.gear_name,
            start_date_local=a.start_date_local.isoformat() if a.start_date_local else None,
            timezone=a.timezone
        ))
    
    session.close()
    return result


@app.get("/stats/week", response_model=WeekStats)
def get_week_stats(days: int = 7):
    """Get stats for the last N days (default 7, max 140 for ~20 weeks)"""
    days = min(max(days, 1), 140)  # Clamp between 1 and 140
    session = get_session()
    
    # Get activities from last N days
    start_date = datetime.now() - timedelta(days=days)
    activities = session.query(Activity).filter(Activity.start_date_local >= start_date).all()
    
    total_distance = sum(a.distance or 0 for a in activities) / 1000  # km
    total_time = sum(a.moving_time or 0 for a in activities)  # seconds
    total_activities = len(activities)
    
    heartrates = [a.average_heartrate for a in activities if a.average_heartrate]
    avg_heartrate = sum(heartrates) / len(heartrates) if heartrates else None
    
    # Group by day
    activities_by_day = {}
    for a in activities:
        if a.start_date_local:
            day = a.start_date_local.strftime("%Y-%m-%d")
            if day not in activities_by_day:
                activities_by_day[day] = {"distance": 0, "time": 0, "count": 0}
            activities_by_day[day]["distance"] += (a.distance or 0) / 1000
            activities_by_day[day]["time"] += (a.moving_time or 0) / 60
            activities_by_day[day]["count"] += 1
    
    session.close()
    
    return WeekStats(
        total_distance=round(total_distance, 2),
        total_time=total_time,
        total_activities=total_activities,
        avg_heartrate=round(avg_heartrate, 1) if avg_heartrate else None,
        activities_by_day=activities_by_day
    )


def calculate_tss(activity: Activity) -> float:
    """Calculate Training Stress Score for an activity"""
    if not activity.moving_time or not activity.distance:
        return 0
    
    # Estimate IF (Intensity Factor) from heartrate if available
    # Normalized power estimate: assume ~75% of max HR for typical ride
    if activity.average_heartrate:
        # Assume max HR of 185 (typical for fit cyclist)
        estimated_if = min(activity.average_heartrate / 185, 1.2)
    else:
        # Estimate from speed - assume 30km/h is threshold
        avg_speed_kmh = (activity.average_speed or 0) * 3.6
        estimated_if = min(avg_speed_kmh / 30, 1.2)
    
    # TSS = (seconds * IF * IF * 100) / (threshold_duration * 3600)
    # Using 1 hour as threshold for simplicity
    tss = (activity.moving_time * estimated_if * estimated_if * 100) / 3600
    return tss


@app.get("/stats/training-load", response_model=TrainingLoad)
def get_training_load():
    """Calculate CTL/ATL/TSB training load metrics"""
    session = get_session()
    
    # Get activities for the last 42 days (CTL period)
    start_date = datetime.now() - timedelta(days=42)
    activities = session.query(Activity).filter(Activity.start_date_local >= start_date).all()
    
    # Calculate daily TSS
    daily_tss = {}
    for a in activities:
        if a.start_date_local:
            day = a.start_date_local.strftime("%Y-%m-%d")
            tss = calculate_tss(a)
            daily_tss[day] = daily_tss.get(day, 0) + tss
    
    # Calculate ATL (7-day rolling average)
    atl = 0
    for i in range(7):
        day = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        atl += daily_tss.get(day, 0)
    atl = atl / 7 if daily_tss else 0
    
    # Calculate CTL (42-day rolling average)
    ctl = 0
    for i in range(42):
        day = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        ctl += daily_tss.get(day, 0)
    ctl = ctl / 42 if daily_tss else 0
    
    tsb = ctl - atl
    
    session.close()
    
    return TrainingLoad(
        ctl=round(ctl, 1),
        atl=round(atl, 1),
        tsb=round(tsb, 1),
        daily_tss={k: round(v, 1) for k, v in daily_tss.items()}
    )


# Notion Training Sessions DB
NOTION_TRAINING_DB = "30f8f154-9217-814a-b957-d9030f1a1cd4"

class TrainingSession(BaseModel):
    id: str
    name: str
    type: Optional[str]
    date: Optional[str]
    duration: Optional[int]
    distance: Optional[float]
    description: Optional[str]


@app.get("/training-sessions", response_model=List[TrainingSession])
def get_training_sessions(days: int = 14):
    """Fetch training sessions from Notion"""
    notion_token = os.getenv("NOTION_TOKEN")
    if not notion_token:
        raise HTTPException(status_code=500, detail="Notion token not configured")
    
    headers = {
        "Authorization": f"Bearer {notion_token}",
        "Notion-Version": "2022-06-28"
    }
    
    # Query training sessions DB
    start_date = datetime.now().strftime("%Y-%m-%d")
    end_date = (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")
    
    resp = requests.post(
        f"https://api.notion.com/v1/databases/{NOTION_TRAINING_DB}/query",
        headers=headers,
        json={
            "filter": {
                "and": [
                    {"property": "Date", "date": {"on_or_after": start_date}},
                    {"property": "Project", "select": {"equals": "SportDashb"}}
                ]
            },
            "sorts": [{"property": "Date", "direction": "ascending"}]
        }
    )
    
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    
    sessions = []
    for page in resp.json().get('results', []):
        props = page['properties']
        
        name = props['Name']['title'][0]['text']['content'] if props['Name']['title'] else ''
        session_type = props['Type']['select']['name'] if props['Type'].get('select') else None
        date = props['Date']['date']['start'] if props['Date'].get('date') else None
        duration = props['Duration']['number'] if props['Duration'].get('number') else None
        distance = props['Distance']['number'] if props['Distance'].get('number') else None
        desc = props['Description']['rich_text'][0]['text']['content'] if props['Description'].get('rich_text') else None
        
        sessions.append(TrainingSession(
            id=page['id'],
            name=name,
            type=session_type,
            date=date,
            duration=duration,
            distance=distance,
            description=desc
        ))
    
    return sessions


@app.get("/sync/strava")
def sync_strava(per_page: int = 200):
    """Sync latest activities from Strava"""
    headers = ensure_valid_token()
    
    # Fetch from Strava
    resp = requests.get(
        "https://www.strava.com/api/v3/athlete/activities",
        headers=headers,
        params={"per_page": per_page}
    )
    
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    
    strava_activities = resp.json()
    
    # Save to DB
    session = get_session()
    athlete = session.query(Athlete).first()
    
    imported = 0
    for a in strava_activities:
        existing = session.query(Activity).filter_by(strava_id=str(a['id'])).first()
        if not existing:
            start_date = None
            if a.get('start_date_local'):
                start_date = datetime.fromisoformat(a['start_date_local'].replace('Z', '+00:00'))
            
            act = Activity(
                strava_id=str(a['id']),
                athlete_id=athlete.strava_id if athlete else None,
                name=a.get('name'),
                type=a.get('type'),
                sport_type=a.get('sport_type'),
                distance=a.get('distance'),
                moving_time=a.get('moving_time'),
                elapsed_time=a.get('elapsed_time'),
                average_speed=a.get('average_speed'),
                max_speed=a.get('max_speed'),
                average_heartrate=a.get('average_heartrate'),
                max_heartrate=a.get('max_heartrate'),
                average_watts=a.get('average_watts'),
                total_elevation_gain=a.get('total_elevation_gain'),
                gear_id=a.get('gear', {}).get('id') if a.get('gear') else None,
                gear_name=a.get('gear', {}).get('name') if a.get('gear') else None,
                start_date_local=start_date,
                timezone=a.get('timezone')
            )
            session.add(act)
            imported += 1
    
    session.commit()
    session.close()
    
    return {"imported": imported, "total": len(strava_activities)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
