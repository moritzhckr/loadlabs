"""
Database models for Sport Dashboard
SQLite schema using SQLAlchemy
"""
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy.pool import StaticPool
import os

Base = declarative_base()


class Athlete(Base):
    """Strava athlete info"""
    __tablename__ = 'athletes'
    
    id = Column(Integer, primary_key=True)
    strava_id = Column(String(50), unique=True, nullable=False)
    firstname = Column(String(100))
    lastname = Column(String(100))
    city = Column(String(100))
    country = Column(String(100))
    profile_picture = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    activities = relationship("Activity", back_populates="athlete")


class Activity(Base):
    """Strava activity"""
    __tablename__ = 'activities'
    
    id = Column(Integer, primary_key=True)
    strava_id = Column(String(50), unique=True, nullable=False)
    athlete_id = Column(Integer, ForeignKey('athletes.strava_id'))
    
    name = Column(String(500))
    type = Column(String(50))  # Run, Ride, Swim, etc.
    sport_type = Column(String(50))
    
    # Distance & Time
    distance = Column(Float)  # meters
    moving_time = Column(Integer)  # seconds
    elapsed_time = Column(Integer)  # seconds
    
    # Pace & Speed
    average_speed = Column(Float)  # m/s
    max_speed = Column(Float)  # m/s
    average_pace = Column(Float)  # min/km
    
    # Heart Rate
    average_heartrate = Column(Float)
    max_heartrate = Column(Float)
    
    # Power
    average_watts = Column(Float)
    max_watts = Column(Float)
    
    # Elevation
    total_elevation_gain = Column(Float)  # meters
    elevation_high = Column(Float)
    elevation_low = Column(Float)
    
    # Gear
    gear_id = Column(String(50))
    gear_name = Column(String(100))
    
    # Date
    start_date = Column(DateTime)
    start_date_local = Column(DateTime)
    timezone = Column(String(100))
    
    # Metadata
    start_latlng = Column(String(100))  # "lat,lng"
    end_latlng = Column(String(100))
    map_polyline = Column(Text)
    
    # Stats
    calories = Column(Float)
    PR = Column(Integer, default=0)
    estimated_fitness = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    athlete = relationship("Athlete", back_populates="activities")


class Gear(Base):
    """Bikes, shoes, etc."""
    __tablename__ = 'gear'
    
    id = Column(String(50), primary_key=True)
    athlete_id = Column(String(50), ForeignKey('athletes.strava_id'))
    name = Column(String(100))
    type = Column(String(50))  # bike, shoe
    distance = Column(Float, default=0)  # total distance in meters
    
    # Bike specific
    brand_name = Column(String(100))
    model_name = Column(String(100))
    frame_type = Column(Integer)
    
    # Shoe specific
    description = Column(String(500))
    
    converted = Column(Integer, default=0)  # distance converted from mi to km


class Plan(Base):
    """Training plan from Notion"""
    __tablename__ = 'plans'
    
    id = Column(Integer, primary_key=True)
    notion_id = Column(String(50), unique=True)
    
    name = Column(String(200))
    description = Column(Text)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    
    # Plan data (JSON)
    weeks = Column(Text)  # JSON string
    
    status = Column(String(50))  # active, completed, paused
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Goal(Base):
    """Training goals"""
    __tablename__ = 'goals'
    
    id = Column(Integer, primary_key=True)
    notion_id = Column(String(50), unique=True)
    
    name = Column(String(200))
    description = Column(Text)
    
    # Goal type
    goal_type = Column(String(50))  # distance, time, activities, weight
    
    # Target values
    target_value = Column(Float)
    current_value = Column(Float, default=0)
    
    # Timeframe
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    
    # Status
    status = Column(String(50))  # active, achieved, failed
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PersonalRecord(Base):
    """Personal records"""
    __tablename__ = 'personal_records'
    
    id = Column(Integer, primary_key=True)
    athlete_id = Column(String(50), ForeignKey('athletes.strava_id'))
    
    record_type = Column(String(50))  # fastest_1k, longest_run, etc.
    activity_id = Column(String(50), ForeignKey('activities.strava_id'))
    
    value = Column(Float)
    activity_name = Column(String(500))
    achieved_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)


def get_engine(db_path: str = None):
    """Create database engine"""
    if db_path is None:
        db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'db', 'sport.db')
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    engine = create_engine(
        f'sqlite:///{db_path}',
        connect_args={'check_same_thread': False},
        poolclass=StaticPool
    )
    return engine


def init_db(db_path: str = None):
    """Initialize database tables"""
    engine = get_engine(db_path)
    Base.metadata.create_all(engine)
    return engine


def get_session(db_path: str = None):
    """Get a database session"""
    engine = get_engine(db_path)
    Session = sessionmaker(bind=engine)
    return Session()


if __name__ == "__main__":
    # Create DB
    engine = init_db()
    print(f"✅ Database created at: db/sport.db")
    print("Tables: athletes, activities, gear, plans, goals, personal_records")
