from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "sqlite:///./zoom.db"
    frontend_url: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()