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

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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
def get_week_stats():
    session = get_session()
    
    # Get activities from last 7 days
    week_ago = datetime.now() - timedelta(days=7)
    activities = session.query(Activity).filter(Activity.start_date_local >= week_ago).all()
    
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


@app.get("/sync/strava")
def sync_strava():
    """Sync latest activities from Strava"""
    headers = ensure_valid_token()
    
    # Fetch from Strava
    resp = requests.get(
        "https://www.strava.com/api/v3/athlete/activities",
        headers=headers,
        params={"per_page": 30}
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
