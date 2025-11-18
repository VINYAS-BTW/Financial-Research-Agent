# backend/app/db.py
import motor.motor_asyncio
import os
from dotenv import load_dotenv
from pymongo.errors import ConnectionFailure

# Load environment variables
load_dotenv()

# MongoDB config
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "fin_research")

# Global Mongo client
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client[MONGO_DB_NAME]


async def init_db():
    """
    Initialize MongoDB and test connection.
    Runs only once during FastAPI startup.
    """
    try:
        await client.admin.command("ping")
        print(f"✅ Connected to MongoDB: {MONGO_DB_NAME}")
    except ConnectionFailure as e:
        print("❌ MongoDB connection failed:", e)
        raise e

    # Ensure indexes exist
    try:
        await db.watchlist.create_index("user_id", unique=False)
        await db.watchlist.create_index("items.symbol")
    except Exception:
        # If watchlist collection doesn't exist yet
        pass

    return db


async def get_db():
    """Return the active DB instance for dependency injection."""
    return db


async def close_db():
    """Gracefully close MongoDB connection."""
    client.close()
    print("🛑 MongoDB connection closed")
