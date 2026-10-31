"""SQLite Database initialization, migrations, and query interfaces for Indian Stocks (NSE/BSE)."""

import base64
import hashlib
import hmac
import json
import math
import os
import secrets
import sqlite3
import time
from typing import Any, Dict, List, Optional, Tuple

DB_FILE = os.environ.get("DB_FILE", os.path.join(os.path.dirname(__file__), "stocks.db"))
AUTH_SECRET_KEY = os.environ.get("AUTH_SECRET_KEY", "equiagentic-in-house-secret-key-2026")


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn


def init_db() -> None:
    """Creates schema, ensures required columns exist, and seeds initial representative stocks."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Schema structured for scale: supports indexing on symbol, company name, exchange, isin
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS stocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        company_name TEXT NOT NULL,
        exchange TEXT NOT NULL DEFAULT 'NSE',
        scrip_code TEXT,
        sector TEXT,
        industry TEXT,
        isin TEXT,
        series TEXT DEFAULT 'EQ',
        market_cap_category TEXT,
        currency TEXT DEFAULT 'INR',
        description TEXT,
        headquarters TEXT,
        listing_date TEXT,
        is_active INTEGER DEFAULT 1,
        is_prototype_data INTEGER DEFAULT 1,
        data_source TEXT DEFAULT 'Prototype Seed Catalog (Mock)',
        imported_at TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(symbol, exchange)
    )
    """)

    # Check and add columns safely if table already existed without new Phase 2 columns
    cursor.execute("PRAGMA table_info(stocks)")
    existing_cols = {row["name"] for row in cursor.fetchall()}
    if "scrip_code" not in existing_cols:
        cursor.execute("ALTER TABLE stocks ADD COLUMN scrip_code TEXT")
    if "is_active" not in existing_cols:
        cursor.execute("ALTER TABLE stocks ADD COLUMN is_active INTEGER DEFAULT 1")
    if "data_source" not in existing_cols:
        cursor.execute("ALTER TABLE stocks ADD COLUMN data_source TEXT DEFAULT 'Prototype Seed Catalog (Mock)'")
    if "imported_at" not in existing_cols:
        cursor.execute("ALTER TABLE stocks ADD COLUMN imported_at TEXT")

    # Table for tracking imports
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS import_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exchange TEXT NOT NULL,
        source_file TEXT NOT NULL,
        records_added INTEGER DEFAULT 0,
        records_updated INTEGER DEFAULT 0,
        records_skipped INTEGER DEFAULT 0,
        duplicates_detected INTEGER DEFAULT 0,
        invalid_rows INTEGER DEFAULT 0,
        total_processed INTEGER DEFAULT 0,
        timestamp TEXT NOT NULL,
        status TEXT DEFAULT 'success',
        notes TEXT
    )
    """)

    # Users table for local & Google Auth
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        name TEXT NOT NULL,
        picture TEXT,
        auth_provider TEXT DEFAULT 'local',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")

    # User Watchlist / Favourites table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_watchlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        exchange TEXT NOT NULL DEFAULT 'NSE',
        company_name TEXT NOT NULL,
        sector TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, symbol, exchange),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    ''')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_watchlist_user ON user_watchlists(user_id)')

    # User Reports table for persisted research history
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        exchange TEXT NOT NULL DEFAULT 'NSE',
        company_name TEXT NOT NULL,
        verdict TEXT NOT NULL,
        conviction TEXT,
        target_price TEXT,
        report_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_reports_user_id ON user_reports(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_reports_symbol ON user_reports(symbol)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_reports_created_at ON user_reports(created_at DESC)")

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_stocks_company ON stocks(company_name)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_stocks_sector ON stocks(sector)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_stocks_isin ON stocks(isin)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_stocks_exchange ON stocks(exchange)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_stocks_scrip ON stocks(scrip_code)")

    # Check if any stocks exist
    cursor.execute("SELECT COUNT(*) FROM stocks")
    count = cursor.fetchone()[0]

    if count == 0:
        seed_data = [
            (
                "RELIANCE",
                "Reliance Industries Limited",
                "NSE",
                "Energy & Petrochemicals",
                "Oil & Gas Refining & Marketing / Telecom / Retail",
                "INE002A01018",
                "EQ",
                "Large Cap",
                "INR",
                "India's largest private sector enterprise with diversified interests in energy, petrochemicals, telecommunications (Jio), and organized retail.",
                "Mumbai, Maharashtra",
                "1977-11-29",
                1,
                1,
                "Prototype Seed Catalog (Mock)"
            ),
            (
                "TCS",
                "Tata Consultancy Services Limited",
                "NSE",
                "Information Technology",
                "IT Services & Consulting",
                "INE467B01029",
                "EQ",
                "Large Cap",
                "INR",
                "Global leader in IT services, digital transformation, and business consulting solutions, part of the prestigious Tata Group.",
                "Mumbai, Maharashtra",
                "2004-08-25",
                1,
                1,
                "Prototype Seed Catalog (Mock)"
            ),
            (
                "HDFCBANK",
                "HDFC Bank Limited",
                "NSE",
                "Financial Services",
                "Private Sector Bank",
                "INE040A01034",
                "EQ",
                "Large Cap",
                "INR",
                "Leading private sector bank in India providing comprehensive retail, commercial banking, and treasury services.",
                "Mumbai, Maharashtra",
                "1995-05-19",
                1,
                1,
                "Prototype Seed Catalog (Mock)"
            ),
            (
                "INFY",
                "Infosys Limited",
                "NSE",
                "Information Technology",
                "IT Consulting & Software",
                "INE009A01021",
                "EQ",
                "Large Cap",
                "INR",
                "Global enterprise consulting and digital services pioneer enabling clients in over 50 countries to navigate digital modernization.",
                "Bengaluru, Karnataka",
                "1993-06-14",
                1,
                1,
                "Prototype Seed Catalog (Mock)"
            ),
            (
                "ICICIBANK",
                "ICICI Bank Limited",
                "NSE",
                "Financial Services",
                "Private Sector Bank",
                "INE090A01021",
                "EQ",
                "Large Cap",
                "INR",
                "Large Indian multinational banking and financial services company with a deep digital retail footprint.",
                "Mumbai, Maharashtra",
                "1997-09-17",
                1,
                1,
                "Prototype Seed Catalog (Mock)"
            ),
            (
                "ITC",
                "ITC Limited",
                "NSE",
                "Fast Moving Consumer Goods (FMCG)",
                "Diversified Conglomerate / FMCG / Hotels / Paperboards",
                "INE154A01025",
                "EQ",
                "Large Cap",
                "INR",
                "Prominent Indian multi-business conglomerate with presence across FMCG, Hotels, Paperboards & Packaging, Agri Business, and IT.",
                "Kolkata, West Bengal",
                "1954-10-27",
                1,
                1,
                "Prototype Seed Catalog (Mock)"
            ),
            (
                "LT",
                "Larsen & Toubro Limited",
                "NSE",
                "Industrials & Infrastructure",
                "Engineering, Procurement & Construction (EPC)",
                "INE018A01030",
                "EQ",
                "Large Cap",
                "INR",
                "Major technology, engineering, construction, manufacturing, and financial services conglomerate executing mega projects globally.",
                "Mumbai, Maharashtra",
                "1950-12-01",
                1,
                1,
                "Prototype Seed Catalog (Mock)"
            ),
            (
                "BHARTIARTL",
                "Bharti Airtel Limited",
                "NSE",
                "Telecommunication",
                "Wireless & Broadband Telecom",
                "INE397D01024",
                "EQ",
                "Large Cap",
                "INR",
                "Leading global telecommunications company with operations in 18 countries across South Asia and Africa.",
                "New Delhi, Delhi",
                "2002-02-15",
                1,
                1,
                "Prototype Seed Catalog (Mock)"
            ),
            (
                "TATAMOTORS",
                "Tata Motors Limited",
                "NSE",
                "Automobile",
                "Commercial & Passenger Vehicles / EV",
                "INE155A01022",
                "EQ",
                "Large Cap",
                "INR",
                "Leading global automobile manufacturer of cars, utility vehicles, pick-ups, trucks, and buses, and parent company of Jaguar Land Rover.",
                "Mumbai, Maharashtra",
                "1955-01-01",
                1,
                1,
                "Prototype Seed Catalog (Mock)"
            ),
            (
                "SUNPHARMA",
                "Sun Pharmaceutical Industries Limited",
                "NSE",
                "Healthcare & Pharmaceuticals",
                "Specialty & Generic Pharmaceuticals",
                "INE044A01036",
                "EQ",
                "Large Cap",
                "INR",
                "India's largest pharmaceutical company and a key global specialty generics player.",
                "Mumbai, Maharashtra",
                "1994-12-26",
                1,
                1,
                "Prototype Seed Catalog (Mock)"
            ),
            (
                "TCS",
                "Tata Consultancy Services Limited",
                "BSE",
                "Information Technology",
                "IT Services & Consulting",
                "INE467B01029",
                "A",
                "Large Cap",
                "INR",
                "BSE-listed equity security for Tata Consultancy Services Ltd.",
                "Mumbai, Maharashtra",
                "2004-08-25",
                1,
                1,
                "Prototype Seed Catalog (Mock)"
            ),
            (
                "ZOMATO",
                "Zomato Limited",
                "NSE",
                "Consumer Services",
                "Food Delivery & Quick Commerce (Blinkit)",
                "INE758T01015",
                "EQ",
                "Large Cap",
                "INR",
                "Online food delivery and quick-commerce platform connecting consumers, restaurant partners, and delivery networks across India.",
                "Gurugram, Haryana",
                "2021-07-23",
                1,
                1,
                "Prototype Seed Catalog (Mock)"
            )
        ]

        cursor.executemany("""
        INSERT INTO stocks (
            symbol, company_name, exchange, sector, industry, isin,
            series, market_cap_category, currency, description, headquarters, listing_date,
            is_active, is_prototype_data, data_source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, seed_data)

    conn.commit()
    conn.close()


