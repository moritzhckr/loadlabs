import requests
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.core.config import settings
from app.core.encryption import encrypt_token, decrypt_token
from app.models.oauth import OAuthConnection

class StravaOAuthService:
    AUTHORIZE_URL = "https://www.strava.com/oauth/authorize"
    TOKEN_URL = "https://www.strava.com/oauth/token"
    
    @staticmethod
    def get_authorization_url() -> str:
        if not settings.STRAVA_CLIENT_ID:
            raise HTTPException(status_code=500, detail="STRAVA_CLIENT_ID not configured")
        
        return (
            f"{StravaOAuthService.AUTHORIZE_URL}?"
            f"client_id={settings.STRAVA_CLIENT_ID}&"
            f"response_type=code&"
            f"redirect_uri={settings.STRAVA_REDIRECT_URI}&"
            f"approval_prompt=force&"
            f"scope=activity:read_all,profile:read_all"
        )
    
    @staticmethod
    def exchange_code_for_token(db: Session, user_id: int, code: str) -> dict:
        payload = {
            "client_id": settings.STRAVA_CLIENT_ID,
            "client_secret": settings.STRAVA_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code"
        }
        
        response = requests.post(StravaOAuthService.TOKEN_URL, data=payload)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange Strava token")
            
        data = response.json()
        StravaOAuthService._save_connection(db, user_id, data)
        return {"status": "success", "athlete": data.get("athlete")}
        
    @staticmethod
    def _save_connection(db: Session, user_id: int, data: dict):
        access_token = data.get("access_token")
        refresh_token = data.get("refresh_token")
        expires_at = datetime.utcnow() + timedelta(seconds=data.get("expires_in", 21600))
        
        connection = db.query(OAuthConnection).filter(
            OAuthConnection.user_id == user_id, 
            OAuthConnection.provider == "strava"
        ).first()
        
        if not connection:
            connection = OAuthConnection(user_id=user_id, provider="strava")
            db.add(connection)
            
        connection.access_token = encrypt_token(access_token)
        connection.refresh_token = encrypt_token(refresh_token)
        connection.expires_at = expires_at
        
        db.commit()

    @staticmethod
    def get_valid_access_token(db: Session, user_id: int) -> Optional[str]:
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
            res = requests.post(StravaOAuthService.TOKEN_URL, data=payload)
            if res.status_code == 200:
                data = res.json()
                StravaOAuthService._save_connection(db, user_id, data)
                return data.get("access_token")
            return None
            
        return decrypt_token(connection.access_token)
