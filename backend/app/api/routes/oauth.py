from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.strava_oauth import StravaOAuthService
from app.services.notion_oauth import NotionOAuthService

router = APIRouter()

# ---- STRAVA ----
@router.get("/strava/authorize")
def authorize_strava(current_user: User = Depends(get_current_user)):
    """Redirects the user to the Strava OAuth authorization page."""
    url = StravaOAuthService.get_authorization_url()
    # we return a dict with the url so the frontend can redirect, 
    # instead of redirecting directly (better for SPAs)
    return {"url": url}

@router.get("/strava/callback")
def strava_callback(
    code: str = Query(..., description="Authorization code from Strava"),
    # For simplicity, we assume we want to attach this to a logged-in user.
    # In a real SPA flow, state might be passed to map the callback to a user,
    # or the token from the JWT can be sent if this isn't a direct browser callback. 
    # Since OAuth callbacks are browser-redirects, we usually use states.
    # For now, let's just make it a JSON endpoint for the frontend to call after receiving the code.
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Handles the OAuth callback from Strava."""
    res = StravaOAuthService.exchange_code_for_token(db, current_user.id, code)
    return res

# ---- NOTION ----
@router.get("/notion/authorize")
def authorize_notion(current_user: User = Depends(get_current_user)):
    """Redirects the user to the Notion OAuth authorization page."""
    url = NotionOAuthService.get_authorization_url()
    return {"url": url}

@router.get("/notion/callback")
def notion_callback(
    code: str = Query(..., description="Authorization code from Notion"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Handles the OAuth callback from Notion."""
    res = NotionOAuthService.exchange_code_for_token(db, current_user.id, code)
    return res