def is_official_catalog_imported() -> bool:
    """Returns True if any records with is_prototype_data == 0 or import_logs exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM stocks WHERE is_prototype_data = 0")
    imported_count = cursor.fetchone()[0]
    conn.close()
    return imported_count > 0


def get_total_listings_count() -> int:
    """Return total count of all stocks currently in the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM stocks WHERE is_active = 1")
    count = cursor.fetchone()[0]
    conn.close()
    return count


def get_catalog_coverage_summary() -> Dict[str, Any]:
    """Calculate field coverage counts across the catalog for transparent audit."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN scrip_code IS NOT NULL AND scrip_code != '' THEN 1 END) as with_scrip,
        COUNT(CASE WHEN sector IS NOT NULL AND sector != '' THEN 1 END) as with_sector,
        COUNT(CASE WHEN listing_date IS NOT NULL AND listing_date != '' THEN 1 END) as with_listing_date
    FROM stocks
    """)
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"total": 0, "with_scrip_code": 0, "with_sector": 0, "with_listing_date": 0}
    return {
        "total": row["total"],
        "with_scrip_code": row["with_scrip"],
        "with_sector": row["with_sector"],
        "with_listing_date": row["with_listing_date"]
    }


def search_stocks(
    query: str = "",
    exchange: Optional[str] = None,
    page: int = 1,
    limit: int = 20
) -> Tuple[List[Dict[str, Any]], int, int, bool, str]:
    """Case-insensitive search matching symbol, company name, or ISIN with pagination and exchange filtering."""
    conn = get_db_connection()
    cursor = conn.cursor()

    catalog_imported = is_official_catalog_imported()
    cleaned_q = query.strip()
    param = f"%{cleaned_q}%"

    where_clauses = [
        "is_active = 1",
        "isin NOT LIKE 'INF%'",
        "UPPER(company_name) NOT LIKE '%MUTUAL FUND%'"
    ]
    params: List[Any] = []

    # Exchange filter
    if exchange and exchange.strip():
        where_clauses.append("UPPER(exchange) = UPPER(?)")
        params.append(exchange.strip())

    # Search filter on symbol, company_name, isin
    if cleaned_q:
        where_clauses.append("(symbol LIKE ? OR company_name LIKE ? OR isin LIKE ? OR sector LIKE ?)")
        params.extend([param, param, param, param])

    where_sql = " AND ".join(where_clauses)

    # Count total matching
    count_sql = f"SELECT COUNT(*) FROM stocks WHERE {where_sql}"
    cursor.execute(count_sql, params)
    total_matches = cursor.fetchone()[0]

    # Calculate pagination
    total_pages = max(1, math.ceil(total_matches / limit)) if total_matches > 0 else 1
    safe_page = max(1, min(page, total_pages))
    offset = (safe_page - 1) * limit

    # Query items with relevance sorting: exact symbol match first, then prefix symbol, then company name
    order_clause = ""
    order_params = []
    if cleaned_q:
        order_clause = """
        ORDER BY 
            CASE 
                WHEN UPPER(symbol) = UPPER(?) THEN 1
                WHEN UPPER(symbol) LIKE UPPER(?) || '%' THEN 2
                WHEN UPPER(company_name) LIKE UPPER(?) || '%' THEN 3
                WHEN UPPER(isin) = UPPER(?) THEN 4
                ELSE 5
            END,
            CASE WHEN isin LIKE 'INE%' THEN 1 ELSE 2 END,
            CASE WHEN exchange = 'NSE' THEN 1 ELSE 2 END,
            symbol ASC
        """
        order_params = [cleaned_q, cleaned_q, cleaned_q, cleaned_q]
    else:
        order_clause = """
        ORDER BY 
            CASE WHEN isin LIKE 'INE%' THEN 1 ELSE 2 END,
            CASE WHEN exchange = 'NSE' THEN 1 ELSE 2 END,
            symbol ASC
        """

    query_sql = f"""
    SELECT id, symbol, company_name, exchange, sector, industry, isin, series, is_active, is_prototype_data
    FROM stocks
    WHERE {where_sql}
    {order_clause}
    LIMIT ? OFFSET ?
    """
    exec_params = params + order_params + [limit, offset]
    cursor.execute(query_sql, exec_params)
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "symbol": r["symbol"],
            "company_name": r["company_name"],
            "exchange": r["exchange"],
            "sector": r["sector"],
            "industry": r["industry"],
            "isin": r["isin"],
            "series": r["series"],
            "is_active": bool(r["is_active"]),
            "is_prototype_data": bool(r["is_prototype_data"])
        })

    # Generate status message regarding catalog
    if not catalog_imported:
        message = (
            "Showing seed prototype catalog. Official exchange securities files have not been imported yet. "
            "Use the catalog importer to load full NSE & BSE active listings."
        )
    else:
        message = f"Catalog active ({total_matches} listings found)."

    return results, total_matches, total_pages, catalog_imported, message


