"""
Strava API OAuth Client
Handles authorization, token refresh, and API requests
"""
import os
import requests
from datetime import datetime, timedelta
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# Strava API Configuration
STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize"
STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"
STRAVA_API_URL = "https://www.strava.com/api/v3"

CLIENT_ID = os.getenv("STRAVA_CLIENT_ID")
CLIENT_SECRET = os.getenv("STRAVA_CLIENT_SECRET")


class StravaClient:
    def __init__(self):
        self.access_token = os.getenv("STRAVA_ACCESS_TOKEN")
        self.refresh_token = os.getenv("STRAVA_REFRESH_TOKEN")
        self.token_expires_at = os.getenv("STRAVA_TOKEN_EXPIRES_AT")
    
    def get_authorization_url(self, redirect_uri: str = "http://localhost:8000/callback") -> str:
        """Generate OAuth authorization URL"""
        params = {
            "client_id": CLIENT_ID,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "activity:read_all",
            "approval_prompt": "auto"
        }
        return f"{STRAVA_AUTH_URL}?" + "&".join([f"{k}={v}" for k, v in params.items()])
    
    def exchange_code_for_token(self, code: str) -> dict:
        """Exchange authorization code for access token"""
        data = {
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code"
        }
        response = requests.post(STRAVA_TOKEN_URL, data=data)
        response.raise_for_status()
        return response.json()
    
    def refresh_access_token(self) -> dict:
        """Refresh the access token"""
        data = {
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "refresh_token": self.refresh_token,
            "grant_type": "refresh_token"
        }
        response = requests.post(STRAVA_TOKEN_URL, data=data)
        response.raise_for_status()
        tokens = response.json()
        
        # Update stored tokens
        self.access_token = tokens.get("access_token")
        self.refresh_token = tokens.get("refresh_token")
        self.token_expires_at = tokens.get("expires_at")
        
        return tokens
    
    def is_token_expired(self) -> bool:
        """Check if token is expired"""
        if not self.token_expires_at:
            return True
        
        # Handle both string (ISO) and int (Unix timestamp)
        if isinstance(self.token_expires_at, str):
            try:
                expires = datetime.fromisoformat(self.token_expires_at.replace("Z", "+00:00"))
            except ValueError:
                expires = datetime.fromtimestamp(int(self.token_expires_at))
        else:
            # Unix timestamp
            expires = datetime.fromtimestamp(int(self.token_expires_at))
        
        now = datetime.now(expires.tzinfo) if expires.tzinfo else datetime.now()
        return now > expires - timedelta(minutes=5)
    
    def ensure_valid_token(self):
        """Ensure we have a valid access token"""
        if self.is_token_expired():
            self.refresh_access_token()
    
    def get_activities(self, per_page: int = 30, page: int = 1) -> list:
        """Fetch activities from Strava"""
        self.ensure_valid_token()
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        params = {"per_page": per_page, "page": page}
        
        response = requests.get(
            f"{STRAVA_API_URL}/athlete/activities",
            headers=headers,
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def get_athlete(self) -> dict:
        """Get athlete profile"""
        self.ensure_valid_token()
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.get(f"{STRAVA_API_URL}/athlete", headers=headers)
        response.raise_for_status()
        return response.json()


if __name__ == "__main__":
    client = StravaClient()
    
    # Test: Get current athlete
    try:
        athlete = client.get_athlete()
        print(f"✅ Connected to Strava: {athlete.get('firstname')} {athlete.get('lastname')}")
        
        # Get last 5 activities
        activities = client.get_activities(per_page=5)
        print(f"\n📊 Last {len(activities)} activities:")
        for a in activities:
            print(f"  - {a.get('name')} | {a.get('distance')}m | {a.get('moving_time')}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
