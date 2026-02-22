import requests
import base64
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.core.config import settings
from app.core.encryption import encrypt_token, decrypt_token
from app.models.oauth import OAuthConnection

class NotionOAuthService:
    AUTHORIZE_URL = "https://api.notion.com/v1/oauth/authorize"
    TOKEN_URL = "https://api.notion.com/v1/oauth/token"
    
    @staticmethod
    def get_authorization_url() -> str:
        if not settings.NOTION_CLIENT_ID:
            raise HTTPException(status_code=500, detail="NOTION_CLIENT_ID not configured")
        
        return (
            f"{NotionOAuthService.AUTHORIZE_URL}?"
            f"client_id={settings.NOTION_CLIENT_ID}&"
            f"response_type=code&"
            f"owner=user&"
            f"redirect_uri={settings.NOTION_REDIRECT_URI}"
        )
    
    @staticmethod
    def exchange_code_for_token(db: Session, user_id: int, code: str) -> dict:
        auth_header = base64.b64encode(
            f"{settings.NOTION_CLIENT_ID}:{settings.NOTION_CLIENT_SECRET}".encode()
        ).decode()

        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.NOTION_REDIRECT_URI
        }
        
        response = requests.post(NotionOAuthService.TOKEN_URL, headers=headers, json=payload)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange Notion token")
            
        data = response.json()
        NotionOAuthService._save_connection(db, user_id, data)
        return {"status": "success", "workspace_name": data.get("workspace_name")}
        
    @staticmethod
    def _save_connection(db: Session, user_id: int, data: dict):
        access_token = data.get("access_token")
        
        connection = db.query(OAuthConnection).filter(
            OAuthConnection.user_id == user_id, 
            OAuthConnection.provider == "notion"
        ).first()
        
        if not connection:
            connection = OAuthConnection(user_id=user_id, provider="notion")
            db.add(connection)
            
        connection.access_token = encrypt_token(access_token)
        connection.refresh_token = None
        connection.expires_at = None
        
        db.commit()

    @staticmethod
    def get_valid_access_token(db: Session, user_id: int) -> Optional[str]:
        # Checks if we have an internal integration token set in env directly (Fallback)
        # Notion Internal integration tokens start with "secret_"
        fallback_token = settings.NOTION_CLIENT_SECRET
        if fallback_token and fallback_token.startswith("secret_"):
            return fallback_token
            
        connection = db.query(OAuthConnection).filter(
            OAuthConnection.user_id == user_id, 
            OAuthConnection.provider == "notion"
        ).first()
        
        if not connection:
            return None
            
        return decrypt_token(connection.access_token)