def get_stock_by_symbol(symbol: str, exchange: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Retrieve detailed profile for a specific stock ticker and exchange, with dual-listed scrip_code resolution."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cleaned_symbol = symbol.strip()
    if exchange and exchange.strip():
        cursor.execute("""
        SELECT id, symbol, company_name, exchange, scrip_code, sector, industry, isin, series,
               market_cap_category, currency, description, headquarters, listing_date,
               is_active, is_prototype_data, data_source, imported_at
        FROM stocks
        WHERE (UPPER(symbol) = UPPER(?) OR scrip_code = ?) AND UPPER(exchange) = UPPER(?)
        LIMIT 1
        """, (cleaned_symbol, cleaned_symbol, exchange.strip()))
    else:
        # If exchange is unspecified, prioritize NSE then BSE
        cursor.execute("""
        SELECT id, symbol, company_name, exchange, scrip_code, sector, industry, isin, series,
               market_cap_category, currency, description, headquarters, listing_date,
               is_active, is_prototype_data, data_source, imported_at
        FROM stocks
        WHERE UPPER(symbol) = UPPER(?) OR scrip_code = ?
        ORDER BY CASE WHEN exchange = 'NSE' THEN 1 ELSE 2 END
        LIMIT 1
        """, (cleaned_symbol, cleaned_symbol))

    row = cursor.fetchone()

    if not row and exchange:
        # Cross-exchange fallback: check other exchange if not found on requested exchange
        cursor.execute("""
        SELECT id, symbol, company_name, exchange, scrip_code, sector, industry, isin, series,
               market_cap_category, currency, description, headquarters, listing_date,
               is_active, is_prototype_data, data_source, imported_at
        FROM stocks
        WHERE UPPER(symbol) = UPPER(?) OR scrip_code = ?
        ORDER BY CASE WHEN exchange = 'NSE' THEN 1 ELSE 2 END
        LIMIT 1
        """, (cleaned_symbol, cleaned_symbol))
        row = cursor.fetchone()

    # Corporate demerger / alias resolution for Tata Motors
    if not row and cleaned_symbol.upper() in ("TATAMOTORS", "TATAMTRDVR", "TMCV", "TMPV"):
        cursor.execute("""
        SELECT id, symbol, company_name, exchange, scrip_code, sector, industry, isin, series,
               market_cap_category, currency, description, headquarters, listing_date,
               is_active, is_prototype_data, data_source, imported_at
        FROM stocks
        WHERE UPPER(symbol) IN ('TATAMOTORS', 'TMCV', 'TMPV')
        ORDER BY CASE WHEN UPPER(symbol) = 'TATAMOTORS' THEN 1 WHEN UPPER(symbol) = 'TMCV' THEN 2 ELSE 3 END,
                 CASE WHEN exchange = 'NSE' THEN 1 ELSE 2 END
        LIMIT 1
        """)
        row = cursor.fetchone()

    if not row:
        conn.close()
        return None

    stock_isin = row["isin"]
    resolved_scrip_code = row["scrip_code"]

    # If scrip_code is missing (e.g. looking at an NSE listing), check if a dual-listed BSE listing shares the same ISIN
    if not resolved_scrip_code and stock_isin:
        cursor.execute("""
        SELECT scrip_code, symbol FROM stocks 
        WHERE isin = ? AND exchange = 'BSE' AND (scrip_code IS NOT NULL AND scrip_code != '')
        LIMIT 1
        """, (stock_isin,))
        bse_match = cursor.fetchone()
        if bse_match and bse_match["scrip_code"]:
            resolved_scrip_code = bse_match["scrip_code"]
        elif bse_match and bse_match["symbol"] and bse_match["symbol"].isdigit():
            resolved_scrip_code = bse_match["symbol"]

    # Also, if this is BSE and symbol itself is a 6-digit code, ensure scrip_code is set
    if not resolved_scrip_code and row["exchange"] == "BSE" and row["symbol"].isdigit():
        resolved_scrip_code = row["symbol"]

    conn.close()

    return {
        "id": row["id"],
        "symbol": row["symbol"],
        "company_name": row["company_name"],
        "exchange": row["exchange"],
        "scrip_code": resolved_scrip_code,
        "sector": row["sector"],
        "industry": row["industry"],
        "isin": row["isin"],
        "series": row["series"],
        "market_cap_category": row["market_cap_category"],
        "currency": row["currency"],
        "description": row["description"],
        "headquarters": row["headquarters"],
        "listing_date": row["listing_date"],
        "is_active": bool(row["is_active"]),
        "is_prototype_data": bool(row["is_prototype_data"]),
        "data_source": row["data_source"] or "Official Exchange Securities Master",
        "imported_at": row["imported_at"]
    }


def upsert_stock_listing(
    symbol: str,
    company_name: str,
    exchange: str,
    isin: Optional[str] = None,
    series: Optional[str] = "EQ",
    scrip_code: Optional[str] = None,
    sector: Optional[str] = None,
    industry: Optional[str] = None,
    listing_date: Optional[str] = None,
    is_active: bool = True,
    is_prototype_data: bool = False,
    data_source: str = "Official Exchange Securities File",
    imported_at: Optional[str] = None
) -> Tuple[bool, bool]:
    """Upsert a stock listing identified by (symbol, exchange).
    Returns (is_added, is_updated).
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id, company_name, isin, series, scrip_code, sector, industry, listing_date, is_active, is_prototype_data, data_source
    FROM stocks
    WHERE UPPER(symbol) = UPPER(?) AND UPPER(exchange) = UPPER(?)
    """, (symbol.strip(), exchange.strip().upper()))

    existing = cursor.fetchone()

    # Normalize scrip_code: if this is BSE and symbol itself is numeric, default scrip_code
    clean_scrip = scrip_code.strip() if scrip_code else None
    if not clean_scrip and exchange.strip().upper() == "BSE" and symbol.strip().isdigit():
        clean_scrip = symbol.strip()

    if existing is None:
        # Insert new record
        cursor.execute("""
        INSERT INTO stocks (
            symbol, company_name, exchange, isin, series, scrip_code, sector, industry,
            listing_date, is_active, is_prototype_data, data_source, imported_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            symbol.strip().upper(),
            company_name.strip(),
            exchange.strip().upper(),
            isin.strip().upper() if isin else None,
            series.strip() if series else "EQ",
            clean_scrip,
            sector.strip() if sector else None,
            industry.strip() if industry else None,
            listing_date.strip() if listing_date else None,
            1 if is_active else 0,
            1 if is_prototype_data else 0,
            data_source,
            imported_at
        ))
        conn.commit()
        conn.close()
        return True, False
    else:
        # Check if update is needed (or if upgrading prototype seed to official)
        rec_id = existing["id"]
        cursor.execute("""
        UPDATE stocks SET
            company_name = ?,
            isin = COALESCE(?, isin),
            series = COALESCE(?, series),
            scrip_code = COALESCE(?, scrip_code),
            sector = COALESCE(?, sector),
            industry = COALESCE(?, industry),
            listing_date = COALESCE(?, listing_date),
            is_active = ?,
            is_prototype_data = ?,
            data_source = ?,
            imported_at = ?
        WHERE id = ?
        """, (
            company_name.strip(),
            isin.strip().upper() if isin else None,
            series.strip() if series else None,
            clean_scrip,
            sector.strip() if sector else None,
            industry.strip() if industry else None,
            listing_date.strip() if listing_date else None,
            1 if is_active else 0,
            1 if is_prototype_data else 0,
            data_source,
            imported_at,
            rec_id
        ))
        conn.commit()
        conn.close()
        return False, True


def log_import(
    exchange: str,
    source_file: str,
    records_added: int,
    records_updated: int,
    records_skipped: int,
    duplicates_detected: int,
    invalid_rows: int,
    total_processed: int,
    timestamp: str,
    status: str = "success",
    notes: Optional[str] = None
) -> None:
    """Record an import run in the import_logs table."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO import_logs (
        exchange, source_file, records_added, records_updated, records_skipped,
        duplicates_detected, invalid_rows, total_processed, timestamp, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        exchange, source_file, records_added, records_updated, records_skipped,
        duplicates_detected, invalid_rows, total_processed, timestamp, status, notes
    ))
    conn.commit()
    conn.close()


