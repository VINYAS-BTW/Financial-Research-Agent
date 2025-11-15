def clear_error(state):
    """
    Removes 'error' if it is None/empty to prevent LangGraph infinite loops.
    """
    if state.get("error") in (None, "", [] , {}):
        state.pop("error", None)
