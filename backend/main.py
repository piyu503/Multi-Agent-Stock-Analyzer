"""FastAPI application for Indian Stock Research Platform backend."""

import logging
import os
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Header, Depends
from fastapi.middleware.cors import CORSMiddleware

# Initialize institutional-grade root logging for all agents & data providers
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("bharatequity.api")

from catalog_importer import import_catalog_file
from database import (
    create_access_token,
    create_or_get_google_user,
    create_user,
    delete_user_report,
    get_catalog_coverage_summary,
    get_stock_by_symbol,
    get_total_listings_count,
    get_user_by_email,
    get_user_by_id,
    get_user_report_detail,
    get_user_reports_list,
    init_db,
    is_official_catalog_imported,
    save_user_report,
    search_stocks,
    verify_access_token,
    verify_password,
)
from agents.orchestrator import orchestrate_stock_research
from report_generator import generate_demo_report
from schemas import (
    AuthTokenResponse,
    GoogleAuthRequest,
    HealthResponse,
    ImportSummary,
    ResearchReport,
    SavedReportSummary,
    SaveReportRequest,
    StockDetail,
    StocksSearchResponse,
    UserLoginRequest,
    UserProfileResponse,
    UserRegisterRequest,
)

from contextlib import asynccontextmanager

dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path, override=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure database tables are created, migrated, and seeded if empty on startup."""
    init_db()
    yield


app = FastAPI(
    title="Indian Stock Research Platform API",
    description="Backend API supporting Indian stock search, company profiles, and multi-agent report generation across NSE and BSE.",
    version="0.2.0",
    lifespan=lifespan
)

# CORS configuration
raw_cors = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
cors_origins = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# SECURITY & AUTHENTICATION DEPENDENCIES
# ============================================================================

def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """Safely verify bearer token and retrieve user without blocking anonymous requests."""
    if not authorization:
        return None
    token = authorization.strip()
    if token.lower().startswith("bearer "):
        token = token[7:].strip()
    payload = verify_access_token(token)
    if not payload or "uid" not in payload:
        return None
    return get_user_by_id(payload["uid"])


def get_current_user_from_token_or_param(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None, description="Optional bearer token for EventSource SSE")
) -> Optional[dict]:
    """Extract and verify token from Authorization header or ?token query param."""
    raw_token = None
    if authorization:
        t = authorization.strip()
        raw_token = t[7:].strip() if t.lower().startswith("bearer ") else t
    elif token:
        raw_token = token.strip()

    if not raw_token:
        return None

    payload = verify_access_token(raw_token)
    if not payload or "uid" not in payload:
        return None
    return get_user_by_id(payload["uid"])


def get_current_user_required(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None)
) -> dict:
    """Enforce token authentication for protected account, report generation, and history routes."""
    user = get_current_user_from_token_or_param(authorization, token)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please sign in to generate or view research reports.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user


# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.post("/api/auth/register", response_model=AuthTokenResponse, tags=["Auth"])
def register_user(req: UserRegisterRequest):
    """Register a new user account with secure password hashing."""
    email_clean = req.email.strip().lower()
    if "@" not in email_clean or "." not in email_clean.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    existing = get_user_by_email(email_clean)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    new_user = create_user(
        email=email_clean,
        password=req.password,
        name=req.name.strip(),
        auth_provider="local"
    )

    token = create_access_token(user_id=new_user["id"], email=new_user["email"], name=new_user["name"])
    return AuthTokenResponse(
        token=token,
        user=UserProfileResponse(
            id=new_user["id"],
            email=new_user["email"],
            name=new_user["name"],
            picture=new_user.get("picture"),
            auth_provider=new_user["auth_provider"]
        )
    )


@app.post("/api/auth/login", response_model=AuthTokenResponse, tags=["Auth"])
def login_user(req: UserLoginRequest):
    """Authenticate user with email and password."""
    email_clean = req.email.strip().lower()
    user = get_user_by_email(email_clean)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user.get("password_hash"):
        raise HTTPException(
            status_code=400,
            detail="This account was created with Google. Please use 'Continue with Google'."
        )

    if not verify_password(user["password_hash"], req.password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token(user_id=user["id"], email=user["email"], name=user["name"])
    return AuthTokenResponse(
        token=token,
        user=UserProfileResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            picture=user.get("picture"),
            auth_provider=user["auth_provider"]
        )
    )


@app.post("/api/auth/google", response_model=AuthTokenResponse, tags=["Auth"])
def google_auth(req: GoogleAuthRequest):
    """Authenticate or register user via Google direct sign-in."""
    email_clean = req.email.strip().lower()
    if "@" not in email_clean:
        raise HTTPException(status_code=400, detail="Invalid Google account email.")

    # Securely retrieve or register user
    user = create_or_get_google_user(
        email=email_clean,
        name=req.name.strip() if req.name else email_clean.split("@")[0],
        picture=req.picture
    )

    token = create_access_token(user_id=user["id"], email=user["email"], name=user["name"])
    return AuthTokenResponse(
        token=token,
        user=UserProfileResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            picture=user.get("picture"),
            auth_provider=user["auth_provider"]
        )
    )


@app.get("/api/auth/me", response_model=UserProfileResponse, tags=["Auth"])
def get_my_profile(current_user: dict = Depends(get_current_user_required)):
    """Retrieve current authenticated user profile."""
    return UserProfileResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        picture=current_user.get("picture"),
        auth_provider=current_user.get("auth_provider", "local")
    )


# ============================================================================
# USER RESEARCH REPORT HISTORY ENDPOINTS
# ============================================================================

@app.post("/api/reports/save", tags=["Reports"])
def save_report_for_user(
    req: SaveReportRequest,
    current_user: dict = Depends(get_current_user_required)
):
    """Save a completed stock report to user's personal research archive."""
    report_id = save_user_report(
        user_id=current_user["id"],
        symbol=req.symbol,
        exchange=req.exchange,
        company_name=req.company_name,
        verdict=req.verdict,
        conviction=req.conviction,
        target_price=req.target_price,
        report_data=req.report_data
    )
    return {"status": "saved", "id": report_id, "message": "Report successfully archived to your account."}