# ============================================================================
# USER AUTHENTICATION & TOKEN INTERFACES
# ============================================================================

def hash_password(password: str) -> str:
    """Hash password using standard PBKDF2-HMAC-SHA256 with 16-byte random salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"{salt}:{key.hex()}"


def verify_password(stored_password_hash: str, password: str) -> bool:
    """Verify password against stored salt:hash string."""
    if not stored_password_hash or ":" not in stored_password_hash:
        return False
    salt, hex_key = stored_password_hash.split(":", 1)
    test_key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return secrets.compare_digest(hex_key, test_key.hex())


def create_access_token(user_id: int, email: str, name: str, expires_in_sec: int = 86400 * 30) -> str:
    """Create a tamper-proof signed bearer token."""
    payload = {
        "uid": user_id,
        "email": email.strip().lower(),
        "name": name.strip(),
        "exp": int(time.time()) + expires_in_sec
    }
    raw = json.dumps(payload, separators=(',', ':')).encode("utf-8")
    b64_payload = base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")
    sig = hmac.new(AUTH_SECRET_KEY.encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{b64_payload}.{sig}"


def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify bearer token signature and expiration date."""
    if not token or "." not in token:
        return None
    try:
        parts = token.strip().split(".")
        if len(parts) != 2:
            return None
        b64_payload, sig = parts
        expected_sig = hmac.new(AUTH_SECRET_KEY.encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
        if not secrets.compare_digest(sig, expected_sig):
            return None

        # Pad base64 if needed
        padding = '=' * (-len(b64_payload) % 4)
        raw = base64.urlsafe_b64decode(b64_payload + padding)
        payload = json.loads(raw.decode("utf-8"))
        if payload.get("exp", 0) < int(time.time()):
            return None
        return payload
    except Exception:
        return None


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Fetch user by unique email."""
    if not email:
        return None
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email.strip(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Fetch user by user_id."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, name, picture, auth_provider, created_at FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def create_user(email: str, password: Optional[str], name: str, picture: Optional[str] = None, auth_provider: str = "local") -> Dict[str, Any]:
    """Register a new user account."""
    clean_email = email.strip().lower()
    clean_name = name.strip()
    pwd_hash = hash_password(password) if password else None

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO users (email, password_hash, name, picture, auth_provider)
    VALUES (?, ?, ?, ?, ?)
    """, (clean_email, pwd_hash, clean_name, picture, auth_provider))
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "id": user_id,
        "email": clean_email,
        "name": clean_name,
        "picture": picture,
        "auth_provider": auth_provider
    }


