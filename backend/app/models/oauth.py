from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base

class OAuthConnection(Base):
    __tablename__ = "oauth_connections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    provider = Column(String, index=True, nullable=False)  # e.g., "strava", "notion"
    access_token = Column(String, nullable=False)  # To be encrypted
    refresh_token = Column(String, nullable=True)  # To be encrypted
    expires_at = Column(DateTime, nullable=True)
    
    user = relationship("User", backref="oauth_connections")
