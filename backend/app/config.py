from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # MongoDB configuration
    MONGO_URI: str = Field(
        default="mongodb://localhost:27017/financial",
        env="MONGO_URI"
    )
    MONGO_DB_NAME: str = Field(
        default="financial",
        env="MONGO_DB_NAME"
    )

    # Redis configuration
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        env="REDIS_URL"
    )

    # External API keys
    NEWS_API_KEY: str = Field(default="", env="NEWS_API_KEY")

    # Feature toggles
    YFINANCE_ENABLED: bool = Field(default=True, env="YFINANCE_ENABLED")

    # General configuration
    APP_NAME: str = "Financial Research Agent"
    ENV: str = Field(default="dev", env="ENV")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()