def create_or_get_google_user(email: str, name: str, picture: Optional[str] = None) -> Dict[str, Any]:
    """Sign in or register a user authenticating via Google."""
    existing = get_user_by_email(email)
    if existing:
        # Update picture / name if newer
        if picture and picture != existing.get("picture"):
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET picture = ?, name = ? WHERE id = ?", (picture, name, existing["id"]))
            conn.commit()
            conn.close()
            existing["picture"] = picture
            existing["name"] = name
        return existing

    return create_user(
        email=email,
        password=None,
        name=name,
        picture=picture,
        auth_provider="google"
    )


# ============================================================================
# USER RESEARCH REPORT HISTORY INTERFACES
# ============================================================================

def save_user_report(
    user_id: int,
    symbol: str,
    exchange: str,
    company_name: str,
    verdict: str,
    conviction: Optional[str],
    target_price: Optional[str],
    report_data: Any
) -> int:
    """Save generated report JSON for user history."""
    json_str = report_data if isinstance(report_data, str) else json.dumps(report_data)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO user_reports (
        user_id, symbol, exchange, company_name, verdict, conviction, target_price, report_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        symbol.strip().upper(),
        exchange.strip().upper(),
        company_name.strip(),
        verdict.strip().upper(),
        conviction,
        str(target_price) if target_price else None,
        json_str
    ))
    report_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return report_id


