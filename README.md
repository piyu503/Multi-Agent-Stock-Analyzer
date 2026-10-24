# EquiAgentic - Multi-Agent Stock Research Platform

A research platform for NSE & BSE Indian equities powered by an adversarial **13-agent research loop**, **LangGraph** orchestration, deterministic financial math, and a **heterogeneous multi-model AI architecture** (IBM Granite + Qwen 2.5/3.5 + DeepSeek-R1).

---

## What is EquiAgentic?

EquiAgentic moves beyond simple chatbot summaries by simulating an equity research team:
- **13 Specialized Agent Roles**: Fundamentals, Growth, News/Events, Sentiment, Market Microstructure, Peer Valuation, Bull/Bear Researchers, Trader Desk, Risk Analyst, and Portfolio Manager.
- **True Adversarial Debate & Cross-Examination**: Isolated Bull and Bear researchers craft independent theses, followed by adversarial challenge and cross-examination.
- **Deterministic Math Engine**: Eliminates LLM arithmetic hallucinations with Python-calculated Return on Equity (ROE: 45.89%), ROCE (56.29%), 3-year Revenue/EPS CAGRs, 14-day RSI, ATR buffers, and negative-equity solvency guards.
- **Real NSE & BSE Exchange Data**: Integrated with `stock-nse-india` for security-wise delivery position %, order book market depth (bid/ask ratio), and official exchange regulatory announcements.
- **7,800+ Official NSE & BSE Catalog**: Real securities database with exchange disambiguation, ISIN lookup, and scrip mapping.

> 📖 **Deep Multi-Agent Architecture Documentation**:
> For the comprehensive breakdown of agent workflows, raw data inputs, deterministic calculations, prompt engineering guardrails, and model routing, please see [**`agent_working.md`**](agent_working.md).

---

## Branches & Architecture

EquiAgentic provides both architectures for direct side-by-side evaluation:

* **`main` (Default Branch)**: **Heterogeneous Multi-Model Architecture**
  * Dispatches tasks to IBM Granite (extraction), Qwen (analysis), and DeepSeek-R1 (adversarial challenge).
  * Includes automatic fallback to the primary model if a specialized model is not loaded.
  * Full breakdown documented in [**`agent_working.md`**](agent_working.md).
* **`single-model-architecture` (Alternate Branch)**: **Single Unified Model Baseline**
  * Executes all 13 agents on a single model (e.g. `qwen2.5:7b` or `gpt-4o-mini`).
  * Useful for benchmarking against the multi-model architecture.

To switch between architectures:
```bash
# Switch to Multi-Model Architecture (Main):
git checkout main

# Switch to Single-Model Baseline:
git checkout single-model-architecture
```

---

## System Structure

```text
EquiAgentic/
├── backend/
│   ├── agents/                     # LangGraph Multi-Agent Engine
│   │   ├── orchestrator.py         # StateGraph workflow (5 stages, safe parallel state merging)
│   │   ├── analysts.py             # 7 foundational specialist agents (Evidence, Fundamentals, News, etc.)
│   │   ├── decision_makers.py      # Bull, Bear, Risk, Trader, and Portfolio Manager agents
│   │   ├── metrics.py              # Deterministic financial ratio calculator (ROE, ROCE, 3Y CAGR, PEG)
│   │   ├── base.py                 # Abstract BaseAgent, AgentOutput schema, and model_tier tracking
│   │   └── llm.py                  # Multi-model tier router (Granite, Qwen, DeepSeek-R1) with auto-fallback
│   ├── data_providers/             # Free Market & Exchange Data Providers
│   │   ├── aggregator.py           # Unified concurrent context enricher
│   │   ├── nse_provider.py         # Python async bridge for stock-nse-india
│   │   ├── yfinance_provider.py    # 1Y historical OHLCV, 50/200 DMA, RSI-14, ATR-14, multi-year statements
│   │   ├── news_provider.py        # Live Google News RSS feed for Indian stocks
│   │   ├── bse_provider.py         # Official BSE corporate filings & announcements API
│   │   └── peers_provider.py       # Sector peer benchmarking with comparative valuation multiples
│   ├── nse_service/                # Lightweight Node.js NSE Microstructure Bridge
│   │   ├── nse_bridge.cjs          # Script extracting Delivery %, Order Book Depth, and Board Meetings
│   │   └── package.json            # stock-nse-india dependency
│   ├── database.py                 # SQLite database connection, indexing, and search queries
│   ├── main.py                     # FastAPI REST API endpoints
│   ├── schemas.py                  # Pydantic v2 data models
│   ├── test_real_fixes.py          # Complete verification test suite (ISIN, Metrics, NSE, Multi-Model)
│   └── requirements.txt            # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx          # Clean header & exchange badges
│   │   │   ├── SearchBar.tsx       # Search by Symbol, Name, or 12-digit ISIN + Exchange filters
│   │   │   ├── StockCard.tsx       # Summary card with exchange tags & ISIN badge
│   │   │   ├── StockProfile.tsx    # Exchange-specific stock profile & "Generate Full Report" button
│   │   │   ├── ReportView.tsx      # Dynamic Bull/Bear debate, status badges, and trade execution matrix
│   │   │   └── AnalysisConsole.tsx # Live streaming terminal for agent rounds
│   │   ├── types.ts                # TypeScript interfaces matching backend models
│   │   └── App.tsx                 # Main layout & view routing
│   └── package.json                # Frontend dependencies
├── .env.example                    # Environment variables template
└── README.md                       # Documentation & setup guide
```

