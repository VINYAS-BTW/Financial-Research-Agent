from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # ✅ MongoDB Atlas connection (fallback to localhost)
    MONGO_URI: str = Field(
        "mongodb://localhost:27017/financial", env="MONGO_URI"
    )
    MONGO_DB_NAME: str = Field("financial", env="MONGO_DB_NAME")

    # ✅ Redis (optional — safe default for local testing)
    REDIS_URL: str = Field("redis://localhost:6379/0", env="REDIS_URL")

    # ✅ APIs and general app settings
    NEWS_API_KEY: str = Field("", env="NEWS_API_KEY")
    YFINANCE_ENABLED: bool = Field(True, env="YFINANCE_ENABLED")
    APP_NAME: str = "Financial Research Agent"
    ENV: str = Field("dev", env="ENV")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# ✅ Instantiate global settings
settings = Settings()
