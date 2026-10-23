import os
import pytest
import sqlite3
import tempfile
from fastapi.testclient import TestClient

# Configure test environment
test_db_dir = tempfile.mkdtemp()
test_db_file = os.path.join(test_db_dir, "test_stocks.db")
os.environ["DB_FILE"] = test_db_file

import database
database.DB_FILE = test_db_file

from catalog_importer import import_catalog_file
from agents.llm import LLMConfig
LLMConfig.is_configured = False
from main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    # Ensure empty database before test
    conn = database.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS stocks")
    cursor.execute("DROP TABLE IF EXISTS import_logs")
    conn.commit()
    conn.close()
    database.init_db()

    yield

    conn = database.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS stocks")
    cursor.execute("DROP TABLE IF EXISTS import_logs")
    conn.commit()
    conn.close()



def test_seed_catalog_and_unimported_notice():
    """Verify seed catalog returns properly and reports catalog_imported = False before imports."""
    database.init_db()
    res = client.get("/api/stocks")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 10
    assert data["catalog_imported"] is False
    assert "Showing seed prototype catalog" in data["message"]


def test_import_sample_nse_and_bse_files():
    """Test importing synthetic NSE and BSE securities files."""
    nse_content = """SYMBOL,NAME OF COMPANY,SERIES,DATE OF LISTING,PAID UP VALUE,MARKET LOT,ISIN NUMBER,FACE VALUE
BAJAJ_AUTO,Bajaj Auto Limited,EQ,26-MAY-2008,10,1,INE917I01010,10
NESTLEIND,Nestle India Limited,EQ,09-JAN-1995,1,1,INE239A01024,1
"""
    bse_content = """Security Code,Security Id,Security Name,Status,Group,Face Value,ISIN No,Industry
500490,BAJAJ-AUTO,Bajaj Auto Limited,Active,A,10,INE917I01010,Automobiles
500790,NESTLEIND,Nestle India Limited,Active,A,1,INE239A01024,Packaged Foods
"""
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".csv") as nse_f:
        nse_f.write(nse_content)
        nse_path = nse_f.name

    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".csv") as bse_f:
        bse_f.write(bse_content)
        bse_path = bse_f.name

    try:
        nse_summary = import_catalog_file(nse_path, exchange="NSE")
        assert nse_summary.status == "success"
        assert nse_summary.records_added == 2
        assert nse_summary.records_updated == 0

        bse_summary = import_catalog_file(bse_path, exchange="BSE")
        assert bse_summary.status == "success"
        assert bse_summary.records_added == 2

        # Verify catalog is now marked imported
        health = client.get("/api/health").json()
        assert health["catalog_imported"] is True

        # Verify searching by company name returns both NSE and BSE listings
        search = client.get("/api/stocks?q=Nestle").json()
        assert search["total"] == 2
        exchanges = {item["exchange"] for item in search["items"]}
        assert exchanges == {"NSE", "BSE"}

    finally:
        os.remove(nse_path)
        os.remove(bse_path)


def test_idempotent_import_and_updating_records():
    """Importing the same file twice must not duplicate records, and modified fields should update."""
    sample_v1 = """SYMBOL,NAME OF COMPANY,SERIES,DATE OF LISTING,PAID UP VALUE,MARKET LOT,ISIN NUMBER,FACE VALUE
WIPRO,Wipro Limited,EQ,08-NOV-1995,2,1,INE075A01022,2
"""
    sample_v2 = """SYMBOL,NAME OF COMPANY,SERIES,DATE OF LISTING,PAID UP VALUE,MARKET LOT,ISIN NUMBER,FACE VALUE
WIPRO,Wipro Limited - Updated Global,EQ,08-NOV-1995,2,1,INE075A01022,2
"""
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".csv") as f1:
        f1.write(sample_v1)
        path1 = f1.name

    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".csv") as f2:
        f2.write(sample_v2)
        path2 = f2.name

    try:
        # Run 1: Add record
        sum1 = import_catalog_file(path1, exchange="NSE")
        assert sum1.records_added == 1
        assert sum1.records_updated == 0

        # Run 2: Exact duplicate re-import
        sum2 = import_catalog_file(path1, exchange="NSE")
        assert sum2.records_added == 0
        assert sum2.records_updated == 1  # updated existing row in-place

        # Check total count remains 1 for WIPRO
        res = client.get("/api/stocks?q=WIPRO&exchange=NSE").json()
        assert res["total"] == 1
        assert res["items"][0]["company_name"] == "Wipro Limited"

        # Run 3: Updated version
        sum3 = import_catalog_file(path2, exchange="NSE")
        assert sum3.records_added == 0
        assert sum3.records_updated == 1

        res_updated = client.get("/api/stocks?q=WIPRO&exchange=NSE").json()
        assert res_updated["items"][0]["company_name"] == "Wipro Limited - Updated Global"

    finally:
        os.remove(path1)
        os.remove(path2)


