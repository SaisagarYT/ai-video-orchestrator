import logging
import time
from collections import defaultdict
from typing import Tuple

import redis
from fastapi import HTTPException, Request, status

from app.core.config import settings

logger = logging.getLogger("app.security.rate_limit")

# In-memory fallback bucket in case Redis is temporarily unavailable
_in_memory_buckets: dict[str, list[float]] = defaultdict(list)

# Redis client pool
_redis_client: redis.Redis | None = None


def get_redis() -> redis.Redis | None:
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_timeout=2.0,
                socket_connect_timeout=2.0,
            )
            _redis_client.ping()
        except Exception as exc:
            logger.warning(f"Redis not reachable for rate limiting, using memory fallback: {exc}")
            _redis_client = None
    return _redis_client


def get_client_ip(request: Request) -> str:
    """Extract client IP address safely from request."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Get leftmost client IP
        return forwarded_for.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


def check_rate_limit(
    action: str,
    identifier: str,
    max_requests: int,
    window_seconds: int = 60,
) -> Tuple[bool, int, int]:
    """
    Sliding window rate limit checker.
    Returns: (is_limited: bool, remaining_requests: int, retry_after_seconds: int)
    """
    now = time.time()
    key = f"ratelimit:{action}:{identifier}"
    r = get_redis()

    if r is not None:
        try:
            pipeline = r.pipeline()
            # Remove timestamps older than current window
            pipeline.zremrangebyscore(key, 0, now - window_seconds)
            # Add current request timestamp
            pipeline.zadd(key, {str(now): now})
            # Count elements in window
            pipeline.zcard(key)
            # Set TTL on key
            pipeline.expire(key, window_seconds + 5)
            _, _, current_count, _ = pipeline.execute()

            if current_count > max_requests:
                # Find oldest item to calculate retry-after
                oldest = r.zrange(key, 0, 0, withscores=True)
                retry_after = int(window_seconds)
                if oldest:
                    retry_after = max(1, int(oldest[0][1] + window_seconds - now))
                return True, 0, retry_after

            remaining = max(0, max_requests - current_count)
            return False, remaining, 0
        except Exception as e:
            logger.error(f"Redis rate limit error, falling back to memory: {e}")

    # In-memory fallback
    timestamps = _in_memory_buckets[key]
    cutoff = now - window_seconds
    _in_memory_buckets[key] = [ts for ts in timestamps if ts > cutoff]
    _in_memory_buckets[key].append(now)

    if len(_in_memory_buckets[key]) > max_requests:
        oldest_ts = _in_memory_buckets[key][0]
        retry_after = max(1, int(oldest_ts + window_seconds - now))
        return True, 0, retry_after

    remaining = max(0, max_requests - len(_in_memory_buckets[key]))
    return False, remaining, 0


def enforce_rate_limit(
    request: Request,
    action: str,
    max_requests: int,
    window_seconds: int = 60,
    identifier: str | None = None,
):
    """Enforce rate limit or raise 429 Too Many Requests."""
    ip = get_client_ip(request)
    signals = [f"ip:{ip}"]
    if identifier:
        signals.append(f"id:{identifier.strip().lower()}")

    for sig in signals:
        is_limited, remaining, retry_after = check_rate_limit(
            action=action,
            identifier=sig,
            max_requests=max_requests,
            window_seconds=window_seconds,
        )
        if is_limited:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
                headers={"Retry-After": str(retry_after)},
            )
