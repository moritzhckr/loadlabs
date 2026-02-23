from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserProfileBase(BaseModel):
    weight: float
    height: Optional[float] = None
    resting_hr: Optional[int] = None
    max_hr: Optional[int] = None
    timezone: str = "UTC"
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileUpdate(BaseModel):
    weight: Optional[float] = None
    height: Optional[float] = None
    resting_hr: Optional[int] = None
    max_hr: Optional[int] = None
    timezone: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class UserProfile(UserProfileBase):
    id: int
    user_id: int

    model_config = {
        "from_attributes": True
    }

class BodyMetricBase(BaseModel):
    weight: float
    date: Optional[datetime] = None

class BodyMetricCreate(BodyMetricBase):
    pass

class BodyMetric(BodyMetricBase):
    id: int
    user_id: int
    date: datetime

    model_config = {
        "from_attributes": True
    }
