# backend/app/tests/test_indicators.py
import pytest
from ..services.indicators import sma, ema, rsi


def test_sma_basic():
    values = [1, 2, 3, 4, 5]
    res = sma(values, 3)
    # first two should be None, third is avg(1,2,3)=2
    assert res[0] is None
    assert res[1] is None
    assert res[2] == pytest.approx(2.0)
    assert res[4] == pytest.approx(4.0)


def test_ema_basic():
    values = [1, 2, 3, 4, 5]
    res = ema(values, 3)
    assert res[0] == pytest.approx(1.0)
    assert len(res) == 5


def test_rsi_length_and_bounds():
    # monotonic increasing values should make RSI approach 100
    values = [i for i in range(1, 30)]
    res = rsi(values, period=5)
    # ensure output list aligns and contains floats or None
    assert len(res) == len(values)
    numeric = [r for r in res if r is not None]
    assert all(0.0 <= r <= 100.0 for r in numeric)
