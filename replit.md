# TARA — AI Travel Assistant

TARA (Travel Autonomous Response Agent) is a production-grade, AI-native travel assistant web app for the Nigerian market. 8 autonomous AI agents monitor trips, handle boarding passes, coordinate hotels, manage refunds, and more — all powered by real Claude AI (Anthropic claude-sonnet-4-6).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/tara run dev` — run the React frontend (port 19618, proxied at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed demo data (demo@tara.ai / demo1234)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7, Tailwind CSS v4, Framer Motion, Wouter (routing)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (jsonwebtoken + bcryptjs), stored as `tara_token` in localStorage
- AI: Anthropic claude-sonnet-4-6 via Replit AI Integrations proxy (SSE streaming chat)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (users, trips, agents, notifications, wallet, itineraries, conversations, messages)
- `lib/api-client-react/` — generated React Query hooks + Zod schemas (via Orval)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, users, dashboard, trips, agents, notifications, wallet, itineraries, anthropic)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware
- `artifacts/tara/src/pages/` — All 13 pages (Landing, Login, Onboarding, Dashboard, Chat, TripDetail, Agents, AgentLogs, Plan, Trips, Wallet, Notifications, Settings)
- `artifacts/tara/src/contexts/AuthContext.tsx` — Auth state
- `artifacts/tara/src/components/layout/AppLayout.tsx` — Sidebar + navigation layout

## Architecture decisions

- Contract-first API: OpenAPI spec in `lib/api-spec/` drives all codegen — never write API client code by hand
- JWT in localStorage (not cookies) — simplifies CORS and mobile-readiness
- SSE streaming for Anthropic chat: raw fetch() + ReadableStream instead of generated hook (generated hooks don't support streaming)
- Anthropic via Replit AI Integrations proxy: no API key required, model = claude-sonnet-4-6
- Dark mode default: applied via `document.documentElement.classList.add("dark")` in main.tsx before React mount

## Product

- Landing page with scroll-triggered reveals and live flight counter
- Auth (login/register) with JWT session persistence
- 5-step animated onboarding wizard
- Dashboard: active trips, live agent feed, TARA suggestions, stats
- Chat: SSE-streaming Anthropic conversations (WhatsApp-style UI)
- Trip detail: 3D boarding pass, live flight tracker, smart alerts
- Agent Control Center: 8 AI agents with toggles, health scores, activity logs
- Itinerary Planner: AI-generated day-by-day trip plans with Claude
- Wallet: Naira balance, Paystack-style funding, TARA rewards points
- Notifications: grouped, color-coded, real-time
- Settings: profile, preferences, agent permissions

## User preferences

- Nigerian market context: Naira (₦), Nigerian airports (LOS, ABJ, PHC, KAN, ENU), Nigerian airlines (Air Peace, Ibom Air, United Nigeria)
- Dark mode default
- No emojis in UI

## Demo credentials

- Email: demo@tara.ai
- Password: demo1234

## Gotchas

- bcryptjs must be in pnpm-workspace.yaml catalog (added as `bcryptjs: ^3.0.2`)
- Template literals in TSX files written by subagents may contain escaped backticks (`\``) — run `sed -i 's/\\`/`/g'` to fix
- SSE streaming requires `X-Accel-Buffering: no` header on the API response
- Anthropic itinerary endpoint returns JSON inside a text message — always try/catch the JSON.parse
- Run seed AFTER workflows start (DB must be available)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- API spec: `lib/api-spec/openapi.yaml` — run codegen after any spec changes
