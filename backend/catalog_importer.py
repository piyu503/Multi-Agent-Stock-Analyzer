"""Stock Catalog Importer for Official NSE and BSE Securities Lists.

Supports:
- NSE Equity files (EQUITIES_L.csv, EQUITY_L.csv, UDiFF Bhavcopy)
- BSE Scrip Master files (List of Scrips CSV / Excel, BSE Bhavcopy, UDiFF)
- Generic CSV & Excel (.xlsx) files
- Normalization of headers and missing optional fields
- Preserves exchange-specific listings and symbols
- Idempotent: safe to run multiple times without duplicates
- Transactional: rolls back or records failures without corrupting existing database
"""

import csv
import io
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union

try:
    import openpyxl
except ImportError:
    openpyxl = None

from database import log_import, upsert_stock_listing
from schemas import ImportSummary


# Header aliases mapping to standard fields
COLUMN_ALIASES = {
    "symbol": [
        "symbol", "tckrsymb", "security id", "security_id", "ticker", "scrip_id"
    ],
    "scrip_code": [
        "security code", "scrip code", "sc_code", "security_code", "scrip_code"
    ],
    "company_name": [
        "issuer name", "name of company", "company name", "fininstrmnm", "security name", "scrip name",
        "sc_name", "company"
    ],
    "isin": [
        "isin number", "isin", "isin no", "isin_code", "isincode", "isin_no"
    ],
    "series": [
        "series", "sctysrs", "group", "sc_group", "segment", "security type", "sc_type"
    ],
    "listing_date": [
        "date of listing", "listing date", "traddt", "bizdt"
    ],
    "industry": [
        "industry", "sector", "industry new name", "macro-economic sector"
    ],
    "status": [
        "status", "trading status", "listing status", "active"
    ]
}


def normalize_header(raw_col: str) -> str:
    """Normalize raw column name to lowercase trimmed alphanumeric string."""
    return "".join(c for c in str(raw_col).lower().strip() if c.isalnum() or c in (" ", "_"))


def identify_columns(headers: List[str]) -> Dict[str, int]:
    """Map standard fields to column indices based on aliases in priority order."""
    normalized = [normalize_header(h) for h in headers]
    field_map: Dict[str, int] = {}

    for standard_field, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            norm_alias = normalize_header(alias)
            if norm_alias in normalized:
                field_map[standard_field] = normalized.index(norm_alias)
                break

    # If symbol column is missing but scrip_code column is present (common in BSE files), alias symbol to scrip_code
    if "symbol" not in field_map and "scrip_code" in field_map:
        field_map["symbol"] = field_map["scrip_code"]

    return field_map


def parse_csv_stream(file_stream: io.TextIOBase) -> Tuple[List[str], List[List[str]]]:
    """Parse CSV text stream with automatic delimiter sniffer."""
    sample = file_stream.read(4096)
    file_stream.seek(0)

    try:
        sniffer = csv.Sniffer()
        dialect = sniffer.sniff(sample)
    except Exception:
        dialect = csv.excel

    reader = csv.reader(file_stream, dialect)
    rows = list(reader)
    if not rows:
        return [], []
    return rows[0], rows[1:]


def parse_excel_file(file_path: str) -> Tuple[List[str], List[List[str]]]:
    """Parse Excel (.xlsx) file using openpyxl."""
    if not openpyxl:
        raise RuntimeError("openpyxl is not installed. Install it to import Excel files.")

    wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
    ws = wb.active
    rows = []
    for r in ws.iter_rows(values_only=True):
        rows.append([str(c) if c is not None else "" for c in r])
    wb.close()

    if not rows:
        return [], []
    return rows[0], rows[1:]


