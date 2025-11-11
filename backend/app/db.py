# backend/app/db.py
import motor.motor_asyncio
import os
from dotenv import load_dotenv
from pymongo.errors import ConnectionFailure

# ✅ Load environment variables from .env
load_dotenv()

# ✅ Get MongoDB config
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "fin_research")

# ✅ Initialize client
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client[MONGO_DB_NAME]


async def init_db():
    """
    Initialize MongoDB indexes and test connection.
    This runs once during FastAPI startup.
    """
    try:
        # Ping the server to confirm connection
        await client.admin.command("ping")
        print(f"✅ Connected to MongoDB: {MONGO_DB_NAME}")
    except ConnectionFailure as e:
        print("❌ MongoDB connection failed:", e)
        raise e

    # Ensure indexes exist (safe to call every time)
    await db.watchlist.create_index("user_id", unique=False)
    await db.watchlist.create_index("items.symbol")
    return db
