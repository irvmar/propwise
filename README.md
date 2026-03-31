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

**Event-driven backend.** Nothing runs until something happens — an SMS arrives (Twilio webhook), a document changes (Firestore trigger on work order creation, tenant onboarding), or a schedule fires (rent reminders, follow-ups, counter resets). Every function is stateless, triggered by an event, and scales to zero when idle.

| Layer | Tech |
|-------|------|
| **SMS** | Twilio Programmable Messaging |
| **AI** | Claude Sonnet (Anthropic SDK) with tool use |
| **Backend** | Firebase Cloud Functions (TypeScript), event-driven |
| **Database** | Firestore |
| **Frontend** | Next.js 15 (App Router) + Tailwind + shadcn/ui |
| **Payments** | Stripe subscriptions |
| **Email** | Resend |

## For Property Managers

PMs sign up, connect their Twilio number, and configure the AI agent entirely through the dashboard — no code required.

**Onboarding:** Add your properties, units, and tenants. Each tenant gets linked to a phone number. The moment a tenant texts your Twilio number, the AI is live.

**Personalizing the agent:**

- **Knowledge Base** — Add entries for policies (quiet hours, pet rules, parking), FAQs, payment info, amenities. The agent references these when tenants ask questions. No KB entry? The agent says "I don't have that info" and offers to connect with you instead of making things up.
- **Emergency Keywords** — Customize what triggers an immediate escalation. Defaults include flood, fire, gas leak, etc. Add your own (e.g., "mold", "rats") per organization.
- **Auto-Approval Threshold** — Set a dollar amount for maintenance requests that get auto-approved without PM review.
- **Business Hours** — Configure per-day schedules. After-hours messages get a different response.
- **Escalation Contact** — Set the phone/email where urgent escalations land.

**Day-to-day:**

- **Inbox** — See all tenant conversations in real time. The AI handles most messages, but you can jump in and reply manually at any point.
- **Work Orders** — AI-created maintenance requests show up here with category, priority, and tenant photos. Assign vendors, track status through the full lifecycle (new > vendor contacted > assigned > scheduled > completed).
- **Vendors** — Add contractors by specialty. When a work order is created, the system auto-dispatches to the right vendor via SMS. Vendors accept/decline by texting back.
- **Tenants** — Manage tenant info, balances, lease dates. The agent uses this data in every response.
- **Settings** — Toggle AI on/off, adjust all the personalization options above.

## Modules

### `functions/` — Backend (Event-Driven Cloud Functions)

- **`agents/`** — SMS agent with fast-path detection (emergency keywords, escalation, greetings) and Claude-powered responses with tool calling
- **`handlers/sms/`** — Twilio webhook handlers for tenant and vendor SMS (event: inbound SMS)
- **`handlers/api/`** — Dashboard CRUD endpoints (27 functions, event: HTTP request)
- **`handlers/scheduled/`** — Rent reminders, work order follow-ups, counter resets (event: cron schedule)
- **`handlers/stripe/`** — Subscription lifecycle (event: Stripe webhook)
- **`handlers/marketing/`** — Lead management, email drips, social content, blog drafts
- **`services/`** — Claude, Twilio, Stripe, Resend, Google Imagen integrations
- **`evals/`** — LLM evaluation system (see below)

**Firestore triggers:** `onWorkOrderCreated` (auto-dispatches to vendor), `onTenantCreated` (sends welcome SMS)

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
