from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.models.activity import Activity

class PerformanceEngine:
    
    @staticmethod
    def calculate_tss(activity: Activity) -> float:
        """Calculate Training Stress Score for an activity"""
        if not activity.duration or not activity.distance:
            return 0
        
        # Estimate IF (Intensity Factor) from heartrate if available
        if activity.avg_hr:
            # Assuming a standard max HR of 185 for the estimation
            estimated_if = min(activity.avg_hr / 185, 1.2)
        elif getattr(activity, 'avg_power', None) and activity.duration:
            # Placeholder for power-based IF (needs FTP)
            estimated_if = 0.8
        else:
            estimated_if = 0.7  # Default dummy
        
        # TSS = (seconds * IF^2 * 100) / 3600
        tss = (activity.duration * estimated_if * estimated_if * 100) / 3600
        return tss

    @staticmethod
    def calculate_training_load(activities: List[Activity]) -> Dict[str, Any]:
        """Calculate CTL (42-day), ATL (7-day), and TSB from a list of activities."""
        # Calculate daily TSS for the last 42 days minimum
        daily_tss = {}
        for a in activities:
            if a.start_date:
                day = a.start_date.strftime("%Y-%m-%d")
                tss = PerformanceEngine.calculate_tss(a)
                daily_tss[day] = daily_tss.get(day, 0) + tss
        
        # Generate last 42 days sequentially to compute rolling averages
        today = datetime.now()
        
        # Calculate ATL (7-day rolling average)
        atl = 0
        for i in range(7):
            day = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            atl += daily_tss.get(day, 0)
        atl = atl / 7 if daily_tss else 0
        
        # Calculate CTL (42-day rolling average)
        ctl = 0
        for i in range(42):
            day = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            ctl += daily_tss.get(day, 0)
        ctl = ctl / 42 if daily_tss else 0
        
        tsb = ctl - atl
        
        return {
            "ctl": ctl,
            "atl": atl,
            "tsb": tsb,
            "daily_tss": daily_tss
        }
