from fastapi import APIRouter
from app.api.routes import auth, oauth, strava, stats, profile

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(oauth.router, prefix="/oauth", tags=["oauth"])
api_router.include_router(strava.router, prefix="/strava", tags=["strava"])
api_router.include_router(stats.router, prefix="", tags=["stats"])
api_router.include_router(profile.router, prefix="", tags=["profile"])
