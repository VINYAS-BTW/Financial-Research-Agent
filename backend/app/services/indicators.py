# backend/app/services/indicators.py
from typing import List, Optional


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