@app.get("/api/reports/history", response_model=List[SavedReportSummary], tags=["Reports"])
def list_user_report_history(
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user_required)
):
    """Retrieve metadata summaries of all past reports generated by the authenticated user."""
    reports = get_user_reports_list(user_id=current_user["id"], limit=limit)
    return [
        SavedReportSummary(
            id=r["id"],
            user_id=r["user_id"],
            symbol=r["symbol"],
            exchange=r["exchange"],
            company_name=r["company_name"],
            verdict=r["verdict"],
            conviction=r.get("conviction"),
            target_price=r.get("target_price"),
            created_at=str(r["created_at"])
        )
        for r in reports
    ]


@app.get("/api/reports/history/{report_id}", tags=["Reports"])
def get_user_saved_report(
    report_id: int,
    current_user: dict = Depends(get_current_user_required)
):
    """Retrieve full data of a past report by ID with ownership verification (prevents IDOR)."""
    detail = get_user_report_detail(user_id=current_user["id"], report_id=report_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Saved report not found or unauthorized.")
    return detail


@app.delete("/api/reports/history/{report_id}", tags=["Reports"])
def delete_user_saved_report(
    report_id: int,
    current_user: dict = Depends(get_current_user_required)
):
    """Delete a saved report from user history with ownership verification."""
    success = delete_user_report(user_id=current_user["id"], report_id=report_id)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found or unauthorized.")
    return {"status": "deleted", "id": report_id}


@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """Health check endpoint to verify backend operational readiness and catalog status."""
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    catalog_imported = is_official_catalog_imported()
    total_listings = get_total_listings_count()
    coverage_data = get_catalog_coverage_summary()
    # Dhan Pro is only active if client ID and access token exist, are non-empty, and valid
    client_id = (os.environ.get("DHAN_CLIENT_ID") or "").strip()
    access_token = (os.environ.get("DHAN_ACCESS_TOKEN") or "").strip()
    dhan_active = bool(
        client_id
        and access_token
        and not access_token.startswith("EXPIRED")
    )

    return HealthResponse(
        status="ok",
        service="indian-stock-research-backend",
        version="0.2.0",
        database="sqlite-ready",
        catalog_imported=catalog_imported,
        total_listings=total_listings,
        timestamp=now_iso,
        catalog_coverage=coverage_data,
        dhan_pro_active=dhan_active
    )


@app.get("/api/stocks", response_model=StocksSearchResponse, tags=["Stocks"])
def get_stocks(
    q: Optional[str] = Query(None, description="Search query matching ticker, company name, ISIN, or sector"),
    exchange: Optional[str] = Query(None, description="Optional exchange filter: NSE or BSE"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Max results per page")
):
    """Search Indian stocks (NSE/BSE) by company name, ticker symbol, or ISIN with pagination and exchange filter."""
    query_str = q.strip() if q else ""
    exchange_filter = exchange.strip().upper() if exchange and exchange.strip() else None

    # Validate exchange filter if provided
    if exchange_filter and exchange_filter not in ("NSE", "BSE"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid exchange '{exchange}'. Supported exchanges are 'NSE' and 'BSE'."
        )

    items, total, total_pages, catalog_imported, message = search_stocks(
        query=query_str,
        exchange=exchange_filter,
        page=page,
        limit=limit
    )

    return StocksSearchResponse(
        query=query_str,
        exchange=exchange_filter,
        total=total,
        page=page,
        page_size=limit,
        total_pages=total_pages,
        catalog_imported=catalog_imported,
        message=message,
        items=items
    )


@app.get("/api/stocks/{symbol}", response_model=StockDetail, tags=["Stocks"])
def get_stock_detail(
    symbol: str,
    exchange: Optional[str] = Query(None, description="Optional exchange identifier (e.g., NSE or BSE)")
):
    """Retrieve full company profile for an Indian stock ticker, distinguishing exchange-specific listings."""
    stock = get_stock_by_symbol(symbol, exchange=exchange)
    if not stock:
        exch_desc = f" on exchange '{exchange.upper()}'" if exchange else ""
        raise HTTPException(
            status_code=404,
            detail=f"Stock symbol '{symbol.upper()}'{exch_desc} was not found in the catalog."
        )
    return stock


@app.post("/api/reports/{symbol}", response_model=ResearchReport, tags=["Reports"])
async def create_report(
    symbol: str,
    exchange: Optional[str] = Query(None, description="Optional exchange identifier (e.g., NSE or BSE)"),
    current_user: dict = Depends(get_current_user_required)
):
    """Generate a research report for an Indian stock ticker via the 13-agent deliberation loop."""
    stock = get_stock_by_symbol(symbol, exchange=exchange)
    if not stock:
        exch_desc = f" on {exchange.upper()}" if exchange else ""
        raise HTTPException(
            status_code=404,
            detail=f"Cannot generate report: Stock symbol '{symbol.upper()}'{exch_desc} is not in the catalog."
        )

    report, agent_runs = await orchestrate_stock_research(stock)
    report.agent_runs = [r.model_dump() for r in agent_runs]

    # Note: Reports are saved explicitly by the client via /api/reports/save when completed.
    # We avoid duplicate automatic backend saves here.
    return report


@app.get("/api/reports/stream/{symbol}", tags=["Reports"])
async def stream_report(
    symbol: str,
    exchange: Optional[str] = Query(None, description="Optional exchange identifier (e.g., NSE or BSE)"),
    current_user: dict = Depends(get_current_user_required)
):
    """Stream live 13-agent deliberation progress and ticks via Server-Sent Events (SSE). Requires active authentication."""
    import json
    from fastapi.responses import StreamingResponse
    from agents.orchestrator import stream_stock_research

    stock = get_stock_by_symbol(symbol, exchange=exchange)
    if not stock:
        exch_desc = f" on {exchange.upper()}" if exchange else ""
        raise HTTPException(
            status_code=404,
            detail=f"Cannot generate report: Stock symbol '{symbol.upper()}'{exch_desc} is not in the catalog."
        )

    async def event_generator():
        import asyncio

        queue = asyncio.Queue()
        is_done = False

        async def worker():
            nonlocal is_done
            try:
                async for update in stream_stock_research(stock):
                    await queue.put(update)
            except Exception as e:
                import traceback
                error_trace = traceback.format_exc()
                logger.error(f"[SSE STREAM FATAL ERROR] {e}\n{error_trace}")
                await queue.put({"event": "error", "data": {"error": str(e), "traceback": error_trace}})
            finally:
                is_done = True
                await queue.put(None)

        task = asyncio.create_task(worker())

        try:
            while not is_done or not queue.empty():
                try:
                    update = await asyncio.wait_for(queue.get(), timeout=1.0)
                    if update is None:
                        break
                    event_name = update.get("event", "message")
                    data_json = json.dumps(update.get("data", {}))
                    yield f"event: {event_name}\ndata: {data_json}\n\n"
                except asyncio.TimeoutError:
                    # Critical SSE keep-alive: keeps browser and proxy connections alive during long LLM calls
                    yield ": ping\n\n"
        finally:
            if not task.done():
                task.cancel()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )



@app.post("/api/catalog/import", response_model=ImportSummary, tags=["Catalog"])
async def upload_catalog_file(
    exchange: str = Query(..., pattern="^(NSE|BSE|nse|bse)$", description="Exchange: NSE or BSE"),
    file: UploadFile = File(...)
):
    """Import an official exchange securities CSV or XLSX file."""
    exchange_upper = exchange.strip().upper()
    temp_dir = os.path.join(os.path.dirname(__file__), "temp_imports")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file.filename)

    try:
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        summary = import_catalog_file(
            file_path=temp_path,
            exchange=exchange_upper,
            default_series="EQ" if exchange_upper == "NSE" else "A"
        )
        return summary
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
