from fastapi import APIRouter, HTTPException, Request
from ..db import db
from datetime import datetime

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


# 🔹 Helper
def normalize_symbol(s: str) -> str:
    return (s or "").strip().upper()


# 🔹 Fetch user's watchlist
@router.get("/{user_id}")
async def get_watchlist(user_id: str):
    doc = await db.watchlist.find_one({"user_id": user_id})
    if not doc:
        return {"user_id": user_id, "items": []}

    # Convert ObjectId to string
    doc["_id"] = str(doc["_id"])
    # Ensure symbols are uppercase and no duplicates
    seen, cleaned = set(), []
    for it in doc.get("items", []):
        sym = normalize_symbol(it.get("symbol"))
        if sym and sym not in seen:
            seen.add(sym)
            cleaned.append({"symbol": sym, "added_at": it.get("added_at")})

    if len(cleaned) != len(doc.get("items", [])):
        await db.watchlist.update_one(
            {"user_id": user_id}, {"$set": {"items": cleaned}}
        )

    return {"user_id": user_id, "items": cleaned}


# 🔹 Add symbol to user's watchlist
@router.post("/{user_id}/add")
async def add_item(user_id: str, request: Request):
    data = await request.json()
    symbol = normalize_symbol(data.get("symbol"))

    if not symbol:
        raise HTTPException(status_code=400, detail="symbol required")

    now = datetime.utcnow()
    doc = await db.watchlist.find_one({"user_id": user_id})

    if not doc:
        new_watch = {
            "user_id": user_id,
            "items": [{"symbol": symbol, "added_at": now}],
        }
        await db.watchlist.insert_one(new_watch)
        return {"ok": True, "items": new_watch["items"]}

    items = doc.get("items", [])
    if any(normalize_symbol(it.get("symbol")) == symbol for it in items):
        return {"ok": False, "message": "Already exists", "items": items}

    items.append({"symbol": symbol, "added_at": now})
    await db.watchlist.update_one({"user_id": user_id}, {"$set": {"items": items}})
    return {"ok": True, "items": items}


# 🔹 Remove symbol from watchlist
@router.post("/{user_id}/remove")
async def remove_item(user_id: str, request: Request):
    data = await request.json()
    symbol = normalize_symbol(data.get("symbol"))

    if not symbol:
        raise HTTPException(status_code=400, detail="symbol required")

    doc = await db.watchlist.find_one({"user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="watchlist not found")

    items = [it for it in doc.get("items", []) if normalize_symbol(it.get("symbol")) != symbol]

    await db.watchlist.update_one({"user_id": user_id}, {"$set": {"items": items}})
    return {"ok": True, "items": items}