def test_handling_missing_isin_and_optional_columns():
    """Importer should safely handle records with missing ISIN, missing dates, or irregular columns."""
    minimal_content = """symbol,company name
MINIMALCO,Minimal Company Without ISIN
"""
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".csv") as f:
        f.write(minimal_content)
        path = f.name

    try:
        summary = import_catalog_file(path, exchange="NSE")
        assert summary.status == "success"
        assert summary.records_added == 1

        res = client.get("/api/stocks?q=MINIMALCO").json()
        assert res["total"] == 1
        item = res["items"][0]
        assert item["symbol"] == "MINIMALCO"
        assert item["isin"] is None
        assert item["series"] == "EQ"
    finally:
        os.remove(path)


def test_search_by_isin_and_symbol():
    """Verify search endpoint matches by 12-digit ISIN as well as symbol."""
    content = """SYMBOL,NAME OF COMPANY,SERIES,ISIN NUMBER
ASIANPAINT,Asian Paints Limited,EQ,INE021A01026
"""
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".csv") as f:
        f.write(content)
        path = f.name

    try:
        import_catalog_file(path, exchange="NSE")

        # Search by full ISIN
        res_isin = client.get("/api/stocks?q=INE021A01026").json()
        assert res_isin["total"] == 1
        assert res_isin["items"][0]["symbol"] == "ASIANPAINT"

        # Search by Symbol prefix
        res_sym = client.get("/api/stocks?q=ASIAN").json()
        assert res_sym["total"] == 1
        assert res_sym["items"][0]["symbol"] == "ASIANPAINT"
    finally:
        os.remove(path)


def test_pagination_and_exchange_filters():
    """Verify pagination controls (page, limit) and exchange filtering."""
    rows = ["SYMBOL,NAME OF COMPANY,ISIN NUMBER"]
    for i in range(1, 26):
        rows.append(f"NSE_SYM_{i:02d},Company {i},INE000000{i:03d}")
    nse_content = "\n".join(rows)

    bse_rows = ["Security Code,Security Name,ISIN No"]
    for i in range(1, 11):
        bse_rows.append(f"500{i:03d},BSE Company {i},INE111111{i:03d}")
    bse_content = "\n".join(bse_rows)

    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".csv") as f_nse:
        f_nse.write(nse_content)
        path_nse = f_nse.name

    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".csv") as f_bse:
        f_bse.write(bse_content)
        path_bse = f_bse.name

    try:
        import_catalog_file(path_nse, exchange="NSE")
        import_catalog_file(path_bse, exchange="BSE")

        # Filter by exchange NSE and query prefix to test pagination on imported set
        res_nse = client.get("/api/stocks?q=NSE_SYM&exchange=NSE&limit=10&page=1").json()
        assert res_nse["total"] == 25
        assert len(res_nse["items"]) == 10
        assert res_nse["page"] == 1
        assert res_nse["total_pages"] == 3
        assert all(it["exchange"] == "NSE" for it in res_nse["items"])

        # Page 2
        res_p2 = client.get("/api/stocks?q=NSE_SYM&exchange=NSE&limit=10&page=2").json()
        assert len(res_p2["items"]) == 10
        assert res_p2["page"] == 2

        # Filter by exchange BSE
        res_bse = client.get("/api/stocks?q=BSE%20Company&exchange=BSE").json()
        assert res_bse["total"] == 10
        assert all(it["exchange"] == "BSE" for it in res_bse["items"])

    finally:
        os.remove(path_nse)
        os.remove(path_bse)


