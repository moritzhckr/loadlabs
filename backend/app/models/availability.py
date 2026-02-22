from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base

class Availability(Base):
    __tablename__ = "availabilities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    
    weekday = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    available_minutes = Column(Integer, default=0, nullable=False)
    preferred_time_window = Column(String(50), nullable=True) # e.g. "morning", "evening"
    
    user = relationship("User", backref="availabilities")


class BlockedPeriod(Base):
    __tablename__ = "blocked_periods"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    reason = Column(String(500), nullable=True)
    
    user = relationship("User", backref="blocked_periods")
