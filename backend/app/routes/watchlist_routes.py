from fastapi import APIRouter, HTTPException, Request, Depends
from ..db import get_db
from datetime import datetime

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


# 🔹 Helper
def normalize_symbol(s: str) -> str:
    return (s or "").strip().upper()


# 🔹 Fetch user's watchlist
@router.get("/{user_id}")
async def get_watchlist(user_id: str, db=Depends(get_db)):
    collection = db["watchlist"]
    doc = await collection.find_one({"user_id": user_id})

    if not doc:
        return {"user_id": user_id, "items": []}

    doc["_id"] = str(doc["_id"])

    # Clean symbols
    seen, cleaned = set(), []
    for it in doc.get("items", []):
        sym = normalize_symbol(it.get("symbol"))
        if sym and sym not in seen:
            seen.add(sym)
            cleaned.append({"symbol": sym, "added_at": it.get("added_at")})

    # If duplicates removed → update DB
    if len(cleaned) != len(doc.get("items", [])):
        await collection.update_one(
            {"user_id": user_id},
            {"$set": {"items": cleaned}}
        )

    return {"user_id": user_id, "items": cleaned}


# 🔹 Add symbol to user's watchlist
@router.post("/{user_id}/add")
async def add_item(user_id: str, request: Request, db=Depends(get_db)):
    data = await request.json()
    symbol = normalize_symbol(data.get("symbol"))

    if not symbol:
        raise HTTPException(status_code=400, detail="symbol required")

    collection = db["watchlist"]
    now = datetime.utcnow()

    doc = await collection.find_one({"user_id": user_id})

    # First-time user watchlist
    if not doc:
        new_watch = {
            "user_id": user_id,
            "items": [{"symbol": symbol, "added_at": now}],
        }
        await collection.insert_one(new_watch)
        return {"ok": True, "items": new_watch["items"]}

    items = doc.get("items", [])
    if any(normalize_symbol(it.get("symbol")) == symbol for it in items):
        return {"ok": False, "message": "Already exists", "items": items}

    items.append({"symbol": symbol, "added_at": now})
    await collection.update_one({"user_id": user_id}, {"$set": {"items": items}})

    return {"ok": True, "items": items}


# 🔹 Remove symbol from watchlist
@router.post("/{user_id}/remove")
async def remove_item(user_id: str, request: Request, db=Depends(get_db)):
    data = await request.json()
    symbol = normalize_symbol(data.get("symbol"))

    if not symbol:
        raise HTTPException(status_code=400, detail="symbol required")

    collection = db["watchlist"]
    doc = await collection.find_one({"user_id": user_id})

    if not doc:
        raise HTTPException(status_code=404, detail="watchlist not found")

    items = [
        it for it in doc.get("items", [])
        if normalize_symbol(it.get("symbol")) != symbol
    ]

    await collection.update_one({"user_id": user_id}, {"$set": {"items": items}})
    return {"ok": True, "items": items}
