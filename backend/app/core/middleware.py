from urllib.parse import urlparse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.status import HTTP_403_FORBIDDEN

from app.core.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Inject OWASP recommended security headers on all responses."""

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if settings.COOKIE_SECURE:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    Validate Origin and Referer headers for state-changing HTTP requests
    (POST, PUT, PATCH, DELETE) to protect cookie-authenticated sessions.
    """

    SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}

    async def dispatch(self, request: Request, call_next):
        if request.method not in self.SAFE_METHODS:
            origin = request.headers.get("origin")
            referer = request.headers.get("referer")

            # Extract source origin
            source_origin = None
            if origin:
                source_origin = origin
            elif referer:
                parsed = urlparse(referer)
                port_str = f":{parsed.port}" if parsed.port and parsed.port not in (80, 443) else ""
                source_origin = f"{parsed.scheme}://{parsed.hostname}{port_str}"

            if source_origin:
                allowed_origins = set(settings.CORS_ALLOWED_ORIGINS)
                # In development, also accept localhost & 127.0.0.1 origins
                if settings.DEBUG:
                    allowed_origins.update([
                        "http://localhost:5173", "http://127.0.0.1:5173",
                        "http://localhost:3000", "http://127.0.0.1:3000",
                        "http://localhost:8000", "http://127.0.0.1:8000"
                    ])

                if source_origin not in allowed_origins:
                    from app.core.audit import log_security_event
                    log_security_event(
                        event_type="CSRF_BLOCKED",
                        status="BLOCKED",
                        ip_address=request.client.host if request.client else None,
                        metadata={"attempted_origin": source_origin, "path": request.url.path},
                    )
                    return Response(
                        content='{"detail":"Forbidden: Cross-site request blocked."}',
                        status_code=HTTP_403_FORBIDDEN,
                        media_type="application/json",
                    )

        return await call_next(request)
