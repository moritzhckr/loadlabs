from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.api.deps import get_db, get_current_user
from app.models.user import User, UserProfile, BodyMetric
from app.schemas.profile import (
    UserProfile as UserProfileSchema,
    UserProfileCreate,
    UserProfileUpdate,
    BodyMetric as BodyMetricSchema,
    BodyMetricCreate,
)

router = APIRouter()


@router.get("/profile", response_model=UserProfileSchema)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's profile"""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        # Create default profile if none exists
        profile = UserProfile(
            user_id=current_user.id,
            weight=70.0,  # Default weight
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.put("/profile", response_model=UserProfileSchema)
def update_profile(
    profile_update: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user's profile"""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
    
    update_data = profile_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/metrics", response_model=List[BodyMetricSchema])
def get_body_metrics(
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's body metrics history"""
    metrics = db.query(BodyMetric).filter(
        BodyMetric.user_id == current_user.id
    ).order_by(BodyMetric.date.desc()).limit(limit).all()
    return metrics


@router.post("/metrics", response_model=BodyMetricSchema)
def add_body_metric(
    metric: BodyMetricCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a new body metric entry"""
    body_metric = BodyMetric(
        user_id=current_user.id,
        date=metric.date or datetime.utcnow(),
        weight=metric.weight
    )
    db.add(body_metric)
    db.commit()
    db.refresh(body_metric)
    return body_metric
