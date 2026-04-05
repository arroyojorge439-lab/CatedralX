# CATEDRALX — CHALAMANDRA LABS

## Overview

Personal sovereignty dashboard for user Dana. Full cyberpunk/matrix aesthetic (electric green #00FF41 on black, JetBrains Mono font). Runs entirely in Spanish.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS

## Artifacts

- `artifacts/api-server` — Express REST API (port 8080)
- `artifacts/catedralx` — React frontend (proxies /api/* → port 8080)
- `artifacts/mockup-sandbox` — Design component preview server

## Features

- **BTC Monitoring**: Live price via CoinGecko (30s cache), shown in header
- **AI Analysis (Cortex)**: Gemini AI with 3 lobes — Frontal (estrategia), Motor (ejecución), Wernicke (análisis) — soberano tier only
- **14 Trading Strategies**: SCHEHERAZADE, HERMES, CARROLL, LA HACKER, TRICKSTER, LA IA, EL NIÑO DE 8 AÑOS, EL VACÍO, LA SOMBRA, LA PARADOJA, EL ESPEJO, LA ESCOTILLA, EL RAYO, LA CATEDRAL
- **Live Signal Engine**: Probabilistic BUY/SELL/HOLD/ALERT generation for each strategy
- **Paper Trading**: $100k virtual balance, full order history (operador+ tier)
- **Nervous System**: IIT Phi computation, GWT broadcasting, Hebbian learning ticks
- **Git/Codex Management**: Git operations via API
- **Sovereignty Terminal**: Command-line interface view

## Tier System

| Tier | Price | Signals | Paper Trading | AI Lobes | Nervous Tick |
|------|-------|---------|---------------|----------|--------------|
| observador | free | 5 max | no | no | no |
| operador | $29/mo | 20 max | yes | no | no |
| soberano | $99/mo | unlimited | yes | yes | yes |

## Auth

- Session-based (express-session + connect-pg-simple)
- Cookie name: `catedralx.sid`
- Sessions table: auto-created by connect-pg-simple

## DB Schema (Drizzle ORM)

Tables: `users`, `signals`, `paper_portfolios`, `paper_trades`, `affective_state`, `nervous_state`, `sessions`

## Key Files

| File | Purpose |
|------|---------|
| `lib/api-spec/openapi.yaml` | OpenAPI spec (20+ endpoints) |
| `lib/db/src/schema/index.ts` | Drizzle schema |
| `artifacts/api-server/src/app.ts` | Express app setup |
| `artifacts/api-server/src/routes/index.ts` | All route handlers |
| `artifacts/api-server/src/lib/btcPrice.ts` | CoinGecko BTC price lib |
| `artifacts/api-server/src/lib/signalEngine.ts` | 14-strategy signal engine |
| `artifacts/api-server/src/lib/nervousSystem.ts` | IIT Phi + GWT + Hebbian |
| `artifacts/catedralx/src/App.tsx` | Frontend app + view-state nav |
| `artifacts/catedralx/src/components/Shell.tsx` | Sidebar + header shell |

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/catedralx run dev` — run frontend locally

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Express session secret
- `GEMINI_API_KEY` — Google Gemini AI API key (required for /ai/generate)
- `PORT` — assigned per artifact by Replit
- `BASE_PATH` — base path prefix per artifact

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
