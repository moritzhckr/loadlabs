from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.db.database import Base

class Activity(Base):
    __tablename__ = "core_activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    strava_id = Column(String(50), unique=True, nullable=False, index=True)
    
    name = Column(String(500))
    type = Column(String(50))
    sport_type = Column(String(50))  # Swim, Bike, Run
    
    # Time fields
    start_date = Column(DateTime)
    start_date_local = Column(String(50))
    timezone = Column(String(100))
    moving_time = Column(Integer)  # seconds
    elapsed_time = Column(Integer)  # seconds
    
    # Distance (meters)
    distance = Column(Float)
    
    # Elevation (meters)
    total_elevation_gain = Column(Float)
    
    # Speed (m/s)
    average_speed = Column(Float)
    max_speed = Column(Float)
    
    # Heart rate (bpm)
    average_heartrate = Column(Float)
    max_heartrate = Column(Float)
    
    # Power (watts)
    average_watts = Column(Float)
    
    # Energy
    kilojoules = Column(Float)
    calories = Column(Float)
    
    # Other
    description = Column(Text)
    gear_id = Column(String(50))
    
    # Computed
    tss = Column(Float)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", backref="activities")
