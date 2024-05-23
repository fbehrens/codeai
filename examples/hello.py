def getFirstAndLastElementFromList(l: list) -> list:
    if not l:
        return []
    return [l[0], l[-1]]
