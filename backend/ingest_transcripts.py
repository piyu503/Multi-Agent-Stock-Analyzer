"""Ingest earnings call transcripts from CSV into backend/chroma_db vector store."""

import io
import os
import sys
from typing import List
import pandas as pd
import requests

from pypdf import PdfReader

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from data_providers.transcript_provider import _get_local_rag_engine


def chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> List[str]:
    """Split transcript text into overlapping chunks."""
    if not isinstance(text, str) or not text.strip():
        return []
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks


def extract_text_from_pdf_url(url: str) -> str:
    """Download PDF in-memory and extract text."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        resp = requests.get(url, headers=headers, timeout=25)
        resp.raise_for_status()
        pdf_file = io.BytesIO(resp.content)
        reader = PdfReader(pdf_file)
        pages_text = [page.extract_text() for page in reader.pages if page.extract_text()]
        return "\n".join(pages_text)
    except Exception as e:
        print(f"  Warning: Could not fetch {url}: {e}")
        return ""


def ingest_transcripts_from_csv(csv_path: str = None):
    """Read CSV, process PDFs, and index them into local ChromaDB."""
    if csv_path is None:
        csv_path = os.path.join(BACKEND_DIR, "data", "nifty100_transcripts.csv")

    if not os.path.exists(csv_path):
        print(f"CSV not found at {csv_path}")
        return

    print(f"Reading transcripts from: {csv_path}")
    df = pd.read_csv(csv_path)
    engine = _get_local_rag_engine()
    if not engine:
        print("ChromaDB engine could not be initialized.")
        return

    total_chunks = 0
    sym_col = "Symbol" if "Symbol" in df.columns else "symbol"
    link_col = "Transcript_Link" if "Transcript_Link" in df.columns else "transcript_link"

    for idx, row in df.iterrows():
        symbol = str(row.get(sym_col, "")).upper().strip()
        link = str(row.get(link_col, "")).strip()
        if not link or not link.startswith("http"):
            continue

        print(f"[{idx+1}/{len(df)}] Fetching PDF for {symbol}...")
        raw_text = extract_text_from_pdf_url(link)
        if len(raw_text.strip()) < 100:
            print(f"  Skipped {symbol} (insufficient readable text)")
            continue

        chunks = chunk_text(raw_text)
        for i, chk in enumerate(chunks):
            metadata = {
                "symbol": symbol,
                "chunk_id": i,
                "source": "official_earnings_call_transcript_pdf",
                "source_url": link
            }
            # Add to chroma
            emb = engine.model.encode(chk).tolist()
            doc_id = f"{symbol}_{i}_{abs(hash(chk))}"
            engine.collection.upsert(
                ids=[doc_id],
                embeddings=[emb],
                documents=[chk],
                metadatas=[metadata]
            )
            total_chunks += 1
        print(f"  Successfully indexed {len(chunks)} chunks for {symbol}.")

    print(f"\nIngestion complete! Total chunks indexed: {total_chunks}")


if __name__ == "__main__":
    ingest_transcripts_from_csv()
