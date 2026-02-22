from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.oauth import OAuthConnection
from app.services.strava_oauth import StravaOAuthService
from app.services.notion_oauth import NotionOAuthService

router = APIRouter()

# ---- STATUS ----
@router.get("/status")
def get_oauth_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check which OAuth providers are connected."""
    strava = db.query(OAuthConnection).filter(
        OAuthConnection.user_id == current_user.id,
        OAuthConnection.provider == "strava"
    ).first()
    
    notion = db.query(OAuthConnection).filter(
        OAuthConnection.user_id == current_user.id,
        OAuthConnection.provider == "notion"
    ).first()
    
    return {
        "strava": {
            "connected": strava is not None,
            "expires_at": strava.expires_at.isoformat() if strava and strava.expires_at else None
        },
        "notion": {
            "connected": notion is not None,
            "expires_at": notion.expires_at.isoformat() if notion and notion.expires_at else None
        }
    }

# ---- STRAVA ----
@router.get("/strava/authorize")
def authorize_strava(current_user: User = Depends(get_current_user)):
    """Redirects the user to the Strava OAuth authorization page."""
    url = StravaOAuthService.get_authorization_url()
    return {"url": url}

@router.get("/strava/callback")
def strava_callback(
    code: str = Query(..., description="Authorization code from Strava"),
    error: str = Query(None, description="Error from Strava if any"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Handles the OAuth callback from Strava."""
    if error:
        raise HTTPException(status_code=400, detail=f"Strava error: {error}")
    
    try:
        result = StravaOAuthService.exchange_code_for_token(db, current_user.id, code)
        
        return {
            "status": "success",
            "provider": "strava",
            "athlete": result.get("athlete"),
            "message": "Successfully connected to Strava"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/strava/disconnect")
def disconnect_strava(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove Strava OAuth connection."""
    connection = db.query(OAuthConnection).filter(
        OAuthConnection.user_id == current_user.id,
        OAuthConnection.provider == "strava"
    ).first()
    
    if connection:
        db.delete(connection)
        db.commit()
    
    return {"status": "success", "message": "Strava disconnected"}

# ---- NOTION ----
@router.get("/notion/authorize")
def authorize_notion(current_user: User = Depends(get_current_user)):
    """Redirects the user to the Notion OAuth authorization page."""
    url = NotionOAuthService.get_authorization_url()
    return {"url": url}

@router.get("/notion/callback")
def notion_callback(
    code: str = Query(..., description="Authorization code from Notion"),
    error: str = Query(None, description="Error from Notion if any"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Handles the OAuth callback from Notion."""
    if error:
        raise HTTPException(status_code=400, detail=f"Notion error: {error}")
    
    try:
        result = NotionOAuthService.exchange_code_for_token(db, current_user.id, code)
        return {
            "status": "success",
            "provider": "notion",
            "message": "Successfully connected to Notion"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/notion/disconnect")
def disconnect_notion(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove Notion OAuth connection."""
    connection = db.query(OAuthConnection).filter(
        OAuthConnection.user_id == current_user.id,
        OAuthConnection.provider == "notion"
    ).first()
    
    if connection:
        db.delete(connection)
        db.commit()
    
    return {"status": "success", "message": "Notion disconnected"}
