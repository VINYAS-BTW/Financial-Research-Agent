# backend/app/services/indicators.py
from typing import List, Optional, Dict, Any
import math


def sma(values: List[float], period: int) -> List[Optional[float]]:
    """
    Simple Moving Average.
    Returns list aligned to last value of sliding window.
    First (period-1) entries are None.
    """
    if period < 1:
        raise ValueError("period must be >= 1")

    n = len(values)
    if n == 0:
        return []

    out: List[Optional[float]] = [None] * n
    window_sum = 0.0

    for i in range(n):
        window_sum += values[i]
        if i >= period:
            window_sum -= values[i - period]

        if i >= period - 1:
            out[i] = window_sum / period

    return out


def ema(values: List[float], period: int) -> List[Optional[float]]:
    """
    Exponential Moving Average using smoothing multiplier = 2/(period+1)
    """
    if period < 1:
        raise ValueError("period must be >= 1")

    n = len(values)
    if n == 0:
        return []

    out: List[Optional[float]] = [None] * n
    k = 2 / (period + 1)

    prev = None
    for i, v in enumerate(values):
        if prev is None:
            prev = v
        else:
            prev = (v - prev) * k + prev

        out[i] = prev

    return out


def rsi(values: List[float], period: int = 14) -> List[Optional[float]]:
    """
    Relative Strength Index (RSI) using Wilder smoothing.
    First entries where RSI cannot be computed are None.
    """
    if period < 1:
        raise ValueError("period must be >= 1")

    n = len(values)
    if n == 0:
        return []

    gains = [0.0] * n
    losses = [0.0] * n

    for i in range(1, n):
        change = values[i] - values[i - 1]
        gains[i] = max(change, 0.0)
        losses[i] = max(-change, 0.0)

    avg_gain = None
    avg_loss = None
    out: List[Optional[float]] = [None] * n

    for i in range(1, n):
        if i < period:
            continue

        if i == period:
            avg_gain = sum(gains[1 : period + 1]) / period
            avg_loss = sum(losses[1 : period + 1]) / period
        else:
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period

        if avg_loss == 0:
            out[i] = 100.0
        else:
            rs = avg_gain / avg_loss
            out[i] = 100.0 - (100.0 / (1 + rs))

    return out


def calculate_rsi(historical_data: List[Dict[str, Any]], period: int = 14) -> Dict[str, Any]:
    """
    Calculate RSI from historical stock data
    historical_data should be a list of dicts with 'Close' key
    """
    if not historical_data:
        return {"current": 50.0, "values": []}
    
    # Extract closing prices
    closes = [float(d.get("Close", 0)) for d in historical_data if d.get("Close")]
    
    if len(closes) < period + 1:
        return {"current": 50.0, "values": []}
    
    # Calculate RSI
    rsi_values = rsi(closes, period)
    
    # Get current (last) RSI value
    current_rsi = rsi_values[-1] if rsi_values and rsi_values[-1] is not None else 50.0
    
    return {
        "current": round(current_rsi, 2),
        "values": [round(v, 2) if v is not None else None for v in rsi_values]
    }


def calculate_macd(historical_data: List[Dict[str, Any]], 
                   fast_period: int = 12, 
                   slow_period: int = 26, 
                   signal_period: int = 9) -> Dict[str, Any]:
    """
    Calculate MACD (Moving Average Convergence Divergence)
    """
    if not historical_data:
        return {"macd": 0, "signal": 0, "histogram": 0}
    
    closes = [float(d.get("Close", 0)) for d in historical_data if d.get("Close")]
    
    if len(closes) < slow_period + signal_period:
        return {"macd": 0, "signal": 0, "histogram": 0}
    
    # Calculate EMAs
    fast_ema = ema(closes, fast_period)
    slow_ema = ema(closes, slow_period)
    
    # Calculate MACD line (difference between fast and slow EMA)
    macd_line = []
    for i in range(len(closes)):
        if fast_ema[i] is not None and slow_ema[i] is not None:
            macd_line.append(fast_ema[i] - slow_ema[i])
        else:
            macd_line.append(None)
    
    # Calculate signal line (EMA of MACD line)
    macd_values = [v for v in macd_line if v is not None]
    if len(macd_values) < signal_period:
        return {"macd": 0, "signal": 0, "histogram": 0}
    
    signal_line = ema(macd_values, signal_period)
    
    # Get current values
    current_macd = macd_line[-1] if macd_line and macd_line[-1] is not None else 0
    current_signal = signal_line[-1] if signal_line and signal_line[-1] is not None else 0
    histogram = current_macd - current_signal
    
    return {
        "macd": round(current_macd, 4),
        "signal": round(current_signal, 4),
        "histogram": round(histogram, 4)
    }


