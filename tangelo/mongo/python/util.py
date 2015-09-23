def readValue(value):
    if not isinstance(value, str):
        return value

    try:
        return float(value)
    except ValueError:
        pass

    try:
        return int(value)
    except ValueError:
        pass

    return value
