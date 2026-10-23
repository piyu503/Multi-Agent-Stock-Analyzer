"""FastAPI application for Indian Stock Research Platform backend."""

import os
from datetime import datetime, timezone
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from catalog_importer import import_catalog_file
from database import (
    get_catalog_coverage_summary,
    get_stock_by_symbol,
    get_total_listings_count,
    init_db,
    is_official_catalog_imported,
    search_stocks,
)
from agents.orchestrator import orchestrate_stock_research
from report_generator import generate_demo_report
from schemas import (
    HealthResponse,
    ImportSummary,
    ResearchReport,
    StockDetail,
    StocksSearchResponse,
)

from contextlib import asynccontextmanager

load_dotenv()


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


@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """Health check endpoint to verify backend operational readiness and catalog status."""
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    catalog_imported = is_official_catalog_imported()
    total_listings = get_total_listings_count()
    coverage_data = get_catalog_coverage_summary()

    return HealthResponse(
        status="ok",
        service="indian-stock-research-backend",
        version="0.2.0",
        database="sqlite-ready",
        catalog_imported=catalog_imported,
        total_listings=total_listings,
        timestamp=now_iso,
        catalog_coverage=coverage_data
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
    exchange: Optional[str] = Query(None, description="Optional exchange identifier (e.g., NSE or BSE)")
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
    return report


@app.get("/api/reports/stream/{symbol}", tags=["Reports"])
async def stream_report(
    symbol: str,
    exchange: Optional[str] = Query(None, description="Optional exchange identifier (e.g., NSE or BSE)")
):
    """Stream live 13-agent deliberation progress and ticks via Server-Sent Events (SSE)."""
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
        try:
            async for update in stream_stock_research(stock):
                event_name = update.get("event", "message")
                data_json = json.dumps(update.get("data", {}))
                yield f"event: {event_name}\ndata: {data_json}\n\n"
        except Exception as e:
            error_data = json.dumps({"error": str(e)})
            yield f"event: error\ndata: {error_data}\n\n"

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