def calculate_bollinger_bands(historical_data: List[Dict[str, Any]], 
                              period: int = 20, 
                              std_dev: float = 2.0) -> Dict[str, Any]:
    """
    Calculate Bollinger Bands
    """
    if not historical_data:
        return {"upper_band": 0, "middle_band": 0, "lower_band": 0, "current_price": 0}
    
    closes = [float(d.get("Close", 0)) for d in historical_data if d.get("Close")]
    
    if len(closes) < period:
        current_price = closes[-1] if closes else 0
        return {
            "upper_band": current_price,
            "middle_band": current_price,
            "lower_band": current_price,
            "current_price": current_price
        }
    
    # Calculate SMA (middle band)
    sma_values = sma(closes, period)
    middle_band = sma_values[-1] if sma_values and sma_values[-1] is not None else closes[-1]
    
    # Calculate standard deviation
    recent_closes = closes[-period:]
    mean = sum(recent_closes) / len(recent_closes)
    variance = sum((x - mean) ** 2 for x in recent_closes) / len(recent_closes)
    std = math.sqrt(variance)
    
    # Calculate bands
    upper_band = middle_band + (std_dev * std)
    lower_band = middle_band - (std_dev * std)
    current_price = closes[-1]
    
    return {
        "upper_band": round(upper_band, 2),
        "middle_band": round(middle_band, 2),
        "lower_band": round(lower_band, 2),
        "current_price": round(current_price, 2)
    }


def calculate_moving_averages(historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate multiple moving averages (SMA 50, SMA 200)
    """
    if not historical_data:
        return {"sma_50": 0, "sma_200": 0}
    
    closes = [float(d.get("Close", 0)) for d in historical_data if d.get("Close")]
    
    # Calculate SMA 50
    sma_50_values = sma(closes, 50)
    sma_50 = sma_50_values[-1] if sma_50_values and sma_50_values[-1] is not None else (closes[-1] if closes else 0)
    
    # Calculate SMA 200
    sma_200_values = sma(closes, 200)
    sma_200 = sma_200_values[-1] if sma_200_values and sma_200_values[-1] is not None else (closes[-1] if closes else 0)
    
    return {
        "sma_50": round(sma_50, 2),
        "sma_200": round(sma_200, 2)
    }
def calculate_all_indicators(historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate all technical indicators at once
    This is what unified_agent_graph.py expects
    """
    if not historical_data:
        return {
            "rsi": {"current": 50.0, "values": []},
            "macd": {"macd": 0, "signal": 0, "histogram": 0},
            "bollinger_bands": {"upper_band": 0, "middle_band": 0, "lower_band": 0, "current_price": 0},
            "moving_averages": {"sma_50": 0, "sma_200": 0},
            "signals": {"overall_signal": "hold", "strength": 0}
        }
    
    try:
        rsi_data = calculate_rsi(historical_data)
        macd_data = calculate_macd(historical_data)
        bb_data = calculate_bollinger_bands(historical_data)
        ma_data = calculate_moving_averages(historical_data)
        
        # Calculate overall signal based on indicators
        signal, strength = _calculate_overall_signal(rsi_data, macd_data, ma_data)
        
        return {
            "rsi": rsi_data,
            "macd": macd_data,
            "bollinger_bands": bb_data,
            "moving_averages": ma_data,
            "signals": {
                "overall_signal": signal,
                "strength": strength
            }
        }
    except Exception as e:
        return {
            "rsi": {"current": 50.0, "values": []},
            "macd": {"macd": 0, "signal": 0, "histogram": 0},
            "bollinger_bands": {"upper_band": 0, "middle_band": 0, "lower_band": 0, "current_price": 0},
            "moving_averages": {"sma_50": 0, "sma_200": 0},
            "signals": {"overall_signal": "hold", "strength": 0},
            "error": str(e)
        }


def _calculate_overall_signal(rsi_data: Dict, macd_data: Dict, ma_data: Dict) -> tuple:
    """
    Calculate overall buy/sell signal based on multiple indicators
    Returns (signal, strength) where:
    - signal: "strong_buy", "buy", "hold", "sell", "strong_sell"
    - strength: 0-5 (number of indicators agreeing)
    """
    signals = []
    
    # RSI signals
    rsi_current = rsi_data.get("current", 50)
    if rsi_current < 30:
        signals.append("buy")
    elif rsi_current > 70:
        signals.append("sell")
    else:
        signals.append("neutral")
    
    # MACD signals
    macd_histogram = macd_data.get("histogram", 0)
    if macd_histogram > 0:
        signals.append("buy")
    elif macd_histogram < 0:
        signals.append("sell")
    else:
        signals.append("neutral")
    
    # Moving average signals (golden cross / death cross)
    sma_50 = ma_data.get("sma_50", 0)
    sma_200 = ma_data.get("sma_200", 0)
    if sma_50 > sma_200:
        signals.append("buy")
    elif sma_50 < sma_200:
        signals.append("sell")
    else:
        signals.append("neutral")
    
    # Count signals
    buy_count = signals.count("buy")
    sell_count = signals.count("sell")
    
    # Determine overall signal
    if buy_count >= 2:
        overall = "strong_buy" if buy_count == 3 else "buy"
        strength = buy_count
    elif sell_count >= 2:
        overall = "strong_sell" if sell_count == 3 else "sell"
        strength = sell_count
    else:
        overall = "hold"
        strength = 0
    
    return overall, strength