def import_catalog_file(
    file_path: str,
    exchange: str,
    default_series: str = "EQ",
    is_active_default: bool = True
) -> ImportSummary:
    """Ingest an official securities file (CSV or XLSX) into the SQLite stock catalog.
    
    Guarantees:
    - Normalizes exchange to uppercase (e.g. NSE, BSE)
    - Distinguishes listings by exchange (never merges records solely because of identical symbols)
    - Validates presence of minimum required fields (symbol and company_name)
    - Idempotent: tracks added vs updated records, duplicates in-file
    - Tolerates missing optional columns (ISIN, series, listing date, industry)
    - Returns comprehensive ImportSummary
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Source file not found: {file_path}")

    filename = os.path.basename(file_path)
    exchange = exchange.strip().upper()
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Read rows
    if file_path.lower().endswith(".xlsx") or file_path.lower().endswith(".xls"):
        raw_headers, raw_rows = parse_excel_file(file_path)
    else:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            raw_headers, raw_rows = parse_csv_stream(f)

    if not raw_headers:
        summary = ImportSummary(
            source_file=filename,
            exchange=exchange,
            records_added=0,
            records_updated=0,
            records_skipped=0,
            duplicates_detected=0,
            invalid_rows=0,
            total_processed=0,
            timestamp=now_iso,
            status="error",
            notes="File is empty or contains no headers"
        )
        log_import(**summary.dict())
        return summary

    col_map = identify_columns(raw_headers)

    # Validate mandatory fields
    if "symbol" not in col_map or "company_name" not in col_map:
        notes = f"Missing required column(s): symbol/company_name in headers: {raw_headers}"
        summary = ImportSummary(
            source_file=filename,
            exchange=exchange,
            records_added=0,
            records_updated=0,
            records_skipped=0,
            duplicates_detected=0,
            invalid_rows=len(raw_rows),
            total_processed=len(raw_rows),
            timestamp=now_iso,
            status="error",
            notes=notes
        )
        log_import(**summary.model_dump())
        return summary

    records_added = 0
    records_updated = 0
    records_skipped = 0
    duplicates_detected = 0
    invalid_rows = 0
    seen_in_batch = set()

    for row_idx, row in enumerate(raw_rows, start=2):
        if not row or all(str(cell).strip() == "" for cell in row):
            records_skipped += 1
            continue

        try:
            raw_symbol = row[col_map["symbol"]].strip() if col_map["symbol"] < len(row) else ""
            raw_name = row[col_map["company_name"]].strip() if col_map["company_name"] < len(row) else ""

            if not raw_symbol or not raw_name:
                invalid_rows += 1
                continue

            # Check duplicate within same file
            batch_key = (raw_symbol.upper(), exchange)
            if batch_key in seen_in_batch:
                duplicates_detected += 1
            else:
                seen_in_batch.add(batch_key)

            # Optional columns
            raw_isin = None
            if "isin" in col_map and col_map["isin"] < len(row):
                val = row[col_map["isin"]].strip()
                if val and val.lower() != "nan" and val.lower() != "null":
                    raw_isin = val.upper()

            raw_scrip = None
            if "scrip_code" in col_map and col_map["scrip_code"] < len(row):
                val = row[col_map["scrip_code"]].strip()
                if val and val.lower() != "nan" and val.lower() != "null":
                    raw_scrip = val
            elif exchange == "BSE" and raw_symbol.isdigit():
                raw_scrip = raw_symbol

            raw_series = default_series
            if "series" in col_map and col_map["series"] < len(row):
                val = row[col_map["series"]].strip()
                if val:
                    raw_series = val

            raw_industry = None
            if "industry" in col_map and col_map["industry"] < len(row):
                val = row[col_map["industry"]].strip()
                if val:
                    raw_industry = val

            raw_date = None
            if "listing_date" in col_map and col_map["listing_date"] < len(row):
                val = row[col_map["listing_date"]].strip()
                if val:
                    raw_date = val

            is_active = is_active_default
            if "status" in col_map and col_map["status"] < len(row):
                val = row[col_map["status"]].strip().lower()
                if "suspend" in val or "delist" in val or "inactive" in val:
                    is_active = False

            added, updated = upsert_stock_listing(
                symbol=raw_symbol,
                company_name=raw_name,
                exchange=exchange,
                isin=raw_isin,
                series=raw_series,
                scrip_code=raw_scrip,
                sector=raw_industry,
                industry=raw_industry,
                listing_date=raw_date,
                is_active=is_active,
                is_prototype_data=False,
                data_source=f"Official {exchange} Securities File ({filename})",
                imported_at=now_iso
            )

            if added:
                records_added += 1
            elif updated:
                records_updated += 1
            else:
                records_skipped += 1

        except Exception:
            invalid_rows += 1

    total_processed = len(raw_rows)
    summary = ImportSummary(
        source_file=filename,
        exchange=exchange,
        records_added=records_added,
        records_updated=records_updated,
        records_skipped=records_skipped,
        duplicates_detected=duplicates_detected,
        invalid_rows=invalid_rows,
        total_processed=total_processed,
        timestamp=now_iso,
        status="success",
        notes=f"Successfully imported {records_added} new and {records_updated} updated listings from {filename}."
    )

    log_import(**summary.model_dump())
    return summary
