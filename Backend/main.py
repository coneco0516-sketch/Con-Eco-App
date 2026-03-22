from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="ConEco Backend API")

import os

# Production-Ready CORS configuration
# Fetch allowed domains directly from the environment (.env)
# e.g. ALLOWED_ORIGINS="https://coneco.com,https://www.coneco.com,http://localhost:5173"
allowed_origins_env = os.environ.get(
    "ALLOWED_ORIGINS", 
    "http://localhost:5173,http://localhost:8000,http://127.0.0.1:5173,http://127.0.0.1:8000"
)
ALLOWED_ORIGINS = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_cors_debug_headers(request: Request, call_next):
    origin = request.headers.get("origin")
    print(f"DEBUG: Request from origin: {origin}")
    response = await call_next(request)
    # Force CORS headers on every response just in case the middleware skips some
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@app.exception_handler(401)
async def not_authorized_handler(request: Request, exc):
    # Overrides 401 exceptions to return 200 JSON with status='not_logged_in' 
    # to perfectly match our existing frontend JS logic!
    return JSONResponse(status_code=200, content={"status": "not_logged_in", "detail": str(exc.detail)})

from routers import auth, admin, customer, vendor, payment

# Mount routers here
app.include_router(auth.router,    prefix="/api/auth",    tags=["auth"])
app.include_router(admin.router,   prefix="/api/admin",   tags=["admin"])
app.include_router(customer.router,prefix="/api/customer",tags=["customer"])
app.include_router(vendor.router,  prefix="/api/vendor",  tags=["vendor"])
app.include_router(payment.router, prefix="/api/payment", tags=["payment"])

@app.get("/api/health")
def api_health():
    try:
        from database import get_db_connection
        conn = get_db_connection()
        conn.close()
        return {"db": "connected"}
    except Exception as e:
        return {"db": "failed", "error": str(e)}

frontend_dir = Path(__file__).resolve().parent.parent / "Frontend" / "dist"

# Mount specifically the assets folder from Vite's build
if (frontend_dir / "assets").exists():
    app.mount("/assets", StaticFiles(directory=frontend_dir / "assets"), name="assets")

# Wildcard Catch-All to serve static files from root OR bounce to index.html
@app.get("/{catchall:path}")
async def serve_react_app(catchall: str):
    # Check if the requested file exists in the root of dist folder
    # e.g. /project_overview.mp4
    if catchall:
        potential_file = frontend_dir / catchall
        if potential_file.is_file():
            return FileResponse(potential_file)
            
    index_file = frontend_dir / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return JSONResponse(status_code=404, content={"message": "Frontend build not found. Run 'npm run build' first."})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
