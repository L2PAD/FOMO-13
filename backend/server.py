"""
Reverse proxy shim.

The Emergent platform supervisor (read-only config) always runs this FastAPI
app via `uvicorn server:app` on port 8001 and routes all `/api/*` ingress
traffic here. The real application backend is the FOMO NestJS server, which we
run on internal port 5000 (supervisor program `fomo_nest`).

This shim transparently forwards every incoming request to the NestJS backend,
preserving method, path, query string, headers (incl. cookies), and body, and
streams the response back (incl. multiple Set-Cookie headers). This keeps the
setup robust against platform supervisor reconciles that would otherwise fight
over port 8001.
"""

import os
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import Response, JSONResponse

TARGET = os.environ.get("PROXY_TARGET", "http://127.0.0.1:5000")

# Hop-by-hop headers that must not be forwarded verbatim.
HOP_BY_HOP = {
    b"connection",
    b"keep-alive",
    b"proxy-authenticate",
    b"proxy-authorization",
    b"te",
    b"trailers",
    b"transfer-encoding",
    b"upgrade",
    b"content-length",
    b"host",
}

app = FastAPI(title="FOMO proxy shim")

_client: httpx.AsyncClient | None = None


@app.on_event("startup")
async def _startup() -> None:
    global _client
    _client = httpx.AsyncClient(
        base_url=TARGET,
        timeout=httpx.Timeout(120.0, connect=10.0),
        follow_redirects=False,
        limits=httpx.Limits(max_connections=200, max_keepalive_connections=50),
    )


@app.on_event("shutdown")
async def _shutdown() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


@app.get("/__proxy_health")
async def _health() -> dict:
    return {"proxy": "ok", "target": TARGET}


@app.api_route(
    "/{full_path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def _proxy(full_path: str, request: Request) -> Response:
    assert _client is not None

    url = "/" + full_path
    if request.url.query:
        url = f"{url}?{request.url.query}"

    # Forward request headers (drop hop-by-hop) using raw bytes to preserve case
    # and duplicates.
    fwd_headers = [
        (k, v) for (k, v) in request.headers.raw if k.lower() not in HOP_BY_HOP
    ]

    body = await request.body()

    try:
        upstream = await _client.request(
            request.method,
            url,
            headers=fwd_headers,
            content=body,
        )
    except httpx.ConnectError:
        return JSONResponse(
            status_code=502,
            content={
                "error": "Backend (NestJS) is not reachable",
                "detail": f"Cannot connect to {TARGET}. It may still be starting.",
            },
        )
    except (httpx.ReadTimeout, httpx.ConnectTimeout):
        return JSONResponse(status_code=504, content={"error": "Backend timeout"})

    # Build raw response headers, preserving duplicate Set-Cookie headers and
    # dropping hop-by-hop + content-encoding/length (httpx already decoded body).
    drop = HOP_BY_HOP | {b"content-encoding"}
    raw_headers = [
        (k, v) for (k, v) in upstream.headers.raw if k.lower() not in drop
    ]

    response = Response(content=upstream.content, status_code=upstream.status_code)
    response.raw_headers = raw_headers
    return response