def get_user_reports_list(user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieve summary cards of all reports generated by user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, user_id, symbol, exchange, company_name, verdict, conviction, target_price, created_at
    FROM user_reports
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
    """, (user_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_user_report_detail(user_id: int, report_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve full report data for a specific saved report."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, user_id, symbol, exchange, company_name, verdict, conviction, target_price, report_data, created_at
    FROM user_reports
    WHERE id = ? AND user_id = ?
    """, (report_id, user_id))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None

    res = dict(row)
    try:
        res["report"] = json.loads(res["report_data"])
    except Exception:
        res["report"] = None
    return res


def delete_user_report(user_id: int, report_id: int) -> bool:
    """Delete a report from user history."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM user_reports WHERE id = ? AND user_id = ?", (report_id, user_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

# USER WATCHLIST / FAVOURITES INTERFACES
def add_to_watchlist(user_id: int, symbol: str, exchange: str, company_name: str, sector: Optional[str] = None) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
        INSERT OR IGNORE INTO user_watchlists (user_id, symbol, exchange, company_name, sector)
        VALUES (?, ?, ?, ?, ?)
        ''', (user_id, symbol.upper().strip(), exchange.upper().strip(), company_name.strip(), sector))
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()

def remove_from_watchlist(user_id: int, symbol: str, exchange: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM user_watchlists WHERE user_id = ? AND symbol = ? AND exchange = ?', (user_id, symbol.upper().strip(), exchange.upper().strip()))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

def get_user_watchlist(user_id: int) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT id, symbol, exchange, company_name, sector, created_at
    FROM user_watchlists
    WHERE user_id = ?
    ORDER BY created_at DESC
    ''', (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
