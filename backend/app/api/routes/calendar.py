from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json
import urllib.request

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.calendar import CalendarEvent
from app.schemas.calendar import CalendarEvent as CalendarEventSchema

router = APIRouter()


@router.get("/events", response_model=List[CalendarEventSchema])
def get_calendar_events(
    start: str = None,
    end: str = None,
    refresh: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's calendar events (future events only by default)"""
    
    # Auto-refresh if URL exists and refresh requested or no events
    if current_user.calendar_url and (refresh or refresh):
        try:
            import re
            # Fetch the .ics content from URL
            with urllib.request.urlopen(current_user.calendar_url, timeout=30) as response:
                content = response.read().decode('utf-8')
            
            # Parse events
            events = []
            in_event = False
            current_event = {}
            
            for line in content.split('\n'):
                line = line.strip()
                
                if line == 'BEGIN:VEVENT':
                    in_event = True
                    current_event = {}
                elif line == 'END:VEVENT':
                    in_event = False
                    if 'summary' in current_event:
                        events.append(current_event)
                elif in_event:
                    if line.startswith('SUMMARY:'):
                        current_event['summary'] = line[8:]
                    elif line.startswith('DESCRIPTION:'):
                        current_event['description'] = line[12:]
                    elif line.startswith('DTSTART'):
                        match = re.search(r'DTSTART(?:;.*)?:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})', line)
                        if match:
                            current_event['start'] = datetime(
                                int(match.group(1)), int(match.group(2)), int(match.group(3)),
                                int(match.group(4)), int(match.group(5)), int(match.group(6))
                            )
                        else:
                            match = re.search(r'DTSTART(?:;.*)?:(\d{4})(\d{2})(\d{2})', line)
                            if match:
                                current_event['start'] = datetime(
                                    int(match.group(1)), int(match.group(2)), int(match.group(3))
                                )
                    elif line.startswith('DTEND'):
                        match = re.search(r'DTEND(?:;.*)?:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})', line)
                        if match:
                            current_event['end'] = datetime(
                                int(match.group(1)), int(match.group(2)), int(match.group(3)),
                                int(match.group(4)), int(match.group(5)), int(match.group(6))
                            )
                        else:
                            match = re.search(r'DTEND(?:;.*)?:(\d{4})(\d{2})(\d{2})', line)
                            if match:
                                current_event['end'] = datetime(
                                    int(match.group(1)), int(match.group(2)), int(match.group(3))
                                )
            
            # Delete old URL events and add new ones
            db.query(CalendarEvent).filter(
                CalendarEvent.user_id == current_user.id,
                CalendarEvent.source == 'url'
            ).delete()
            
            for ev in events:
                start = ev.get('start')
                end = ev.get('end', start)
                
                if start:
                    cal_event = CalendarEvent(
                        user_id=current_user.id,
                        title=ev.get('summary', 'Unnamed'),
                        description=ev.get('description', ''),
                        start=start,
                        end=end,
                        source='url'
                    )
                    db.add(cal_event)
            
            db.commit()
        except Exception as e:
            print(f"Auto-refresh failed: {e}")
    
    query = db.query(CalendarEvent).filter(CalendarEvent.user_id == current_user.id)
    
    # Default: only return future events
    now = datetime.now()
    query = query.filter(CalendarEvent.end >= now)
    
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
        import re
        from datetime import datetime
        
        content = file.file.read().decode('utf-8')
        
        # Simple iCal parser
        events = []
        in_event = False
        current_event = {}
        
        for line in content.split('\n'):
            line = line.strip()
            
            if line == 'BEGIN:VEVENT':
                in_event = True
                current_event = {}
            elif line == 'END:VEVENT':
                in_event = False
                if 'summary' in current_event:
                    events.append(current_event)
            elif in_event:
                if line.startswith('SUMMARY:'):
                    current_event['summary'] = line[8:]
                elif line.startswith('DESCRIPTION:'):
                    current_event['description'] = line[12:]
                elif line.startswith('DTSTART'):
                    # Parse DTSTART:20260223T100000
                    match = re.search(r'DTSTART(?:;.*)?:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})', line)
                    if match:
                        current_event['start'] = datetime(
                            int(match.group(1)), int(match.group(2)), int(match.group(3)),
                            int(match.group(4)), int(match.group(5)), int(match.group(6))
                        )
                    else:
                        # Try date only format
                        match = re.search(r'DTSTART(?:;.*)?:(\d{4})(\d{2})(\d{2})', line)
                        if match:
                            current_event['start'] = datetime(
                                int(match.group(1)), int(match.group(2)), int(match.group(3))
                            )
                elif line.startswith('DTEND'):
                    match = re.search(r'DTEND(?:;.*)?:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})', line)
                    if match:
                        current_event['end'] = datetime(
                            int(match.group(1)), int(match.group(2)), int(match.group(3)),
                            int(match.group(4)), int(match.group(5)), int(match.group(6))
                        )
                    else:
                        match = re.search(r'DTEND(?:;.*)?:(\d{4})(\d{2})(\d{2})', line)
                        if match:
                            current_event['end'] = datetime(
                                int(match.group(1)), int(match.group(2)), int(match.group(3))
                            )
        
        imported_count = 0
        for ev in events:
            start = ev.get('start')
            end = ev.get('end', start)
            
            if start:
                cal_event = CalendarEvent(
                    user_id=current_user.id,
                    title=ev.get('summary', 'Unnamed'),
                    description=ev.get('description', ''),
                    start=start,
                    end=end,
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


@router.post("/import-url")
def import_ical_from_url(
    url: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Import events from an iCal URL (Google Calendar, CalDAV, etc.)"""
    try:
        import re
        from datetime import datetime
        
        # Fetch the .ics content from URL
        with urllib.request.urlopen(url, timeout=30) as response:
            content = response.read().decode('utf-8')
        
        # Simple iCal parser (same as file import)
        events = []
        in_event = False
        current_event = {}
        
        for line in content.split('\n'):
            line = line.strip()
            
            if line == 'BEGIN:VEVENT':
                in_event = True
                current_event = {}
            elif line == 'END:VEVENT':
                in_event = False
                if 'summary' in current_event:
                    events.append(current_event)
            elif in_event:
                if line.startswith('SUMMARY:'):
                    current_event['summary'] = line[8:]
                elif line.startswith('DESCRIPTION:'):
                    current_event['description'] = line[12:]
                elif line.startswith('DTSTART'):
                    match = re.search(r'DTSTART(?:;.*)?:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})', line)
                    if match:
                        current_event['start'] = datetime(
                            int(match.group(1)), int(match.group(2)), int(match.group(3)),
                            int(match.group(4)), int(match.group(5)), int(match.group(6))
                        )
                    else:
                        match = re.search(r'DTSTART(?:;.*)?:(\d{4})(\d{2})(\d{2})', line)
                        if match:
                            current_event['start'] = datetime(
                                int(match.group(1)), int(match.group(2)), int(match.group(3))
                            )
                elif line.startswith('DTEND'):
                    match = re.search(r'DTEND(?:;.*)?:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})', line)
                    if match:
                        current_event['end'] = datetime(
                            int(match.group(1)), int(match.group(2)), int(match.group(3)),
                            int(match.group(4)), int(match.group(5)), int(match.group(6))
                        )
                    else:
                        match = re.search(r'DTEND(?:;.*)?:(\d{4})(\d{2})(\d{2})', line)
                        if match:
                            current_event['end'] = datetime(
                                int(match.group(1)), int(match.group(2)), int(match.group(3))
                            )
        
        imported_count = 0
        for ev in events:
            start = ev.get('start')
            end = ev.get('end', start)
            
            if start:
                cal_event = CalendarEvent(
                    user_id=current_user.id,
                    title=ev.get('summary', 'Unnamed'),
                    description=ev.get('description', ''),
                    start=start,
                    end=end,
                    source='url'
                )
                db.add(cal_event)
                imported_count += 1
        
        db.commit()
        
        # Save the URL to user for auto-refresh
        current_user.calendar_url = url
        db.commit()
        
        return {
            "success": True, 
            "imported": imported_count,
            "message": f"{imported_count} events imported from URL"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch/parse URL: {str(e)}")


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
