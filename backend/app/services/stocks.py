import yfinance as yf
import pandas as pd
import re
import asyncio


async def fetch_stock_data(symbol, time_period):
    try:
        # --- INPUT SANITIZATION (unchanged) ---
        symbol = symbol.strip().upper()
        symbol = re.sub(r'\.+', '.', symbol)
        symbol = re.sub(r'[^A-Z0-9.]', '', symbol)

        if not symbol:
            return None, "Invalid symbol provided"

        if not (symbol.endswith(".NS") or symbol.endswith(".BO")):
            symbol = f"{symbol}.NS"

        print(f"📊 Fetching data for {symbol} ({time_period})...")

        # --- FETCH USING YFINANCE IN BACKGROUND THREAD ---
        data = await asyncio.to_thread(
            yf.download,
            symbol,
            period=time_period,
            progress=False,
            threads=False,
            timeout=10
        )

        # --- FALLBACK TO BSE ---
        if data.empty and symbol.endswith(".NS"):
            alt_symbol = symbol.replace(".NS", ".BO")
            print(f"⚠️ NSE failed, trying {alt_symbol}")

            data = await asyncio.to_thread(
                yf.download,
                alt_symbol,
                period=time_period,
                progress=False,
                threads=False,
                timeout=10
            )

        if data.empty:
            return None, f"No data found for {symbol.replace('.NS', '').replace('.BO', '')}"

        # --- FIX MULTIINDEX ---
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.get_level_values(0)

        # --- FIX MISSING CLOSE ---
        if "Close" not in data.columns:
            if "Adj Close" in data.columns:
                data["Close"] = data["Adj Close"]
            else:
                return None, "No valid 'Close' column found"

        data = data.dropna(subset=["Close"])
        if data.empty:
            return None, f"No valid close data for {symbol}"

        # --- MA20 + RSI (unchanged) ---
        data["MA20"] = data["Close"].rolling(window=20).mean()

        delta = data["Close"].diff()
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        avg_gain = gain.rolling(14).mean()
        avg_loss = loss.rolling(14).mean().replace(0, 1e-10)
        rs = avg_gain / avg_loss
        data["RSI"] = 100 - (100 / (1 + rs))

        # --- FINAL FORMAT ---
        data = data.reset_index()
        data = data[["Date", "Close", "MA20", "RSI"]].dropna()

        if data.empty:
            return None, f"No valid data points for {symbol}"

        # --- METRICS (unchanged) ---
        latest = data.iloc[-1]
        prev = data.iloc[-2] if len(data) > 1 else latest

        price_change = latest["Close"] - prev["Close"]
        pct_change = (price_change / prev["Close"] * 100) if prev["Close"] != 0 else 0
        period_return = ((latest["Close"] - data.iloc[0]["Close"]) /
                         data.iloc[0]["Close"]) * 100

        metrics = {
            "latest_price": round(latest["Close"], 2),
            "price_change": round(price_change, 2),
            "price_change_pct": round(pct_change, 2),
            "latest_rsi": round(latest["RSI"], 2),
            "data_points": len(data),
            "period_return": round(period_return, 2)
        }

        print(f"✅ Success for {symbol} ({len(data)} records)")

        return {
            "data": data.to_dict(orient="records"),
            "metrics": metrics
        }, None

    except Exception as e:
        import traceback
        traceback.print_exc()
        return None, f"Exception in fetch_stock_data: {str(e)}"
