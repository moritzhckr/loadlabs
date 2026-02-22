from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime

class PerformanceSnapshot(Base):
    __tablename__ = "performance_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Training Load Metrics
    ctl = Column(Float, nullable=False, default=0.0)
    atl = Column(Float, nullable=False, default=0.0)
    tsb = Column(Float, nullable=False, default=0.0)
    
    # Estimates
    estimated_vo2max = Column(Float, nullable=True)
    estimated_ftp = Column(Float, nullable=True)
    fatigue_index = Column(Float, nullable=True)
    
    user = relationship("User", backref="performance_snapshots")
