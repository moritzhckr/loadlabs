import requests
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.oauth import OAuthConnection
from app.models.activity import Activity
from app.core.config import settings
from app.core.encryption import encrypt_token, decrypt_token

router = APIRouter()

STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"
STRAVA_API_URL = "https://www.strava.com/api/v3"

def get_valid_access_token(db: Session, user_id: int) -> Optional[str]:
    """Get a valid Strava access token, refreshing if needed."""
    connection = db.query(OAuthConnection).filter(
        OAuthConnection.user_id == user_id, 
        OAuthConnection.provider == "strava"
    ).first()
    
    if not connection:
        return None
        
    # Check if expired (with 5 min buffer)
    if connection.expires_at and connection.expires_at < (datetime.utcnow() + timedelta(minutes=5)):
        if not connection.refresh_token:
            return None
        
        # Refresh token
        payload = {
            "client_id": settings.STRAVA_CLIENT_ID,
            "client_secret": settings.STRAVA_CLIENT_SECRET,
            "grant_type": "refresh_token",
            "refresh_token": decrypt_token(connection.refresh_token)
        }
        res = requests.post(STRAVA_TOKEN_URL, data=payload)
        if res.status_code == 200:
            data = res.json()
            connection.access_token = encrypt_token(data.get("access_token"))
            connection.refresh_token = encrypt_token(data.get("refresh_token"))
            connection.expires_at = datetime.utcnow() + timedelta(seconds=data.get("expires_in", 21600))
            db.commit()
            return data.get("access_token")
        return None
        
    return decrypt_token(connection.access_token)

@router.post("/sync")
def sync_strava(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch and sync Strava activities to our DB."""
    access_token = get_valid_access_token(db, current_user.id)
    
    if not access_token:
        raise HTTPException(status_code=400, detail="No Strava connection")
    
    # Fetch activities from Strava
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Get all activities (paginated)
    all_activities = []
    page = 1
    per_page = 100
    
    while True:
        res = requests.get(
            f"{STRAVA_API_URL}/athlete/activities",
            headers=headers,
            params={"per_page": per_page, "page": page}
        )
        
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Strava API error: {res.text}")
        
        data = res.json()
        if not data:
            break
            
        all_activities.extend(data)
        page += 1
        
        # Safety limit
        if page > 10:
            break
    
    # Save to DB (skip existing)
    saved_count = 0
    for act in all_activities:
        existing = db.query(Activity).filter(
            Activity.strava_id == str(act.get("id"))
        ).first()
        
        if not existing:
            activity = Activity(
                user_id=current_user.id,
                strava_id=str(act.get("id")),
                name=act.get("name"),
                type=act.get("type"),
                sport_type=act.get("sport_type"),
                start_date=datetime.fromisoformat(act.get("start_date").replace("Z", "+00:00")),
                start_date_local=act.get("start_date_local"),
                timezone=act.get("timezone"),
                distance=act.get("distance", 0),
                moving_time=act.get("moving_time", 0),
                elapsed_time=act.get("elapsed_time", 0),
                total_elevation_gain=act.get("total_elevation_gain", 0),
                average_speed=act.get("average_speed", 0),
                max_speed=act.get("max_speed", 0),
                average_heartrate=act.get("average_heartrate"),
                max_heartrate=act.get("max_heartrate"),
                average_watts=act.get("average_watts"),
                kilojoules=act.get("kilojoules"),
                calories=act.get("calories"),
                description=act.get("description"),
                gear_id=act.get("gear_id")
            )
            db.add(activity)
            saved_count += 1
    
    db.commit()
    
    return {
        "status": "success",
        "total_activities": len(all_activities),
        "new_activities": saved_count,
        "user_id": current_user.id
    }

@router.get("/activities")
def get_activities(
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get activities from our DB."""
    activities = db.query(Activity).filter(
        Activity.user_id == current_user.id
    ).order_by(Activity.start_date.desc()).limit(limit).all()
    
    return [{
        "id": a.id,
        "strava_id": a.strava_id,
        "name": a.name,
        "type": a.type,
        "sport_type": a.sport_type,
        "start_date": a.start_date.isoformat() if a.start_date else None,
        "start_date_local": a.start_date_local,
        "distance": a.distance,
        "moving_time": a.moving_time,
        "elapsed_time": a.elapsed_time,
        "total_elevation_gain": a.total_elevation_gain,
        "average_speed": a.average_speed,
        "max_speed": a.max_speed,
        "average_heartrate": a.average_heartrate,
        "max_heartrate": a.max_heartrate,
        "average_watts": a.average_watts,
        "kilojoules": a.kilojoules,
        "calories": a.calories
    } for a in activities]
