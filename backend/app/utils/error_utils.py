"""
Error Utilities - Helper functions for error handling in agents

Place this in: backend/app/utils/error_utils.py
"""

from typing import Dict, Any


def clear_error(state: Dict[str, Any]) -> None:
    """
    Remove None/phantom errors from state
    """
    if "error" in state and state["error"] is None:
        state.pop("error", None)


def has_error(state: Dict[str, Any]) -> bool:
    """
    Check if state has a real error (not None)
    """
    error = state.get("error")
    return error is not None and error != ""


def set_error(state: Dict[str, Any], error_message: str) -> None:
    """
    Set error in state with proper formatting
    """
    state["error"] = str(error_message) if error_message else None


def get_error_message(state: Dict[str, Any], default: str = "Unknown error") -> str:
    """
    Get error message from state with fallback
    """
    error = state.get("error")
    if error and error != "":
        return str(error)
    return default