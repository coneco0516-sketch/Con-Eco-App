# Version: RESTORE_STABLE_V1.1
import bcrypt
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type("About", (), {"__version__": bcrypt.__version__})

from pathlib import Path
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz

IST = pytz.timezone('Asia/Kolkata')


def run_invoice_generation():
    """Scheduled task: Generate weekly COD commission invoices (runs every Monday midnight IST)."""
    try:
        print("[SCHEDULER] Running weekly invoice generation...")
        from commission_invoicing import generate_weekly_invoices
        generate_weekly_invoices()
        print("[SCHEDULER] Invoice generation complete.")
    except Exception as e:
        print(f"[SCHEDULER ERROR] Invoice generation failed: {e}")


def run_penalty_enforcement():
    """Scheduled task: Enforce penalties for overdue invoices (runs every Thursday midnight IST)."""
    try:
        print("[SCHEDULER] Running commission penalty enforcement...")
        from commission_invoicing import enforce_penalties
        enforce_penalties()
        print("[SCHEDULER] Penalty enforcement complete.")
    except Exception as e:
        print(f"[SCHEDULER ERROR] Penalty enforcement failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start background scheduler on app startup, stop on shutdown."""
    scheduler = BackgroundScheduler(timezone=IST)

    # Every Monday at 00:01 IST -> generate invoices for the past week
    scheduler.add_job(
        run_invoice_generation,
        CronTrigger(day_of_week='mon', hour=0, minute=1, timezone=IST),
        id='weekly_invoice_generation',
        replace_existing=True
    )

    # Every Thursday at 00:01 IST -> enforce penalties (3 days after invoice)
    scheduler.add_job(
        run_penalty_enforcement,
        CronTrigger(day_of_week='thu', hour=0, minute=1, timezone=IST),
        id='penalty_enforcement',
        replace_existing=True
    )

    scheduler.start()
    print("[SCHEDULER] Started. Invoice generation: every Monday 00:01 IST. Penalty enforcement: every Thursday 00:01 IST.")

    try:
        from push_service import init_push_db
        init_push_db()
        print("[DATABASE] Push subscriptions table initialized.")
    except Exception as e:
        print(f"[DATABASE ERROR] Could not initialize push db: {e}")

    yield  # App runs here

    scheduler.shutdown()
    print("[SCHEDULER] Stopped.")


app = FastAPI(title="ConEco Backend API", lifespan=lifespan)

import os

# Production-Ready CORS configuration
# Fetch allowed domains directly from the environment (.env)
# e.g. ALLOWED_ORIGINS="https://coneco.com,https://www.coneco.com,http://localhost:5173"
allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "").replace('"', '').replace("'", "")
if not allowed_origins_env:
    allowed_origins_env = "http://localhost:5173,http://localhost:8000,http://127.0.0.1:5173,http://127.0.0.1:8000,https://con-eco-app-w78g.onrender.com,https://con-eco-frontend.onrender.com"

ALLOWED_ORIGINS = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # This header is REQUIRED for Google Identity Services popups to work
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    return response
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"REQUEST: {request.method} {request.url.path} from {request.headers.get('origin')}")
    response = await call_next(request)
    return response

@app.exception_handler(401)
async def not_authorized_handler(request: Request, exc):
    # Overrides 401 exceptions to return 200 JSON with status='not_logged_in' 
    # to perfectly match our existing frontend JS logic!
    return JSONResponse(status_code=200, content={"status": "not_logged_in", "detail": "Session expired or not logged in"})

from pydantic import BaseModel
from email_service import send_contact_form, send_contact_acknowledgment
from database import get_db_connection

class ContactForm(BaseModel):
    name: str
    email: str
    message: str

@app.post("/api/contact")
async def contact_us(form: ContactForm, background_tasks: BackgroundTasks = None):
    # 1. Store in database
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Ensure table exists on production
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS contactmessages (
                message_id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'Unread',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        cursor.execute(
            "INSERT INTO contactmessages (name, email, message, status) VALUES (%s, %s, %s, 'Unread')",
            (form.name, form.email, form.message)
        )
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error saving contact message to DB: {str(e)}")

    # 2. Send emails using background tasks (Non-blocking)
    if background_tasks:
        background_tasks.add_task(send_contact_form, form.name, form.email, form.message)
        background_tasks.add_task(send_contact_acknowledgment, form.name, form.email)
    else:
        # Fallback if no background_tasks (though FastAPI usually always provides them if requested)
        send_contact_form(form.name, form.email, form.message)
        send_contact_acknowledgment(form.name, form.email)

    return {"status": "success", "message": "Your message has been sent. You will receive a confirmation email shortly."}

from routers import auth, admin, customer, vendor, payment, invoice

# Mount routers here
app.include_router(auth.router,    prefix="/api/auth",    tags=["auth"])
app.include_router(admin.router,   prefix="/api/admin",   tags=["admin"])
app.include_router(customer.router,prefix="/api/customer",tags=["customer"])
app.include_router(vendor.router,  prefix="/api/vendor",  tags=["vendor"])
app.include_router(payment.router, prefix="/api/payment", tags=["payment"])
app.include_router(invoice.router, prefix="/api/invoice", tags=["invoice"])

@app.get("/db-check")
def db_check():
    """Verify database connectivity (Render/Neon diagnostic)."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        cursor.close()
        conn.close()
        return {
            "status": "success",
            "message": "Connected to PostgreSQL successfully!",
            "database": "Neon PostgreSQL",
            "version": version
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Connection failed: {str(e)}"
        }

@app.get("/api/health")
def api_health():
    try:
        from database import get_db_connection
        conn = get_db_connection()
        conn.close()
        return {"db": "connected"}
    except Exception as e:
        return {"db": "failed", "error": str(e)}

@app.get("/api/test-email")
def test_email_endpoint():
    """Diagnostic endpoint to force a test email via Gmail SMTP and check logs."""
    from email_service import send_email, GMAIL_SMTP_USER, FROM_EMAIL

    report = {
        "gmail_configured": bool(GMAIL_SMTP_USER),
        "from_email": FROM_EMAIL,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    try:
        success = send_email(
            "coneco0516@gmail.com",
            "ConEco Gmail SMTP Test",
            "<h1>Gmail SMTP is working!</h1><p>If you see this, check your Gmail inbox AND spam folder.</p>"
        )
        report["email_sent"] = success
        return report
    except Exception as e:
        report["error"] = str(e)
        return report

frontend_dir = Path(__file__).resolve().parent.parent / "Frontend" / "dist"

# Mount uploads folder (created in Backend)
upload_dir = Path(__file__).resolve().parent / "uploads"
upload_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

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
