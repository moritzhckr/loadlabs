from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.activity import Activity
from app.models.oauth import OAuthConnection

router = APIRouter()

@router.get("/athlete")
def get_athlete(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user profile."""
    # Get Strava connection to fetch athlete data
    connection = db.query(OAuthConnection).filter(
        OAuthConnection.user_id == current_user.id,
        OAuthConnection.provider == "strava"
    ).first()
    
    if not connection:
        return {
            "firstname": current_user.email.split("@")[0],
            "lastname": "",
            "id": current_user.id
        }
    
    # Return basic user info (could fetch from Strava if needed)
    return {
        "firstname": current_user.email.split("@")[0],
        "lastname": "",
        "id": current_user.id,
        "strava_connected": True
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
        "distance": a.distance or 0,
        "moving_time": a.moving_time or 0,
        "elapsed_time": a.elapsed_time or 0,
        "total_elevation_gain": a.total_elevation_gain or 0,
        "average_speed": a.average_speed or 0,
        "max_speed": a.max_speed or 0,
        "average_heartrate": a.average_heartrate,
        "max_heartrate": a.max_heartrate,
        "average_watts": a.average_watts,
        "kilojoules": a.kilojoules,
        "calories": a.calories
    } for a in activities]

@router.get("/stats/week")
def get_weekly_stats(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get weekly statistics."""
    from datetime import datetime, timedelta
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    activities = db.query(Activity).filter(
        Activity.user_id == current_user.id,
        Activity.start_date >= start_date
    ).all()
    
    # Group by day
    activities_by_day = {}
    total_distance = 0
    total_time = 0
    
    for a in activities:
        if a.start_date:
            day_key = a.start_date.strftime("%Y-%m-%d")
            if day_key not in activities_by_day:
                activities_by_day[day_key] = {"distance": 0, "time": 0, "count": 0}
            
            activities_by_day[day_key]["distance"] += (a.distance or 0) / 1000  # km
            activities_by_day[day_key]["time"] += (a.moving_time or 0) / 3600  # hours
            activities_by_day[day_key]["count"] += 1
            
            total_distance += a.distance or 0
            total_time += a.moving_time or 0
    
    return {
        "total_distance_km": round(total_distance / 1000, 1),
        "total_time_hours": round(total_time / 3600, 1),
        "total_activities": len(activities),
        "activities_by_day": activities_by_day
    }

@router.get("/stats/training-load")
def get_training_load(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculate training load (CTL, ATL, TSB)."""
    from datetime import datetime, timedelta
    import math
    
    # Get all activities from last 90 days
    start_date = datetime.utcnow() - timedelta(days=90)
    
    activities = db.query(Activity).filter(
        Activity.user_id == current_user.id,
        Activity.start_date >= start_date
    ).order_by(Activity.start_date).all()
    
    # Calculate TSS per day (simplified)
    daily_tss = {}
    for a in activities:
        if a.start_date and a.moving_time:
            day_key = a.start_date.strftime("%Y-%m-%d")
            # Rough TSS calculation: (time in hours * IF * 100) / 100
            # Assuming IF of 0.75 for simplicity
            hours = a.moving_time / 3600
            tss = hours * 0.75 * 100
            daily_tss[day_key] = daily_tss.get(day_key, 0) + tss
    
    # Calculate CTL (42-day), ATL (7-day), TSB
    ctl = 0
    atl = 0
    
    # CTL = rolling 42-day average
    ctl_values = list(daily_tss.values())
    if len(ctl_values) >= 42:
        ctl = sum(ctl_values[-42:]) / 42
    elif len(ctl_values) > 0:
        ctl = sum(ctl_values) / len(ctl_values)
    
    # ATL = rolling 7-day average
    if len(ctl_values) >= 7:
        atl = sum(ctl_values[-7:]) / 7
    elif len(ctl_values) > 0:
        atl = sum(ctl_values) / len(ctl_values)
    
    tsb = ctl - atl
    
    return {
        "ctl": round(ctl, 1),
        "atl": round(atl, 1),
        "tsb": round(tsb, 1),
        "daily_tss": daily_tss
    }

@router.get("/training-sessions")
def get_training_sessions(
    days: int = 90,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get planned training sessions (currently just past activities as placeholder)."""
    from datetime import datetime, timedelta
    
    # For now, return empty list - this would connect to Notion for planned sessions
    return []
