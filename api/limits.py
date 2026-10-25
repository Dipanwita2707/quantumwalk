"""Small per-process request budget for the local API."""

from collections import defaultdict, deque
from contextlib import contextmanager
from threading import BoundedSemaphore, Lock
from time import monotonic

from fastapi import HTTPException, Request

_events: dict[tuple[str, str], deque[float]] = defaultdict(deque)
_lock = Lock()
_simulation_slots = BoundedSemaphore(value=2)


@contextmanager
def simulation_slot():
    if not _simulation_slots.acquire(blocking=False):
        raise HTTPException(status_code=429, detail="The simulator is busy. Please try again shortly.")
    try:
        yield
    finally:
        _simulation_slots.release()


def enforce_rate(request: Request, group: str, limit: int, window_seconds: int = 60) -> None:
    # A deployment behind a proxy must configure trusted proxy headers at the host.
    address = request.client.host if request.client else "unknown"
    key = (group, address)
    now = monotonic()
    with _lock:
        if key not in _events and len(_events) >= 5000:
            for old_key, old_times in list(_events.items()):
                if not old_times or old_times[-1] <= now - window_seconds:
                    del _events[old_key]
            if len(_events) >= 5000:
                raise HTTPException(status_code=429, detail="The request limit is temporarily full")
        times = _events[key]
        while times and times[0] <= now - window_seconds:
            times.popleft()
        if len(times) >= limit:
            raise HTTPException(status_code=429, detail="Too many requests. Please wait and try again.")
        times.append(now)
