from fastapi import APIRouter, Depends
import urllib.request
import json
from datetime import datetime, timedelta

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.profile import UserProfile

router = APIRouter()

@router.get("/sun")
def get_sun_times():
    """Get sunrise/sunset times from local weather station"""
    try:
        with urllib.request.urlopen('https://wetter.onderka.com/api/sun/', timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
        return data
    except Exception as e:
        return {"error": str(e)}

@router.get("/sun/daily")
def get_daily_sun_times(
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get sunrise/sunset times for next 10 days from Open-Meteo"""
    # Get user profile for location
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    lat = profile.latitude if profile and profile.latitude else 52.52  # Default Berlin
    lng = profile.longitude if profile and profile.longitude else 13.41
    
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&daily=sunrise,sunset&timezone=auto&forecast_days=10"
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
        
        if data.get('daily'):
            result = {}
            for i, date in enumerate(data['daily']['time']):
                result[date] = {
                    'sunrise': data['daily']['sunrise'][i],
                    'sunset': data['daily']['sunset'][i]
                }
            return result
        return {}
    except Exception as e:
        return {"error": str(e)}
