from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    
    title = Column(String(200), nullable=False)
    
    # Types: event, performance, body_composition
    metric_type = Column(String(50), nullable=False)
    target_value = Column(Float, nullable=False)
    
    event_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="active") # active, achieved, failed
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", backref="goals")
