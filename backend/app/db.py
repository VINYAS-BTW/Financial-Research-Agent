# backend/app/db.py
import motor.motor_asyncio
import os
from dotenv import load_dotenv
from pymongo.errors import ConnectionFailure, ConfigurationError
import logging

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# MongoDB config
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "fin_research")

# Global Mongo client - will be initialized lazily
client = None
db = None
_db_connected = False


def _init_client():
    """Initialize MongoDB client lazily"""
    global client, db
    if client is None:
        try:
            client = motor.motor_asyncio.AsyncIOMotorClient(
                MONGO_URI,
                serverSelectionTimeoutMS=5000  # 5 second timeout
            )
            db = client[MONGO_DB_NAME]
        except Exception as e:
            logger.warning(f"Failed to create MongoDB client: {e}")
            client = None
            db = None
    return client, db


async def init_db():
    """
    Initialize MongoDB and test connection.
    Runs only once during FastAPI startup.
    Gracefully handles connection failures - app will still start.
    """
    global _db_connected
    
    _init_client()
    
    if client is None:
        logger.warning("⚠️ MongoDB client not initialized. Watchlist features will be unavailable.")
        return None
    
    try:
        # Test connection with timeout
        await client.admin.command("ping")
        _db_connected = True
        logger.info(f"✅ Connected to MongoDB: {MONGO_DB_NAME}")
        
        # Ensure indexes exist
        try:
            await db.watchlist.create_index("user_id", unique=False)
            await db.watchlist.create_index("items.symbol")
        except Exception as idx_err:
            # If watchlist collection doesn't exist yet, that's okay
            logger.debug(f"Index creation skipped: {idx_err}")
        
        return db
        
    except (ConnectionFailure, ConfigurationError, Exception) as e:
        _db_connected = False
        logger.warning(f"⚠️ MongoDB connection failed: {e}")
        logger.warning("⚠️ App will continue without MongoDB. Watchlist features will be unavailable.")
        # Don't raise - let the app start anyway
        return None


async def get_db():
    """Return the active DB instance for dependency injection."""
    if not _db_connected:
        _init_client()
    return db


def is_db_connected():
    """Check if database is connected"""
    return _db_connected


async def close_db():
    """Gracefully close MongoDB connection."""
    global client
    if client is not None:
        try:
            client.close()
            logger.info("🛑 MongoDB connection closed")
        except Exception as e:
            logger.warning(f"Error closing MongoDB connection: {e}")
