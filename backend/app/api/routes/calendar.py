from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.calendar import CalendarEvent
from app.schemas.calendar import CalendarEvent as CalendarEventSchema

router = APIRouter()


@router.get("/events", response_model=List[CalendarEventSchema])
def get_calendar_events(
    start: str = None,
    end: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's calendar events"""
    query = db.query(CalendarEvent).filter(CalendarEvent.user_id == current_user.id)
    
    if start:
        try:
            start_dt = datetime.fromisoformat(start)
            query = query.filter(CalendarEvent.end >= start_dt)
        except ValueError:
            pass
    
    if end:
        try:
            end_dt = datetime.fromisoformat(end)
            query = query.filter(CalendarEvent.start <= end_dt)
        except ValueError:
            pass
    
    events = query.order_by(CalendarEvent.start.asc()).all()
    return events


@router.post("/import")
def import_ical(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Import events from iCal file"""
    try:
        from ics import Calendar
        
        content = file.file.read().decode('utf-8')
        c = Calendar(content)
        
        imported_count = 0
        for event in c.events:
            # Parse start/end times
            if event.begin:
                start_dt = event.begin.datetime
                end_dt = event.end.datetime if event.end else start_dt
                
                # Create event in DB
                cal_event = CalendarEvent(
                    user_id=current_user.id,
                    title=event.name or "Unnamed Event",
                    description=event.description,
                    start=start_dt,
                    end=end_dt,
                    all_day=event.all_day if hasattr(event, 'all_day') else False,
                    source='ical'
                )
                db.add(cal_event)
                imported_count += 1
        
        db.commit()
        
        return {
            "success": True, 
            "imported": imported_count,
            "message": f"{imported_count} events imported"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse iCal: {str(e)}")


@router.delete("/events/{event_id}")
def delete_calendar_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a calendar event"""
    event = db.query(CalendarEvent).filter(
        CalendarEvent.id == event_id,
        CalendarEvent.user_id == current_user.id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
    
    return {"success": True}


@router.delete("/events")
def clear_calendar_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clear all calendar events"""
    db.query(CalendarEvent).filter(CalendarEvent.user_id == current_user.id).delete()
    db.commit()
    
    return {"success": True, "message": "All calendar events cleared"}