def test_malformed_input_file_handling():
    """Malformed input without symbol/name must be flagged as error without corrupting DB."""
    malformed = """SomeRandomColumn,AnotherColumn
1234,ValueWithoutSymbol
"""
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".csv") as f:
        f.write(malformed)
        path = f.name

    try:
        summary = import_catalog_file(path, exchange="NSE")
        assert summary.status == "error"
        assert "Missing required column" in summary.notes

        # Existing stocks remain intact
        health = client.get("/api/health").json()
        assert health["status"] == "ok"
    finally:
        os.remove(path)


def test_exchange_specific_profile_and_demo_report_flow():
    """Verify stock profile and demo report flows work with exchange disambiguation."""
    nse_content = "SYMBOL,NAME OF COMPANY,ISIN NUMBER\nTESTCO,Test Corp India (NSE),INE999A01011\n"
    bse_content = "Security Id,Security Name,ISIN No\nTESTCO,Test Corp India (BSE),INE999A01011\n"

    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".csv") as f1:
        f1.write(nse_content)
        p1 = f1.name
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".csv") as f2:
        f2.write(bse_content)
        p2 = f2.name

    try:
        import_catalog_file(p1, exchange="NSE")
        import_catalog_file(p2, exchange="BSE")

        # Fetch profile for NSE
        prof_nse = client.get("/api/stocks/TESTCO?exchange=NSE").json()
        assert prof_nse["symbol"] == "TESTCO"
        assert prof_nse["exchange"] == "NSE"
        assert prof_nse["company_name"] == "Test Corp India (NSE)"

        # Fetch profile for BSE
        prof_bse = client.get("/api/stocks/TESTCO?exchange=BSE").json()
        assert prof_bse["symbol"] == "TESTCO"
        assert prof_bse["exchange"] == "BSE"
        assert prof_bse["company_name"] == "Test Corp India (BSE)"

        # Generate report for BSE listing
        rep_bse = client.post("/api/reports/TESTCO?exchange=BSE").json()
        assert rep_bse["exchange"] == "BSE"
        assert rep_bse["company_name"] == "Test Corp India (BSE)"
        assert any(k in rep_bse["disclaimer"].upper() for k in ["REPORT", "RESEARCH", "SYNTHESIS", "DEVELOPMENT"])

    finally:
        os.remove(p1)
        os.remove(p2)


def test_audit_idempotency_and_no_ghost_records():
    """Regression test: Repeating file imports preserves exact row counts with zero duplicate records."""
    csv_nse = """SYMBOL,NAME OF COMPANY,ISIN NUMBER
AUDIT_NSE1,Audit NSE One,INE100A01011
AUDIT_NSE2,Audit NSE Two,INE100A01022
"""
    csv_bse = """Security Id,Security Name,ISIN No
AUDIT_BSE1,Audit BSE One,INE200B01011
AUDIT_BSE2,Audit BSE Two,INE200B01022
"""
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".csv") as fnse:
        fnse.write(csv_nse)
        pnse = fnse.name

    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".csv") as fbse:
        fbse.write(csv_bse)
        pbse = fbse.name

    try:
        # First import
        s_nse1 = import_catalog_file(pnse, exchange="NSE")
        assert s_nse1.records_added == 2
        s_bse1 = import_catalog_file(pbse, exchange="BSE")
        assert s_bse1.records_added == 2

        # Verify search totals
        tot1 = client.get("/api/stocks?q=AUDIT").json()["total"]
        assert tot1 == 4

        # Repeat import - must update in place with 0 added
        s_nse2 = import_catalog_file(pnse, exchange="NSE")
        assert s_nse2.records_added == 0
        assert s_nse2.records_updated == 2

        s_bse2 = import_catalog_file(pbse, exchange="BSE")
        assert s_bse2.records_added == 0
        assert s_bse2.records_updated == 2

        tot2 = client.get("/api/stocks?q=AUDIT").json()["total"]
        assert tot2 == 4
    finally:
        os.remove(pnse)
        os.remove(pbse)

