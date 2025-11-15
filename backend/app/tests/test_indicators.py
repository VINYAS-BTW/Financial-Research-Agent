# backend/app/tests/test_indicators.py
import pytest
import pandas as pd
from ..services.indicators import sma, ema, rsi


def to_list(series):
    """
    Convert pandas Series to a list,
    replacing NaN with None for easier testing.
    """
    return [None if (x is None or pd.isna(x)) else float(x) for x in series]


def test_sma_basic():
    values = [1, 2, 3, 4, 5]
    res = sma(pd.Series(values), 3)
    res = to_list(res)

    assert res[0] is None
    assert res[1] is None
    assert res[2] == pytest.approx(2.0)
    assert res[4] == pytest.approx(4.0)


def test_ema_basic():
    values = [1, 2, 3, 4, 5]
    res = ema(pd.Series(values), 3)
    res = to_list(res)

    assert res[0] == pytest.approx(1.0)
    assert len(res) == 5


def test_rsi_length_and_bounds():
    values = [i for i in range(1, 30)]
    res = rsi(pd.Series(values), period=5)
    res = to_list(res)

    assert len(res) == len(values)

    numeric = [r for r in res if r is not None]
    assert all(0.0 <= r <= 100.0 for r in numeric)
