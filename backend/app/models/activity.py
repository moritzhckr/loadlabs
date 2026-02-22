from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base

class Activity(Base):
    __tablename__ = "core_activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    strava_id = Column(String(50), unique=True, nullable=False)
    
    name = Column(String(500))
    sport_type = Column(String(50))  # Swim, Bike, Run
    
    # Time & Distance (seconds, meters)
    duration = Column(Integer)  # mapped to moving_time typical
    distance = Column(Float)
    
    # Intensity & Details
    avg_hr = Column(Float)
    avg_power = Column(Float)
    elevation = Column(Float)  # total_elevation_gain
    
    # Engine logic
    tss = Column(Float)
    
    start_date = Column(DateTime)
    timezone = Column(String(100))
    
    user = relationship("User", backref="activities")
