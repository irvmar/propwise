# PropWise AI

SMS-first AI agent for property management. Tenants text, the AI handles it — maintenance requests, rent questions, work order tracking, vendor coordination, and emergency escalation. All through SMS.

Built because property managers shouldn't be glued to their phones 24/7, and tenants shouldn't wait days for a response about a leaky faucet.

## How It Works

```
Tenant sends SMS
  --> Twilio webhook
    --> Fast-path check (emergency? escalation? greeting?)
      --> Claude Sonnet agent with tools
        --> Creates work order / Answers question / Escalates to PM
          --> Response sent via SMS
```

The agent uses a tool-based agentic loop with two tools: `create_work_order` and `escalate_to_manager`. It has full context — tenant data, active work orders, knowledge base, conversation history — injected into the system prompt on every message.

## Architecture

| Layer | Tech |
|-------|------|
| **SMS** | Twilio Programmable Messaging |
| **AI** | Claude Sonnet (Anthropic SDK) with tool use |
| **Backend** | Firebase Cloud Functions (TypeScript) |
| **Database** | Firestore |
| **Frontend** | Next.js 15 (App Router) + Tailwind + shadcn/ui |
| **Payments** | Stripe subscriptions |
| **Email** | Resend |

## Modules

### `functions/` — Backend (Cloud Functions)

- **`agents/`** — SMS agent with fast-path detection (emergency keywords, escalation, greetings) and Claude-powered responses with tool calling
- **`handlers/sms/`** — Twilio webhook handlers for tenant and vendor SMS
- **`handlers/api/`** — Dashboard CRUD endpoints (27 functions)
- **`handlers/scheduled/`** — Cron jobs: rent reminders, work order follow-ups, monthly counter resets
- **`handlers/marketing/`** — Lead management, email drips, social content generation, blog drafts
- **`services/`** — Claude, Twilio, Stripe, Resend, Google Imagen integrations
- **`evals/`** — LLM evaluation system (see below)

### `web/` — Frontend (Next.js)

- **`dashboard/`** — PM interface: inbox, work orders, tenants, properties, vendors, knowledge base, settings
- **`blog/`** — AI-generated blog with SSR
- **`(marketing)/`** — Landing page + pricing

### `packages/shared/` — Shared Types

TypeScript types and constants used by both functions and web: organizations, tenants, work orders, conversations, vendors, knowledge base.

## LLM Evaluation System

The project includes a 3-level eval system built to systematically measure and improve AI response quality — not just "does it work" but "is the response actually good."

### Level 1 — Unit Tests (34 cases, runs on every change)

Fast, deterministic, mocked Claude. Covers 9 categories: emergency, maintenance, rent inquiry, lease questions, status inquiry, greetings, escalation, multi-turn conversations, and edge cases (Spanish, prompt injection, Spanglish).

```bash
npm run test:evals        # free, fast, no API calls
```

### Level 2 — LLM-as-Judge (human-first alignment)

4 judge dimensions: tone, accuracy, instruction following, safety. Each judge is a separate Claude call that returns a binary pass/fail + critique.

The key: **human evaluation comes first**. The system generates a CSV, you fill in human verdicts in Excel/Google Sheets, then run the alignment calculator to see how well the LLM judge agrees with you. Iterate on judge prompts until agreement hits 90%+.

```bash
npm run test:evals:live   # prompts before spending money
npm run test:evals:alignment  # compare human vs model verdicts
```

### Level 3 — AB Testing (scaffold)

Types and stubs for comparing system prompt variants or model versions. Not yet implemented — ready when the system matures.

## Commands

```bash
# Development
npm run dev:web           # Next.js dev server
npm run dev:functions     # Firebase emulator

# Testing
npm test                  # Unit tests (70 tests)
npm run test:evals        # Mocked evals (35 tests, free)
npm run test:evals:live   # Live API evals (interactive cost gate)
npm run test:all          # Everything CI-safe

# Build & Deploy
npm run build:shared      # Build shared package
npm run build:functions   # Build Cloud Functions
firebase deploy --only functions
```

## Setup

```bash
git clone https://github.com/irvmar/propwise.git
npm install
cp .env.example functions/.env    # add your API keys
cp web/.env.local.example web/.env.local
npm run build:shared
```

Required keys: `ANTHROPIC_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`.

## License

Private.
