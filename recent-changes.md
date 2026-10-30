# Recent Changes Log

This document tracks incremental feature additions, performance optimizations, and bug fixes made after each Git push.

---

## Commit `af97337` — Dhan API Integration & Multi-Agent Execution Fixes

* **Dhan API Pro Provider and Failover Engine**:
  * Implemented `backend/data_providers/dhan_provider.py` providing live institutional ticks, VWAP, Level-2 market depth, 14-day ATR, 14-day RSI, 50/200 DMA, and official NSE delivery absorption.
  * Built dual-tier ingestion in `aggregator.py` with automatic failover (`DHAN_PRO_VERIFIED` to `STANDARD_FREE_FALLBACK`) if credentials are unconfigured or expired.
  * Added top Nifty 100/500 security ID lookup mapping in `dhan_instruments.json`.

* **Model Routing Optimization (7B Coder and DeepSeek-R1)**:
  * Switched Stage 1 specialist analysts to `qwen2.5-coder:7b` for fast, structured JSON generation (reducing per-analyst execution from 45s+ down to ~6-9s).
  * Preserved `deepseek-r1:7b` for high-depth adversarial challenges and risk stress testing.

* **Stage 1 Concurrency and Per-Agent Live Ticking**:
  * Enabled parallel dispatch across all 7 foundational specialists via `asyncio.create_task` and `asyncio.as_completed`.
  * Fixed SSE streaming so each specialist updates on screen the exact moment it completes, eliminating batch freezes.

* **Sequential Risk-Informed Trading Architecture**:
  * Restructured Stage 4 into a sequential dependency: `Risk Analyst` executes first to compute worst-case tail risks and invalidation boundaries.
  * `Execution Trader` executes second, directly consuming Risk Analyst findings to define accumulation price bands, tranche sizing, and stop-loss floors.

* **Adversarial Rebuttal Phase Visibility**:
  * Integrated an in-modal real-time rebuttal progress indicator for the 13-agent research loop.
  * Updated Bull and Bear synthesis wording to reflect mutual cross-examination and defense.

* **Institutional Logging System**:
  * Configured standardized root logging in `main.py` with timestamps, module tags, and full stack trace capture on stream errors.

---
