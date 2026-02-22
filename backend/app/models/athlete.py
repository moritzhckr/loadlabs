from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime

class Athlete(Base):
    __tablename__ = "core_athletes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Optional basic Strava profile data cache
    firstname = Column(String(100))
    lastname = Column(String(100))
    profile_picture = Column(String(500))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", backref="athlete")