---

## Quickstart Guide

### Step 1: Check Prerequisites
1. **Python** (version 3.10 or higher): [Download Python](https://www.python.org/downloads/)
2. **Node.js** (version 18 or higher): [Download Node.js](https://nodejs.org/)
3. **Git**: [Download Git](https://git-scm.com/)
4. *(Recommended for local AI)* **Ollama**: [Download Ollama](https://ollama.ai/)

---

### Step 2: Clone the Repository

```bash
git clone https://github.com/piyu503/Multi-Agent-Stock-Analyzer.git
cd Multi-Agent-Stock-Analyzer
```

---

### Step 3: Setup the Backend (Python)

1. Open a terminal and enter the `backend` folder:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   # Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install the required Python libraries:
   ```bash
   pip install -r requirements.txt
   ```

4. Install the NSE bridge service dependencies:
   ```bash
   cd nse_service
   npm install
   cd ..
   ```

5. Configure your models in `backend/.env` (or copy from `.env.example`):
   ```dotenv
   LLM_PROVIDER=ollama
   LLM_BASE_URL=http://localhost:11434/v1
   LLM_TEMPERATURE=0.2

   # Heterogeneous Model Dispatching:
   LLM_MODEL_ANALYST=qwen2.5:7b
   LLM_MODEL_EXTRACTOR=granite3-dense:2b
   LLM_MODEL_REASONER=deepseek-r1:7b

   # Fallback primary model
   LLM_MODEL=qwen2.5:7b
   ```

   **To pull the local models in Ollama:**
   ```bash
   ollama pull qwen2.5:7b
   ollama pull granite3-dense:2b
   ollama pull deepseek-r1:7b
   ```

   > **Note:** If Ollama is not running, the platform operates in **Development Mode**, returning analytical stubs grounded in deterministic Python financial math without errors.

6. Start the backend server:
   ```bash
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
   The backend API is live at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.

---

### Step 4: Setup the Frontend (React + Vite)

Open a **separate terminal** in the project root:

1. Enter the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```text
   http://localhost:5173/
   ```

---

## Running Automated Tests

Run the complete backend verification suite:

```bash
cd backend
.\venv\Scripts\pytest.exe test_real_fixes.py -v
```

This verifies:
1. Deterministic ISIN Luhn checksum validation.
2. Distinct ROE (45.89%) vs ROCE (56.29%) and multi-year CAGR calculation.
3. Sector peer comparative multiples benchmarking.
4. Bull and Bear evidence pool consumption and factual guardrails.
5. Technical indicators, 14-day ATR, and 20-day swing range ingestion.
6. Catalog coverage across official exchange securities masters.
7. `stock-nse-india` delivery position and order book depth bridge.
8. Multi-model tier routing (Granite / Qwen / DeepSeek-R1) and `<think>` tag stripping.

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check verifying API, database, and catalog coverage |
| `GET` | `/api/stocks?q=...&exchange=...&page=...` | Search stocks by ticker, company name, or ISIN with filters |
| `GET` | `/api/stocks/{symbol}?exchange={NSE\|BSE}` | Retrieve profile for a specific exchange listing |
| `GET` | `/api/reports/stream/{symbol}?exchange={NSE\|BSE}` | SSE real-time stream of the 13-agent research loop |
| `POST` | `/api/reports/{symbol}?exchange={NSE\|BSE}` | Trigger full asynchronous multi-agent report generation |
| `POST` | `/api/catalog/import?exchange={NSE\|BSE}` | Upload official exchange CSV or Excel security master |

---

## License & Disclaimer

*Disclaimer: EquiAgentic is an educational and analytical research platform. It does not provide personal financial or investment advice. Always conduct your own independent due diligence before making investment decisions.*
