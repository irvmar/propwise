# PropWise AI

## Project Overview
SMS-first AI agent SaaS for property management. Handles tenant communication, maintenance coordination, and rent reminders.

## Architecture
- **Monorepo** with npm workspaces: `packages/shared`, `functions`, `web`
- **Backend:** Firebase Cloud Functions (TypeScript)
- **Database:** Firestore
- **Frontend:** Next.js 15 (App Router) + Tailwind CSS + shadcn/ui
- **AI:** Claude API (Sonnet for SMS responses)
- **SMS:** Twilio Programmable Messaging
- **Payments:** Stripe subscriptions

## Key Files
- `functions/src/handlers/sms/IncomingSms.ts` — Main SMS webhook handler
- `functions/src/agents/router.agent.ts` — Intent classification
- `functions/src/services/claude.service.ts` — AI engine
- `packages/shared/src/types/` — All data contracts
- `web/src/app/dashboard/inbox/page.tsx` — Primary PM interface

## Commands
- `npm run dev:web` — Start Next.js dev server
- `npm run dev:functions` — Start Firebase emulator
- `npm run build:shared` — Build shared package
- `npm run build:functions` — Build Cloud Functions

## Deployment
- **Repo:** https://github.com/irvmar/propwise
- **Vercel project:** `propwise-ai` (single project, no duplicates)
- **Production URL:** propwise-ai-ten.vercel.app
- **Root directory:** `web/` (Vercel only builds the Next.js app)
- **Production branch:** `main` (auto-deploys on push)
- **Framework:** Next.js, build command: `next build`
- **Backend:** Firebase Cloud Functions deployed separately via `firebase deploy --only functions`

## Conventions
- Use TypeScript strict mode everywhere
- Shared types live in `packages/shared`
- All Firestore collections use camelCase
- Phone numbers stored in E.164 format
- All AI responses go through the agent pipeline
- Error handling: use typed errors from shared package
