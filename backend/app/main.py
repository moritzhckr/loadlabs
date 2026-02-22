"""
FastAPI Backend for Sport Dashboard
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))  # backend folder
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))  # root folder

import os
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import requests
from dotenv import load_dotenv

from sqlalchemy.orm import Session
from fastapi import Depends
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.strava_oauth import StravaOAuthService
from app.services.notion_oauth import NotionOAuthService
from app.services.performance_engine import PerformanceEngine

from app.models.activity import Activity
from app.models.athlete import Athlete

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

from app.api.api import api_router
from app.core.config import settings

app.include_router(api_router, prefix=settings.API_V1_STR)


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
def get_athlete(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    athlete = db.query(Athlete).filter(Athlete.user_id == current_user.id).first()
    if not athlete:
        return AthleteOut(
            id=0,
            strava_id="",
            firstname=current_user.email.split('@')[0].capitalize(),
            lastname="",
            city="",
            country=""
        )
    
    result = AthleteOut(
        id=athlete.id,
        strava_id="0", # Dummy since strava_id moved to Connection
        firstname=athlete.firstname or "",
        lastname=athlete.lastname or "",
        city="",
        country=""
    )
    return result


@app.get("/activities", response_model=List[ActivityOut])
def get_activities(limit: int = 10, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    activities = db.query(Activity).filter(Activity.user_id == current_user.id).order_by(Activity.start_date.desc()).limit(limit).all()
    
    result = []
    for a in activities:
        result.append(ActivityOut(
            id=a.id,
            strava_id=a.strava_id,
            name=a.name,
            type=a.sport_type or "Unknown",
            sport_type=a.sport_type,
            distance=round(a.distance, 2) if a.distance else None,
            moving_time=a.duration,
            elapsed_time=a.duration,
            average_speed=None,
            max_speed=None,
            average_heartrate=round(a.avg_hr, 1) if a.avg_hr else None,
            max_heartrate=None,
            average_watts=round(a.avg_power, 1) if a.avg_power else None,
            total_elevation_gain=round(a.elevation, 1) if a.elevation else None,
            gear_name=None,
            start_date_local=a.start_date.isoformat() if a.start_date else None,
            timezone=a.timezone
        ))
    
    return result


@app.get("/stats/week", response_model=WeekStats)
def get_week_stats(days: int = 7, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get stats for the last N days (default 7, max 140 for ~20 weeks)"""
    days = min(max(days, 1), 140)  # Clamp between 1 and 140
    
    # Get activities from last N days
    start_date = datetime.now() - timedelta(days=days)
    activities = db.query(Activity).filter(Activity.user_id == current_user.id, Activity.start_date >= start_date).all()
    
    total_distance = sum(a.distance or 0 for a in activities) / 1000  # km
    total_time = sum(a.duration or 0 for a in activities)  # seconds
    total_activities = len(activities)
    
    heartrates = [a.avg_hr for a in activities if a.avg_hr]
    avg_heartrate = sum(heartrates) / len(heartrates) if heartrates else None
    
    # Group by day
    activities_by_day = {}
    for a in activities:
        if a.start_date:
            day = a.start_date.strftime("%Y-%m-%d")
            if day not in activities_by_day:
                activities_by_day[day] = {"distance": 0, "time": 0, "count": 0}
            activities_by_day[day]["distance"] += (a.distance or 0) / 1000
            activities_by_day[day]["time"] += (a.duration or 0) / 60
            activities_by_day[day]["count"] += 1

    
    return WeekStats(
        total_distance=round(total_distance, 2),
        total_time=total_time,
        total_activities=total_activities,
        avg_heartrate=round(avg_heartrate, 1) if avg_heartrate else None,
        activities_by_day=activities_by_day
    )


@app.get("/stats/training-load", response_model=TrainingLoad)
def get_training_load(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Calculate CTL/ATL/TSB training load metrics"""
        
    start_date = datetime.now() - timedelta(days=42)
    activities = db.query(Activity).filter(Activity.user_id == current_user.id, Activity.start_date >= start_date).all()
    
    # Calculate daily TSS, ATL, CTL, TSB
    load = PerformanceEngine.calculate_training_load(activities)
    
    return TrainingLoad(
        ctl=round(load["ctl"], 1),
        atl=round(load["atl"], 1),
        tsb=round(load["tsb"], 1),
        daily_tss={k: round(v, 1) for k, v in load["daily_tss"].items()}
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
def get_training_sessions(days: int = 14, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch training sessions from Notion"""
        
    notion_token = NotionOAuthService.get_valid_access_token(db, current_user.id)
    if not notion_token:
        # Silently return empty or log it for now
        return []
    
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
def sync_strava(per_page: int = 200, db: Session = Depends(get_db)):
    """Sync latest activities from Strava"""
    current_user = db.query(User).first()
    if not current_user:
        raise HTTPException(status_code=401, detail="No active user found for sync")

    access_token = StravaOAuthService.get_valid_access_token(db, current_user.id)
    if not access_token:
        raise HTTPException(status_code=401, detail="Strava not connected or token expired")
        
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Fetch from Strava
    resp = requests.get(
        "https://www.strava.com/api/v3/athlete/activities",
        headers=headers,
        params={"per_page": per_page}
    )
    
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    
    strava_activities = resp.json()
    imported = 0
    for a in strava_activities:
        existing = db.query(Activity).filter(Activity.strava_id == str(a['id'])).first()
        if not existing:
            start_date = None
            if a.get('start_date_local'):
                start_date = datetime.fromisoformat(a['start_date_local'].replace('Z', '+00:00'))
            
            act = Activity(
                user_id=current_user.id,
                strava_id=str(a['id']),
                name=a.get('name'),
                sport_type=a.get('sport_type') or a.get('type'),
                distance=a.get('distance'),
                duration=a.get('moving_time'),
                avg_hr=a.get('average_heartrate'),
                avg_power=a.get('average_watts'),
                elevation=a.get('total_elevation_gain'),
                start_date=start_date,
                timezone=a.get('timezone')
            )
            db.add(act)
            imported += 1
    
    db.commit()
    return {"imported": imported, "total": len(strava_activities)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=True)
