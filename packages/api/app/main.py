from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from sqlalchemy import text

from app.config import get_settings
from app.exceptions import register_exception_handlers
from app.middleware.csrf import CSRFMiddleware
from app.routers import admin, analysis, auth, comments, integrations, projects, reports, stats, tokens, upload, webhooks

settings = get_settings()

# Fail fast: reject weak JWT secret in production
if settings.ENVIRONMENT != "development" and settings.JWT_SECRET == "change-me-in-production":
    raise RuntimeError(
        "FATAL: JWT_SECRET must be changed from the default value in production. "
        "Set a strong random secret via the JWT_SECRET environment variable."
    )


def _get_rate_limit_key(request: Request) -> str:
    api_key = request.headers.get("X-API-Key")
    if api_key and len(api_key) >= 8:
        return f"apikey:{api_key[:8]}"
    return get_remote_address(request)


limiter = Limiter(key_func=_get_rate_limit_key, default_limits=["100/minute"])

app = FastAPI(
    title="BugSpark API",
    description="Universal bug reporting backend",
    version="0.1.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key", "X-CSRF-Token", "Accept-Language"],
)
app.add_middleware(CSRFMiddleware)

register_exception_handlers(app)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(tokens.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(upload.router, prefix="/api/v1")
app.include_router(comments.router, prefix="/api/v1")
app.include_router(webhooks.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")
app.include_router(analysis.router, prefix="/api/v1")
app.include_router(integrations.router, prefix="/api/v1")


@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check() -> dict[str, str] | JSONResponse:
    from app.database import engine

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "healthy", "db": "connected"}
    except Exception:
        import logging
        logging.getLogger(__name__).warning("Health check DB probe failed", exc_info=True)
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "db": "unreachable"},
        )


_LANDING_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BugSpark API</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
    background:#0f172a;color:#e2e8f0;min-height:100vh;display:flex;flex-direction:column;
    align-items:center;justify-content:center;padding:2rem}
  .card{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:3rem;
    max-width:560px;width:100%;text-align:center;box-shadow:0 25px 50px rgba(0,0,0,.3)}
  .logo{font-size:2.5rem;margin-bottom:.25rem}
  h1{font-size:1.75rem;font-weight:700;margin-bottom:.25rem;color:#f8fafc}
  .subtitle{color:#94a3b8;font-size:.95rem;margin-bottom:2rem}
  .badge{display:inline-flex;align-items:center;gap:6px;background:#065f46;color:#6ee7b7;
    font-size:.8rem;font-weight:600;padding:4px 12px;border-radius:999px;margin-bottom:2rem}
  .badge::before{content:'';width:8px;height:8px;background:#34d399;border-radius:50%;
    animation:pulse 2s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .links{display:flex;flex-direction:column;gap:10px;margin-bottom:2rem}
  .links a{display:flex;align-items:center;justify-content:space-between;
    background:#0f172a;border:1px solid #334155;border-radius:10px;padding:14px 18px;
    color:#e2e8f0;text-decoration:none;font-size:.9rem;transition:border-color .15s}
  .links a:hover{border-color:#6366f1}
  .links a .desc{color:#94a3b8;font-size:.78rem}
  .links a .arrow{color:#6366f1;font-size:1.1rem}
  .version{color:#475569;font-size:.78rem;margin-bottom:1rem}
  .lang-toggle{display:flex;gap:8px;justify-content:center}
  .lang-toggle button{background:none;border:1px solid #334155;color:#94a3b8;
    padding:6px 14px;border-radius:8px;cursor:pointer;font-size:.8rem;transition:.15s}
  .lang-toggle button:hover,.lang-toggle button.active{border-color:#6366f1;color:#e2e8f0}
  [data-lang="zh"]{display:none}
  body.zh [data-lang="en"]{display:none}
  body.zh [data-lang="zh"]{display:flex}
  body.zh h1 .en,body.zh .subtitle .en,body.zh .badge .en,body.zh .version .en{display:none}
  body.zh h1 .zh,body.zh .subtitle .zh,body.zh .badge .zh,body.zh .version .zh{display:inline}
  body:not(.zh) h1 .zh,body:not(.zh) .subtitle .zh,
  body:not(.zh) .badge .zh,body:not(.zh) .version .zh{display:none}
</style>
</head>
<body>
<div class="card">
  <div class="logo">&#128027;&#9889;</div>
  <h1>
    <span class="en">BugSpark API</span>
    <span class="zh">BugSpark API</span>
  </h1>
  <p class="subtitle">
    <span class="en">Universal bug reporting backend</span>
    <span class="zh">&#36890;&#29992;&#38500;&#37679;&#22577;&#21578;&#24460;&#31471;&#26381;&#21209;</span>
  </p>
  <div class="badge">
    <span class="en">Healthy</span>
    <span class="zh">&#36939;&#20316;&#27491;&#24120;</span>
  </div>
  <div class="links" data-lang="en">
    <a href="/docs">
      <div><strong>Interactive Docs</strong><br><span class="desc">Swagger UI &mdash; try API endpoints live</span></div>
      <span class="arrow">&rarr;</span>
    </a>
    <a href="/redoc">
      <div><strong>API Reference</strong><br><span class="desc">ReDoc &mdash; full endpoint documentation</span></div>
      <span class="arrow">&rarr;</span>
    </a>
    <a href="/health">
      <div><strong>Health Check</strong><br><span class="desc">GET /health &mdash; service status</span></div>
      <span class="arrow">&rarr;</span>
    </a>
  </div>
  <div class="links" data-lang="zh">
    <a href="/docs">
      <div><strong>&#20114;&#21205;&#25991;&#27284;</strong><br><span class="desc">Swagger UI &mdash; &#21363;&#26178;&#28204;&#35430; API &#31471;&#40670;</span></div>
      <span class="arrow">&rarr;</span>
    </a>
    <a href="/redoc">
      <div><strong>API &#21443;&#32771;</strong><br><span class="desc">ReDoc &mdash; &#23436;&#25972;&#31471;&#40670;&#25991;&#27284;</span></div>
      <span class="arrow">&rarr;</span>
    </a>
    <a href="/health">
      <div><strong>&#20581;&#24247;&#27298;&#26597;</strong><br><span class="desc">GET /health &mdash; &#26381;&#21209;&#29376;&#24907;</span></div>
      <span class="arrow">&rarr;</span>
    </a>
  </div>
  <p class="version">
    <span class="en">v0.1.0</span>
    <span class="zh">v0.1.0</span>
  </p>
  <div class="lang-toggle">
    <button class="active" onclick="setLang('en')">English</button>
    <button onclick="setLang('zh')">&#24291;&#26481;&#35441;</button>
  </div>
</div>
<script>
function setLang(lang){
  document.body.className=lang==='zh'?'zh':'';
  document.querySelectorAll('.lang-toggle button').forEach(function(b,i){
    b.classList.toggle('active',i===(lang==='zh'?1:0));
  });
  try{localStorage.setItem('bugspark_lang',lang)}catch(e){}
}
try{if(localStorage.getItem('bugspark_lang')==='zh')setLang('zh')}catch(e){}
</script>
</body>
</html>
"""


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def landing_page() -> HTMLResponse:
    return HTMLResponse(content=_LANDING_HTML)
