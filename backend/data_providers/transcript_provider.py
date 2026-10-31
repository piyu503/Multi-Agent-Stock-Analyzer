"""Earnings Call Transcripts Provider for EquiAgentic.

Queries indexed local earnings call transcripts for Nifty 100 stocks from ChromaDB
using all-MiniLM-L6-v2 embeddings. Provides targeted qualitative insights from CEO/CFO
commentary and institutional analyst Q&A.
"""

import asyncio
import logging
import os
from typing import Any, Dict, List, Optional

logger = logging.getLogger("equiagentic.data.transcripts")

_RAG_ENGINE_INSTANCE = None
_RAG_INITIALIZED = False


def _get_local_rag_engine():
    """Lazy-load the RAG engine and embedding model to keep server startup fast."""
    global _RAG_ENGINE_INSTANCE, _RAG_INITIALIZED
    if _RAG_INITIALIZED:
        return _RAG_ENGINE_INSTANCE

    _RAG_INITIALIZED = True
    try:
        os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
        import chromadb
        from sentence_transformers import SentenceTransformer

        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        # Prefer backend/chroma_db if present, else root chroma_db
        db_path = os.path.join(backend_dir, "chroma_db")
        if not os.path.exists(db_path):
            alt_path = os.path.join(os.path.dirname(backend_dir), "chroma_db")
            if os.path.exists(alt_path):
                db_path = alt_path

        if not os.path.exists(db_path):
            logger.info("ChromaDB directory not found; transcripts disabled until indexed.")
            return None

        client = chromadb.PersistentClient(path=db_path)
        collection = client.get_or_create_collection(name="equity_transcripts")
        model = SentenceTransformer("all-MiniLM-L6-v2")

        class SimpleRAGEngine:
            def __init__(self, coll, mdl):
                self.collection = coll
                self.model = mdl

            def query(self, query_text: str, symbol: str, n_results: int = 3) -> List[str]:
                clean_sym = str(symbol).split('-')[0].strip().upper()
                query_emb = self.model.encode(query_text).tolist()
                res = self.collection.query(
                    query_embeddings=[query_emb],
                    n_results=n_results,
                    where={"symbol": clean_sym}
                )
                docs = res.get("documents", [[]])[0]
                return docs if docs else []

        _RAG_ENGINE_INSTANCE = SimpleRAGEngine(collection, model)
        logger.info("Local earnings call transcript vector store loaded successfully.")
    except Exception as e:
        logger.warning(f"Could not load local RAG engine: {e}")
        _RAG_ENGINE_INSTANCE = None

    return _RAG_ENGINE_INSTANCE


def _sync_fetch_transcript_sections(symbol: str) -> Dict[str, Any]:
    """Retrieve categorized transcript snippets for a symbol synchronously."""
    engine = _get_local_rag_engine()
    if not engine or not symbol:
        return {
            "has_transcripts": False,
            "guidance_snippets": [],
            "risk_qa_snippets": [],
            "capex_debt_snippets": []
        }

    try:
        guidance = engine.query(
            query_text="management commentary growth outlook forward guidance capacity expansion revenue margin target",
            symbol=symbol,
            n_results=2
        )
        risks_qa = engine.query(
            query_text="analyst question raw material inflation competition margin pressure demand slowdown litigation",
            symbol=symbol,
            n_results=2
        )
        capex_debt = engine.query(
            query_text="debt repayment schedule capital expenditure capex borrowing liquidity working capital",
            symbol=symbol,
            n_results=2
        )

        has_data = bool(guidance or risks_qa or capex_debt)
        return {
            "has_transcripts": has_data,
            "guidance_snippets": guidance,
            "risk_qa_snippets": risks_qa,
            "capex_debt_snippets": capex_debt
        }
    except Exception as e:
        logger.warning(f"Error querying transcript store for {symbol}: {e}")
        return {
            "has_transcripts": False,
            "guidance_snippets": [],
            "risk_qa_snippets": [],
            "capex_debt_snippets": []
        }


async def fetch_transcript_insights(symbol: str) -> Dict[str, Any]:
    """Asynchronously fetch earnings call transcript sections without blocking event loop."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _sync_fetch_transcript_sections, symbol)
