import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Sport Dashboard"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "b304c5acb3db7ddb01ea7ab5a2307106a5")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24 * 7))
    
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "password")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "sport_dashboard")
    
    # Neu: Fallback auf SQLite
    USE_SQLITE: bool = os.getenv("USE_SQLITE", "True").lower() == "true"
    
    # OAuth und Security
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "")
    
    STRAVA_CLIENT_ID: str = os.getenv("STRAVA_CLIENT_ID", "")
    STRAVA_CLIENT_SECRET: str = os.getenv("STRAVA_CLIENT_SECRET", "")
    STRAVA_REDIRECT_URI: str = os.getenv("STRAVA_REDIRECT_URI", "http://192.168.20.112:3000/oauth/strava/callback")
    
    NOTION_CLIENT_ID: str = os.getenv("NOTION_CLIENT_ID", "")
    NOTION_CLIENT_SECRET: str = os.getenv("NOTION_CLIENT_SECRET", "")
    NOTION_REDIRECT_URI: str = os.getenv("NOTION_REDIRECT_URI", "http://localhost:8080/api/v1/oauth/notion/callback")

    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.USE_SQLITE:
            import os
            db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "sport_dashboard.db")
            return f"sqlite:///{db_path}"
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()
