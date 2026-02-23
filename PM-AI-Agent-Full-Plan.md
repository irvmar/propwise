# Property Management AI Agent — Full Business & Product Plan

**Document Version:** 1.0
**Date:** February 22, 2026
**Status:** Pre-Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Market Analysis](#2-market-analysis)
3. [Competitive Landscape](#3-competitive-landscape)
4. [Product Vision & Strategy](#4-product-vision--strategy)
5. [PRD: MVP (Phase 1)](#5-prd-mvp-phase-1)
6. [PRD: Maintenance Coordination Agent](#6-prd-maintenance-coordination-agent)
7. [PRD: Tenant FAQ & Policy Agent](#7-prd-tenant-faq--policy-agent)
8. [PRD: Rent Collection & Reminders Agent](#8-prd-rent-collection--reminders-agent)
9. [PRD: PM Dashboard](#9-prd-pm-dashboard)
10. [PRD: Onboarding & Self-Serve Signup](#10-prd-onboarding--self-serve-signup)
11. [Technical Architecture](#11-technical-architecture)
12. [Data Model](#12-data-model)
13. [AI Agent Design](#13-ai-agent-design)
14. [Integrations Strategy](#14-integrations-strategy)
15. [Pricing & Unit Economics](#15-pricing--unit-economics)
16. [Go-to-Market Plan](#16-go-to-market-plan)
17. [Operational Playbook](#17-operational-playbook)
18. [Risk Register & Mitigations](#18-risk-register--mitigations)
19. [Metrics & KPIs](#19-metrics--kpis)
20. [Roadmap](#20-roadmap)

---

## 1. Executive Summary

### The Problem

Small and mid-size property managers (under 500 units) spend 60% of their time on repetitive tasks: answering tenant questions, coordinating maintenance, chasing rent payments, and playing phone tag between tenants, vendors, and owners. This work consumes 40+ hours per week and is the #1 cause of burnout in the industry.

### The Gap

No product exists that provides an affordable, full-lifecycle AI agent for SMB property managers that plugs into their existing tools:

- **EliseAI** ($390M+ raised) serves enterprise only — opaque pricing, sales-driven, 1,000+ unit minimums
- **MagicDoor** ($25/mo) requires switching your entire PM software stack — adoption barrier
- **STAN.AI** handles communication only — no maintenance coordination, no pricing transparency
- **Vendoroo** ($3/door/mo) does maintenance only
- **Showdigs** ($1.20/unit/mo) does leasing only, 100-unit minimum
- **Brickwise** ($32/tenant/mo) is 6 months old, costs $3,200/mo for 100 units — too expensive
- **Human VAs** cost $1,200-$2,000/mo, aren't 24/7, and don't scale

### The Product

An SMS-first AI agent priced at $99-$349/mo that handles:

1. Tenant communication (24/7, instant responses)
2. Maintenance coordination (triage, vendor dispatch, scheduling, follow-ups)
3. Rent reminders and late payment follow-ups
4. Common questions answered from property/lease data

The agent plugs INTO the PM's existing workflow — no software migration required. Self-serve signup. Live in 48 hours.

### The Opportunity

- 280,000+ SMB property managers in the US (managing under 500 units)
- 40%+ still use spreadsheets — haven't adopted existing software because it's too expensive or doesn't solve their actual problems
- PM software market for small landlords growing at 11.13% CAGR
- 85% of real estate decision-makers plan to increase tech spending
- Total addressable manual labor spend: $28-$33 billion annually

### Revenue Target

| Milestone | Clients | Avg Ticket | MRR |
|-----------|---------|------------|-----|
| Month 3 | 5-10 | $200 | $1,000-$2,000 |
| Month 6 | 20-30 | $225 | $4,500-$6,750 |
| Month 12 | 50-100 | $250 | $12,500-$25,000 |
| Month 24 | 200-400 | $275 | $55,000-$110,000 |

---

## 2. Market Analysis

### 2.1 Industry Size

| Metric | Value | Source |
|--------|-------|--------|
| US property management companies | 335,000+ | IBISWorld |
| SMB PMs (under 500 units) | ~280,000 | Estimated from industry data |
| Total US units under management | ~48 million | NMHC/NAA |
| PM software market (US, 2024) | $1.60 billion | Grand View Research |
| PM software market (global, 2032 projected) | $52.21 billion | Fortune Business Insights |
| CAGR for SMB PM software | 11.13% | Grand View Research |
| Annual manual labor spend (automatable) | $28-$33 billion | BLS + industry estimates |

### 2.2 Target Customer Profile

**Primary: Independent Property Managers**
- Manage 50-500 residential units
- 1-5 person office staff
- Revenue: $200K-$2M/year (7-10% management fees)
- Currently use basic PM software (Buildium, TenantCloud, RentRedi) or spreadsheets
- Pain: drowning in tenant calls, maintenance coordination, admin work
- Budget for automation: $100-$500/mo (currently spending $0 on AI, $35K-$55K on admin staff)

**Secondary: Self-Managing Landlords**
- Own 10-50 units
- No dedicated staff — do everything themselves
- Pain: can't scale beyond current portfolio because operations consume all time
- Budget for automation: $50-$200/mo

**Tertiary: Growing PM Companies**
- Manage 500-2,000 units
- Growing but can't hire fast enough
- Pain: quality drops as portfolio grows; tenant satisfaction declining
- Budget for automation: $500-$2,000/mo

### 2.3 How Property Managers Spend Their Time

| Activity | % of Time | Hours/Week (40hr) | Automatable? |
|----------|-----------|-------------------|--------------|
| Tenant communication (calls, texts, emails) | 40% | 16 hrs | 80-90% |
| Maintenance coordination | 20% | 8 hrs | 70-80% |
| Administrative paperwork | 15% | 6 hrs | 60-70% |
| Accounting/reporting | 10% | 4 hrs | 50-60% |
| Leasing/showings | 10% | 4 hrs | 40-50% |
| Owner communication | 5% | 2 hrs | 30-40% |

**Key stat: 60% of a PM's time is spent on repetitive tasks that AI can handle.**

### 2.4 Tenant Expectations

| Metric | Value | Source |
|--------|-------|--------|
| Tenants expecting response within 24 hours | 76% | Rentec Direct |
| Tenants preferring text over phone | 59% | Textline |
| Tenants preferring digital over traditional | 72% | Industry survey |
| Tenants preferring chatbot (faster) over human | 69% | GrowthFactor AI |
| SMS open rate | 98% | Industry standard |
| Email open rate | 30% | Industry standard |
| Average maintenance response without automation | 48 hours | Property Meld |

### 2.5 Technology Adoption in PM

| Metric | Value |
|--------|-------|
| Small landlords still using spreadsheets/manual | 40%+ |
| PMs using automated tenant screening | 55% |
| PMs using contactless payments | 82% |
| PMs using AI in maintenance scheduling | 45% |
| PMs reporting tech ROI within 1 year | 68% |
| Decision-makers planning to increase tech spend | 85% |
| Digital penetration for SMB landlords | Below 50% |

---

## 3. Competitive Landscape

### 3.1 Direct Competitors — Detailed Comparison

#### EliseAI (Enterprise AI Platform)
- **Founded:** 2017
- **Funding:** $390M+ total ($250M Series E, Sept 2025, led by a16z)
- **Revenue:** $100M+ ARR (2025)
- **Coverage:** ~1 in 8 US apartments
- **What it does:** Full AI communication platform — leasing, maintenance intake, renewals, delinquency collection, reporting. Handles calls, texts, emails, web chat.
- **Pricing:** Not public. Enterprise contracts. Estimated $3-$8/unit/month based on industry discussions.
- **Min size:** ~1,000+ units (inferred from case studies: Flatz Living 1,100 units, MG Properties 30,000 units)
- **Why it doesn't serve SMBs:** Opaque pricing, sales-driven onboarding, enterprise contract structure, high CAC that can't be amortized on small portfolios, feature complexity exceeds SMB needs
- **Weaknesses (from user reviews):** AI follows predetermined scripts with limited customization. Sometimes fails to loop in managers. Books tours without collecting critical info. Limited flexibility for unique property situations.

#### MagicDoor (AI-Native PM Software)
- **What it does:** Full PM platform with AI built in. Rent collection, tenant screening (AI scores 1-100), lease e-signing, maintenance (AI auto-resolves, escalates to vendors), multilingual communication hub, financial management.
- **Pricing:** Free (10 leases), $25/mo (unlimited leases, most popular), $225/mo (50+ leases, white-glove)
- **Strengths:** Cheapest full-platform option. AI-native, not bolted on. Free tier lowers barrier.
- **Weaknesses:** Requires full platform migration. PM must abandon existing software (Buildium, AppFolio, etc.). Relatively new, limited brand recognition. Unclear how deep the AI actually goes vs. marketing.
- **Key differentiator from us:** MagicDoor IS the PM software. We PLUG INTO existing PM software. This is a fundamental positioning difference — we remove the switching cost entirely.

#### STAN.AI (Communication Chatbot)
- **What it does:** AI chatbot for PM and HOA. Email, voice, SMS, webchat, in-app. Handles maintenance requests, amenity booking, mass notices, document summarization. 130+ languages.
- **Pricing:** Not public ("Lite" and "Plus" tiers, fixed monthly subscription). Must contact sales.
- **Strengths:** Fast onboarding (48 hours). Claims to integrate with every PM system.
- **Weaknesses:** Communication-only — no maintenance COORDINATION (doesn't dispatch vendors, schedule repairs, follow up). No leasing automation. HOA-heavy focus may alienate residential rental managers. Pricing opacity.
- **Key differentiator from us:** STAN answers questions. We answer questions AND coordinate the resulting action (dispatch vendor, schedule repair, send follow-up).

#### Vendoroo AI (Maintenance Coordinator)
- **What it does:** AI maintenance coordination end-to-end. Triage, tenant troubleshooting, vendor selection, scheduling, job completion verification.
- **Pricing:** $3/door/month. Month-to-month.
- **Integrations:** Rent Manager, AppFolio
- **Strengths:** Focused product, clear pricing, no lock-in.
- **Weaknesses:** Maintenance ONLY. Does not handle tenant communication for non-maintenance issues, rent collection, renewals, or general FAQ. Point solution.
- **Key differentiator from us:** Vendoroo is a point solution. We are a full-lifecycle agent covering all repetitive PM tasks.

#### Showdigs (Leasing Automation)
- **What it does:** AI leasing bot, scheduling, secure self-showings (facial recognition), on-demand agent-led showings, listing syndication.
- **Pricing:** $1.20/unit/mo ($120 min = 100-unit minimum). Agent showings $49/tour.
- **Integrations:** AppFolio, Buildium, Propertyware, Yardi
- **Weaknesses:** Leasing/showings ONLY. 100-unit minimum excludes small PMs.

#### Brickwise (YC F2025)
- **What it does:** AI property manager for maintenance. Handles tenant calls 24/7, chases contractors, resolves payments.
- **Pricing:** $32/tenant/mo (annual) or $60/tenant/mo (premium, includes all contractor costs)
- **Funding:** $3M+ (YC F2025)
- **Weaknesses:** 6 months old, ~10 customers worldwide, UK-based. Extremely expensive — $3,200/mo for 100 units on basic tier.

#### Lula (Maintenance Network)
- **What it does:** AI maintenance coordination + nationwide network of 9,000+ vetted vendors. Predictive maintenance, automated triage.
- **Pricing:** No subscription. Revenue from margin on maintenance services.
- **Coverage:** 350,000+ rental properties
- **Integrations:** Rent Manager, AppFolio

### 3.2 Human VA Services (Non-AI Alternatives)

| Provider | Price | Model |
|----------|-------|-------|
| BruntWork | $4-$8/hr | Offshore Philippines |
| ShoreAgents | $1,191/mo | Full-time dedicated VA, Philippines |
| MyOutDesk | $1,988/mo | Full-time dedicated VA |
| VPM Solutions | Free platform | Marketplace, pay VA directly |
| Virtual Latinos | ~$8-$15/hr | Latin America-based |

**VAs vs. AI Agent:**
- VAs: Not 24/7, inconsistent quality, training needed, cost scales linearly, handle nuance better
- AI Agent: 24/7, instant, consistent, cost is flat, struggles with emotional/complex situations
- Our model: AI handles 80-90%, escalates the 10-20% edge cases to PM

### 3.3 Existing PM Software (Where Our Users Already Live)

| Software | Market Share | SMB Fit | API | Monthly Cost |
|----------|-------------|---------|-----|-------------|
| AppFolio | 12.02% | Mid-market (50+) | No open API | $1.40+/unit |
| Buildium | 3.37% | SMB-focused | Open API (Premium) | $58-$375 |
| Propertyware | ~3-5% | Single-family | Open API | Varies |
| Rent Manager | Significant | Mid-market | API available | Varies |
| RentRedi | Growing | Small (1-50) | Limited/no API | $12-$30 |
| TenantCloud | Growing | Small (1-100) | Limited/no API | Free-$100 |
| TurboTenant | Growing | Small (free tier) | Limited/no API | Free-$149/yr |

### 3.4 Competitive Positioning Map

```
                    HIGH TICKET ($1,000+/mo)
                           │
                 Brickwise  │  EliseAI
                           │
                           │
    POINT SOLUTION ────────┼──────── FULL LIFECYCLE
                           │
         Vendoroo          │
         Showdigs          │  ★ OUR PRODUCT ★
         STAN.AI           │  ($99-$349/mo)
                           │
                    LOW TICKET ($100-$300/mo)
```

### 3.5 Identified Market Gaps

**Gap 1: No affordable full-lifecycle AI agent for SMBs**
EliseAI does it all but costs thousands. Everything else is a point solution. No one combines tenant communication + maintenance coordination + rent reminders at $100-$300/mo.

**Gap 2: Point solutions require stitching 3-4 tools**
A PM wanting full AI coverage needs: Showdigs (leasing) + STAN.AI (communication) + Vendoroo (maintenance) + manual processes (renewals/rent). Three vendors, three logins, three bills.

**Gap 3: SMS-first AI agent is missing**
98% SMS open rate vs 30% email. Tenants prefer text. Most tools are web-chat-first or app-first.

**Gap 4: Self-serve pricing is rare**
EliseAI, STAN.AI require sales calls. Small PMs want to see a price, sign up, and start.

**Gap 5: Integration with SMB PM software**
Buildium has an open API. AppFolio does not. Smallest landlords on RentRedi/TenantCloud have no integration path. An agent working via SMS relay (no API needed) can reach everyone.

**Gap 6: Price point gap**
Between $1,200-$2,000/mo VAs and enterprise AI, there's no option at $100-$300/mo.

---

## 4. Product Vision & Strategy

### 4.1 Vision Statement

Become the default AI operating layer for small and mid-size property managers — handling every repetitive tenant interaction so PMs can focus on growing their portfolio.

### 4.2 Strategy: Plug-In, Not Platform

We are NOT building a property management platform. We are building an AI agent layer that sits ON TOP of whatever the PM already uses. This is critical:

- **Zero switching cost** — PM keeps Buildium, TenantCloud, spreadsheets, whatever
- **Faster adoption** — no migration, no data import, no training on new software
- **Wider TAM** — we can serve PMs regardless of their current software
- **Lower churn** — we add value to their existing stack, not compete with it

### 4.3 Product Principles

1. **SMS-first.** Tenants communicate via text. Build there first, add channels later.
2. **Does the work, not just tracks it.** The agent coordinates maintenance, doesn't just create a ticket.
3. **Human-in-the-loop by design.** PM approves high-cost decisions. Agent handles the rest.
4. **48-hour time-to-value.** PM signs up today, tenants are texting the agent tomorrow.
5. **Transparent pricing.** No sales calls. No hidden fees. Price on the website.

### 4.4 Product Phasing

| Phase | Timeline | What Ships |
|-------|----------|-----------|
| **Phase 1: MVP** | Weeks 1-3 | Tenant FAQ bot + maintenance intake via SMS. PM dashboard. |
| **Phase 2: Coordination** | Weeks 4-8 | Full maintenance coordination (vendor dispatch, scheduling, follow-ups). Rent reminders. |
| **Phase 3: Intelligence** | Months 3-6 | Analytics, pattern detection, proactive maintenance alerts, owner reports. |
| **Phase 4: Integrations** | Months 4-8 | Buildium API, AppFolio workarounds, Propertyware API. |
| **Phase 5: Expansion** | Months 6-12 | Leasing automation, lease renewal management, multi-language support. |

---

## 5. PRD: MVP (Phase 1)

### 5.1 Overview

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-001 |
| **Feature** | MVP — Tenant Communication AI Agent |
| **Priority** | P0 (Must have for launch) |
| **Timeline** | 3 weeks |
| **Dependencies** | Twilio account, Claude API access, Firebase project |

### 5.2 Problem Statement

Property managers spend ~16 hours per week answering tenant calls, texts, and emails. 80% of these communications are repetitive: "When is rent due?", "What's the pet policy?", "My faucet is leaking", "Can I have a parking spot?" The PM answers the same questions hundreds of times per month.

### 5.3 Solution

An AI agent accessible via SMS that:
1. Receives tenant text messages 24/7
2. Identifies the tenant and their unit from the phone number
3. Classifies the message (maintenance request, policy question, rent inquiry, complaint, emergency)
4. Responds immediately with accurate information from the property's knowledge base
5. Escalates to the PM when the agent cannot handle the request
6. Logs all conversations for the PM to review

### 5.4 User Stories

**Tenant User Stories:**

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| T-01 | Tenant | Text a number and get an instant answer about my lease terms | I don't have to wait for office hours or a callback |
| T-02 | Tenant | Report a maintenance issue via text with photos | My issue gets addressed without phone tag |
| T-03 | Tenant | Ask when rent is due and how to pay | I can pay on time without digging through paperwork |
| T-04 | Tenant | Get confirmation that my request was received | I know someone is handling it |
| T-05 | Tenant | Reach a human when the AI can't help | I'm not stuck in an AI loop |

**Property Manager User Stories:**

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| PM-01 | PM | See all tenant conversations in one dashboard | I know what's happening across all properties |
| PM-02 | PM | Set up property rules and FAQs that the AI uses | Tenants get accurate, property-specific answers |
| PM-03 | PM | Get notified only when the AI can't handle something | I'm not interrupted for routine questions |
| PM-04 | PM | Review and respond to escalated conversations | I handle only the exceptions |
| PM-05 | PM | Onboard a new property in under 30 minutes | I can start quickly without complex setup |
| PM-06 | PM | See analytics on message volume and types | I understand tenant needs and can improve |

### 5.5 Functional Requirements

#### 5.5.1 SMS Gateway

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| SMS-01 | System receives inbound SMS via Twilio webhook | P0 |
| SMS-02 | System sends outbound SMS replies via Twilio API | P0 |
| SMS-03 | Each property gets a unique local phone number | P0 |
| SMS-04 | MMS support (tenant can send photos) | P0 |
| SMS-05 | System handles SMS delivery failures gracefully (retry, log, alert) | P1 |
| SMS-06 | Opt-out handling: tenant texts STOP, system stops messaging | P0 (legal requirement) |

#### 5.5.2 Tenant Identification

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| TID-01 | System matches inbound phone number to tenant record | P0 |
| TID-02 | If phone number not recognized, system asks for name and unit number | P0 |
| TID-03 | System stores tenant-phone mapping after first identification | P0 |
| TID-04 | PM can manually add/update tenant phone numbers | P0 |

#### 5.5.3 Message Classification

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| CLS-01 | System classifies each message into: maintenance_request, policy_question, rent_inquiry, complaint, emergency, general, unknown | P0 |
| CLS-02 | Emergency detection triggers immediate PM notification (SMS + email) | P0 |
| CLS-03 | Classification is logged with confidence score | P1 |
| CLS-04 | Unknown/low-confidence messages are escalated to PM | P0 |

**Emergency keywords/patterns:**
- Fire, smoke, gas leak, flooding, water everywhere, broken pipe burst, no heat (in winter), break-in, someone broke in, electrical sparking, carbon monoxide, CO detector, ceiling collapse, sewage backup

#### 5.5.4 AI Response Engine

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| AI-01 | AI generates responses using property-specific knowledge base (lease terms, policies, amenities, rules) | P0 |
| AI-02 | AI maintains conversation context within a thread (remembers previous messages) | P0 |
| AI-03 | AI responds in under 10 seconds for 95% of messages | P0 |
| AI-04 | AI never fabricates information — if unsure, says "Let me check with your property manager" and escalates | P0 |
| AI-05 | AI uses a professional but friendly tone, matching the PM's communication style | P1 |
| AI-06 | AI detects language and responds in the tenant's language (English/Spanish minimum) | P1 |
| AI-07 | AI rate-limits responses to prevent abuse (max 20 messages per tenant per hour) | P0 |

#### 5.5.5 Escalation

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| ESC-01 | Tenant can request a human at any time by texting "HELP" or "speak to manager" | P0 |
| ESC-02 | AI escalates automatically when: confidence is low, topic is sensitive (legal, eviction), emergency detected, tenant expresses frustration/anger | P0 |
| ESC-03 | PM receives escalation via SMS and/or email with conversation context | P0 |
| ESC-04 | PM can reply directly from dashboard; response is sent to tenant via SMS | P0 |
| ESC-05 | PM can "take over" a conversation, disabling AI for that thread | P1 |

### 5.6 Non-Functional Requirements

| Req ID | Requirement | Target |
|--------|-------------|--------|
| NFR-01 | System uptime | 99.9% |
| NFR-02 | Message processing latency | < 10 seconds (p95) |
| NFR-03 | Concurrent tenants supported | 1,000+ |
| NFR-04 | Data encryption at rest | AES-256 |
| NFR-05 | Data encryption in transit | TLS 1.3 |
| NFR-06 | Message retention | 2 years minimum |
| NFR-07 | TCPA compliance (SMS consent) | Required |
| NFR-08 | SOC 2 Type I | Target within 12 months |

### 5.7 Out of Scope (MVP)

- Maintenance vendor dispatch and coordination (Phase 2)
- Rent payment processing (handled by existing PM software)
- Leasing/prospect communication
- Voice calls (AI answering phone)
- Integration with PM software APIs
- Multi-property dashboards with role-based access
- White-labeling
- Mobile app for PMs

### 5.8 Success Metrics (MVP)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Messages handled without escalation | > 70% | Messages auto-resolved / total messages |
| Average response time | < 8 seconds | Time from inbound SMS to outbound reply |
| Tenant satisfaction | > 4.0/5.0 | Post-conversation survey (optional) |
| PM time saved per week | > 8 hours | Self-reported by PM |
| Pilot-to-paid conversion | > 50% | Free trial users who convert to paid |

---

## 6. PRD: Maintenance Coordination Agent

### 6.1 Overview

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-002 |
| **Feature** | Maintenance Coordination AI Agent |
| **Priority** | P0 (Phase 2 — ships week 4-8) |
| **Dependencies** | PRD-001 (MVP must be live) |

### 6.2 Problem Statement

Maintenance coordination is the #2 time sink for PMs (~8 hours/week). The current process:

1. Tenant reports issue (phone/text/email)
2. PM asks clarifying questions (what, where, how bad, photos?)
3. PM determines urgency and trade needed (plumber, electrician, handyman)
4. PM calls/texts 2-3 vendors to find availability
5. PM coordinates schedule between tenant and vendor
6. PM follows up with vendor for status
7. PM updates tenant on status
8. PM verifies work completion
9. PM processes vendor invoice

**This takes 5-15 back-and-forth messages and 2-3 phone calls per work order. Average resolution: 48 hours.**

### 6.3 Solution

The AI agent handles steps 2-8 automatically:

```
Tenant: "My kitchen sink is leaking badly"
Agent:  "I'm sorry about that! I need a few details to get this fixed quickly:
         1. Is water actively pooling or spreading? (emergency check)
         2. Can you send a photo of the leak?
         3. Is under the sink or at the faucet?"
Tenant: [sends photo] "Under the sink, it's dripping steadily"
Agent:  "Thanks. I'm classifying this as urgent (not emergency). I'm reaching out
         to [PM's preferred plumber] to schedule a repair. I'll text you back
         with available times within the hour."
         [Agent texts plumber from vendor list]
Agent → Plumber: "Work order #347 at [Address], Unit 4B. Kitchen sink leak
         (under cabinet, steady drip). Tenant available [default hours].
         Can you take this today or tomorrow?"
Plumber: "I can do tomorrow 2-4pm"
Agent → Tenant: "Good news — [Plumber Name] can come tomorrow between 2-4 PM.
         Does that work for you?"
Tenant: "Yes perfect"
Agent → Plumber: "Confirmed. Tomorrow 2-4 PM. Tenant: [Name], [Phone].
         Access: [instructions from property data]"
Agent → PM: [Dashboard notification] "Work order #347 created. Plumber scheduled
         for tomorrow 2-4 PM. Estimated cost: under $300 (auto-approved per your settings)."
         [Next day, 5 PM]
Agent → Tenant: "Hi! Just checking — did the plumber come today and fix the leak?"
Tenant: "Yes all good now, thanks!"
Agent: "Great! Work order #347 marked as complete. If anything comes up, just text."
Agent → PM: [Dashboard update] "Work order #347 completed."
```

### 6.4 Functional Requirements

#### 6.4.1 Maintenance Intake

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| MNT-01 | AI collects issue description, location in unit, urgency indicators, and photos via SMS conversation | P0 |
| MNT-02 | AI classifies urgency: emergency (immediate PM alert + 24/7 vendor), urgent (same-day/next-day), routine (within 1 week), cosmetic (scheduled) | P0 |
| MNT-03 | AI identifies trade needed: plumbing, electrical, HVAC, appliance, general handyman, pest control, locksmith | P0 |
| MNT-04 | AI creates work order with all collected details | P0 |
| MNT-05 | AI stores photos attached to work order | P0 |

#### 6.4.2 Vendor Management

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| VND-01 | PM maintains a vendor list: name, trade(s), phone, email, hourly rate, availability preferences, service area | P0 |
| VND-02 | AI selects vendor based on: trade match, availability, PM's preferred vendor ranking, past performance | P0 |
| VND-03 | AI contacts vendor via SMS with work order details | P0 |
| VND-04 | If vendor doesn't respond within 2 hours, AI contacts next vendor on list | P0 |
| VND-05 | AI negotiates scheduling between tenant and vendor | P0 |
| VND-06 | Vendor can confirm, decline, or propose alternative time via SMS | P0 |

#### 6.4.3 Approval Workflow

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| APR-01 | PM sets auto-approval threshold (e.g., auto-approve repairs under $300) | P0 |
| APR-02 | Work orders above threshold require PM approval via dashboard or SMS | P0 |
| APR-03 | PM can approve/reject with one tap or one text reply | P0 |
| APR-04 | If PM doesn't respond within configurable window, agent sends reminder | P1 |

#### 6.4.4 Follow-Up & Completion

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FUP-01 | Agent texts tenant after scheduled repair to confirm completion | P0 |
| FUP-02 | Agent texts vendor if tenant reports issue not resolved | P0 |
| FUP-03 | Work order status updates visible on PM dashboard in real-time | P0 |
| FUP-04 | Agent sends weekly maintenance summary to PM (open orders, completed, costs) | P1 |

### 6.5 Work Order States

```
REPORTED → TRIAGED → VENDOR_CONTACTED → SCHEDULED → IN_PROGRESS → COMPLETED
                 ↘                               ↗
              ESCALATED_TO_PM → PM_APPROVED/REJECTED
                                      ↓
                               VENDOR_CONTACTED
```

### 6.6 Success Metrics

| Metric | Target |
|--------|--------|
| Average time from report to vendor scheduled | < 4 hours (vs. 48 hours industry avg) |
| Work orders fully handled without PM intervention | > 60% |
| Tenant satisfaction with maintenance process | > 4.2/5.0 |
| Vendor response rate (first contact) | > 70% |

---

## 7. PRD: Tenant FAQ & Policy Agent

### 7.1 Overview

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-003 |
| **Feature** | Tenant FAQ & Policy Knowledge Base Agent |
| **Priority** | P0 (ships with MVP) |
| **Dependencies** | None |

### 7.2 Problem Statement

PMs answer the same 20-30 questions hundreds of times per month: pet policy, parking rules, rent due date, guest policy, noise hours, package delivery, move-out procedures, security deposit terms. Each answer exists in the lease or property rules but tenants don't read those documents.

### 7.3 Knowledge Base Structure

The PM populates these during onboarding. AI uses them as ground truth.

```
Property Knowledge Base
├── Property Info
│   ├── Address, units, type (apartment, SFH, condo)
│   ├── Office hours, emergency contact
│   ├── Amenities (pool, gym, laundry, parking)
│   └── Access instructions (gate codes, key fobs, lockboxes)
│
├── Lease Terms (per-unit or property-wide defaults)
│   ├── Rent amount, due date, grace period, late fee
│   ├── Lease start/end dates
│   ├── Security deposit amount and terms
│   └── Move-out notice requirements
│
├── Policies
│   ├── Pet policy (allowed breeds, weight limits, pet deposit, pet rent)
│   ├── Parking (assigned spots, guest parking, towing policy)
│   ├── Noise/quiet hours
│   ├── Guest/subletting policy
│   ├── Smoking policy
│   ├── Trash/recycling schedule and rules
│   ├── Package delivery instructions
│   ├── Modification/alteration policy (painting, shelves, etc.)
│   └── Common area usage rules
│
├── Procedures
│   ├── How to pay rent (methods, portal URL)
│   ├── How to submit maintenance request
│   ├── Move-in checklist
│   ├── Move-out checklist and inspection process
│   ├── Lock-out procedure
│   └── Emergency procedures (fire, flood, gas)
│
└── Vendor Directory (for maintenance agent)
    ├── Preferred vendors by trade
    └── Emergency contacts (24/7 plumber, electrician)
```

### 7.4 Functional Requirements

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FAQ-01 | PM enters property data via structured forms during onboarding | P0 |
| FAQ-02 | PM can upload lease PDF; system extracts key terms (Claude API) | P1 |
| FAQ-03 | AI answers questions ONLY from the knowledge base — never fabricates | P0 |
| FAQ-04 | If answer is not in knowledge base, AI says "I don't have that information — let me check with your property manager" and escalates | P0 |
| FAQ-05 | PM can add/edit/delete knowledge base entries anytime | P0 |
| FAQ-06 | System suggests common FAQ entries during onboarding that PM confirms/customizes | P1 |
| FAQ-07 | AI cites source when answering (e.g., "Per your lease agreement, rent is due on the 1st") | P1 |

### 7.5 Common Questions the Agent Handles (Day 1)

| Category | Example Questions |
|----------|------------------|
| Rent | "When is rent due?" "How do I pay rent?" "What's the late fee?" "Can I pay with credit card?" |
| Maintenance | "How do I report a maintenance issue?" "Who do I call for emergencies?" |
| Policies | "Can I have a dog?" "Where do I park?" "Can my friend stay for a week?" "Can I paint the walls?" |
| Amenities | "What are the pool hours?" "Where is the gym?" "How does laundry work?" |
| Move-in/out | "What do I need to do before moving out?" "When do I get my deposit back?" |
| General | "What are office hours?" "What's the gate code?" "Where does my mail go?" |

---

## 8. PRD: Rent Collection & Reminders Agent

### 8.1 Overview

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-004 |
| **Feature** | Automated Rent Reminders & Late Follow-Up |
| **Priority** | P1 (Phase 2) |
| **Dependencies** | PRD-001 |

### 8.2 Problem Statement

Chasing late rent is emotionally draining and time-consuming. PMs send manual reminders, make awkward phone calls, and track who has/hasn't paid across spreadsheets. This is one of the most disliked aspects of property management.

### 8.3 Solution

Automated SMS sequences for rent reminders and late payment follow-ups. The agent does NOT process payments — it reminds and directs tenants to the PM's existing payment method.

### 8.4 Message Sequences

#### Pre-Due Date Sequence

| Day | Message |
|-----|---------|
| 3 days before due | "Hi [Name], this is a friendly reminder that your rent of $[amount] is due on [date]. Pay at [payment URL/method]. Questions? Just text back!" |

#### Grace Period Sequence

| Day | Message |
|-----|---------|
| 1 day after due | "Hi [Name], just a heads up — rent was due yesterday. If you've already paid, ignore this! If not, you can pay at [method] before [grace period end] to avoid a late fee." |
| Grace period end | "Hi [Name], the grace period for rent ends today. A $[late fee] late fee will apply after today. Pay at [method] or text me if you need to discuss options with your property manager." |

#### Late Payment Sequence

| Day | Message |
|-----|---------|
| 3 days late | "Hi [Name], your rent of $[amount] + $[fee] late fee is overdue. Please pay at [method]. If you're experiencing difficulties, text back and I'll connect you with your property manager to discuss options." |
| 7 days late | [Escalate to PM for manual handling — agent stops automated messages] |

### 8.5 Functional Requirements

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| RNT-01 | PM configures rent amount, due date, grace period, and late fee per unit | P0 |
| RNT-02 | System sends pre-due reminder via SMS | P0 |
| RNT-03 | PM can manually mark rent as "paid" to stop reminder sequence | P0 |
| RNT-04 | If tenant replies to a rent reminder, AI handles the conversation (directs to payment method, answers questions, escalates if needed) | P0 |
| RNT-05 | PM can customize message templates | P1 |
| RNT-06 | PM can opt specific tenants out of reminders | P1 |
| RNT-07 | System does NOT process payments — only reminds and directs | P0 |
| RNT-08 | Escalate to PM after configurable number of days late (default: 7) | P0 |
| RNT-09 | Monthly rent collection summary sent to PM (who paid, who's late, total collected vs. expected) | P1 |

### 8.6 Compliance

- All rent-related SMS must comply with TCPA (opt-in/opt-out)
- Messages must not constitute legal notices (those must follow state-specific delivery requirements)
- Agent must never threaten eviction — only the PM can initiate legal proceedings
- Agent must offer to connect tenant with PM if tenant expresses financial hardship

---

## 9. PRD: PM Dashboard

### 9.1 Overview

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-005 |
| **Feature** | Property Manager Web Dashboard |
| **Priority** | P0 (ships with MVP) |
| **Dependencies** | PRD-001 |

### 9.2 Problem Statement

The PM needs visibility into what the AI agent is doing, the ability to intervene when needed, and a central place to manage properties, tenants, vendors, and settings.

### 9.3 Dashboard Sections

#### 9.3.1 Inbox / Conversations

The primary view. Shows all tenant conversations in real-time.

```
┌──────────────────────────────────────────────────────────────────┐
│  INBOX                                          Filter ▼  Search │
├──────────────────┬───────────────────────────────────────────────┤
│                  │                                               │
│  ● Maria S. 4B  │  Maria Santos — Unit 4B                      │
│  Maintenance     │  123 Oak Street                               │
│  2 min ago       │                                               │
│                  │  Today, 3:45 PM                               │
│  ○ John D. 2A   │  Maria: My kitchen sink is leaking under      │
│  Rent question   │         the cabinet                           │
│  1 hr ago        │                                               │
│                  │  Agent: I'm sorry about that! Can you send    │
│  ○ Lisa K. 7C   │  a photo and let me know — is water actively  │
│  Policy question │  pooling on the floor?                        │
│  3 hrs ago       │                                               │
│                  │  Maria: [photo] No pooling, just dripping     │
│  ⚠ Ahmed R. 1A  │                                               │
│  ESCALATED       │  Agent: Thanks. I've classified this as       │
│  5 hrs ago       │  urgent. Contacting your preferred plumber    │
│                  │  now...                                       │
│                  │                                               │
│                  │  ┌─────────────────────────────────────────┐  │
│                  │  │ Type a reply... (sends as PM, not agent)│  │
│                  │  └─────────────────────────────────────────┘  │
└──────────────────┴───────────────────────────────────────────────┘
```

**Requirements:**

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| DSH-01 | List all conversations sorted by most recent | P0 |
| DSH-02 | Visual indicator for: AI handling, escalated, PM responded, emergency | P0 |
| DSH-03 | PM can click into any conversation and read full history | P0 |
| DSH-04 | PM can type a reply that sends to tenant via SMS (attributed to PM, not agent) | P0 |
| DSH-05 | PM can "take over" conversation (disables AI for that thread) | P1 |
| DSH-06 | PM can "hand back" conversation to AI | P1 |
| DSH-07 | Filter by: property, status (active/resolved/escalated), type (maintenance/rent/policy) | P0 |
| DSH-08 | Search conversations by tenant name, unit, or keyword | P1 |
| DSH-09 | Real-time updates (new messages appear without refresh) | P0 |

#### 9.3.2 Work Orders

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| WO-01 | List all work orders with status, property, unit, trade, vendor, dates | P0 |
| WO-02 | Filter by status: open, scheduled, in progress, completed, cancelled | P0 |
| WO-03 | Click into work order to see full details: tenant report, photos, vendor communication, timeline | P0 |
| WO-04 | Approve/reject pending work orders with one click | P0 |
| WO-05 | Manually create work order (for issues reported outside SMS) | P1 |

#### 9.3.3 Properties & Units

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| PRP-01 | Add/edit/delete properties | P0 |
| PRP-02 | Add/edit/delete units within a property | P0 |
| PRP-03 | Each property shows: address, unit count, assigned phone number, tenant count | P0 |
| PRP-04 | Each unit shows: tenant name, phone, lease dates, rent amount, notes | P0 |

#### 9.3.4 Tenants

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| TNT-01 | Tenant directory: name, unit, phone, email, lease dates, rent status | P0 |
| TNT-02 | Click tenant to see: conversation history, work orders, rent payment status | P0 |
| TNT-03 | Add/edit/remove tenants | P0 |
| TNT-04 | Bulk import tenants via CSV | P1 |

#### 9.3.5 Vendors

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| VDR-01 | Vendor directory: name, company, trade(s), phone, email, rate, notes | P0 |
| VDR-02 | Drag-to-reorder vendor preference per trade (PM's preferred vendor is contacted first) | P1 |
| VDR-03 | Vendor performance: jobs completed, average response time, tenant ratings | P2 |

#### 9.3.6 Knowledge Base

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| KB-01 | Edit property policies (pet, parking, noise, etc.) via structured forms | P0 |
| KB-02 | Edit lease terms (rent, dates, fees) per unit | P0 |
| KB-03 | Add custom FAQ entries ("Q: ... A: ...") | P1 |
| KB-04 | Upload documents (lease PDF, house rules) for AI reference | P1 |

#### 9.3.7 Settings

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| SET-01 | Notification preferences: SMS, email, or both | P0 |
| SET-02 | Auto-approval threshold for maintenance costs | P0 |
| SET-03 | Business hours (agent mentions these when relevant) | P0 |
| SET-04 | Escalation rules (when should AI escalate?) | P1 |
| SET-05 | Rent reminder schedule customization | P1 |

#### 9.3.8 Analytics (Phase 3)

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| ANL-01 | Message volume over time (daily/weekly/monthly) | P2 |
| ANL-02 | Breakdown by type (maintenance, rent, policy, other) | P2 |
| ANL-03 | Resolution rate (handled by AI vs. escalated) | P2 |
| ANL-04 | Average response time | P2 |
| ANL-05 | Maintenance costs over time | P2 |
| ANL-06 | Tenant satisfaction scores | P2 |

### 9.4 Technical Requirements

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| DTECH-01 | Responsive web design (works on mobile/tablet/desktop) | P0 |
| DTECH-02 | Real-time updates via Firestore listeners | P0 |
| DTECH-03 | Authentication via Firebase Auth (email + password, Google SSO) | P0 |
| DTECH-04 | Role-based access: Owner (full access), Manager (property-scoped), Staff (read + reply) | P2 |

---

## 10. PRD: Onboarding & Self-Serve Signup

### 10.1 Overview

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-006 |
| **Feature** | Self-Serve Signup & 48-Hour Onboarding |
| **Priority** | P0 |
| **Dependencies** | PRD-005 (Dashboard) |

### 10.2 Onboarding Flow

```
Step 1: Sign Up (2 min)
├── Email, password, company name
├── Select plan (Starter / Pro / Growth)
├── Payment info (Stripe) — or "Start 14-day free trial"
└── → Account created, enter dashboard

Step 2: Add First Property (5 min)
├── Property name, address, type, unit count
├── Upload property photo (optional)
└── System provisions a Twilio phone number for this property

Step 3: Add Units & Tenants (10-15 min)
├── Add units manually or bulk CSV import
├── Per unit: unit number, tenant name, phone, email, rent amount, lease dates
└── System sends opt-in SMS to each tenant: "Hi [Name], your property
    manager has set up a new communication line for [Property Name].
    Text this number anytime for maintenance, questions, or rent info.
    Reply YES to opt in."

Step 4: Set Up Knowledge Base (10-15 min)
├── Guided wizard with common policy categories
│   ├── Pet policy → select: allowed/not allowed, then details
│   ├── Parking → select: assigned/first-come, then details
│   ├── Quiet hours → enter times
│   ├── Rent → confirm due date, grace period, late fee, payment method
│   └── Maintenance → emergency contact number
├── Upload lease PDF (optional — AI extracts key terms)
└── Add custom FAQ entries (optional)

Step 5: Add Vendors (5 min)
├── Add at least 1 general handyman
├── Add plumber, electrician, HVAC (recommended)
├── Per vendor: name, phone, trade(s), rate, notes
└── Set auto-approval threshold

Step 6: Go Live (1 min)
├── Review summary
├── Send welcome SMS to all opted-in tenants
└── Agent is now live and receiving messages
```

**Total onboarding time: 30-45 minutes.**

### 10.3 Requirements

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| ONB-01 | PM can complete full onboarding without speaking to a human | P0 |
| ONB-02 | Progress indicator shows completion percentage | P0 |
| ONB-03 | PM can save progress and return later | P0 |
| ONB-04 | Tenant opt-in SMS is sent automatically upon adding tenant phone numbers | P0 |
| ONB-05 | System provisions Twilio number automatically (local area code matching property address) | P0 |
| ONB-06 | CSV template downloadable for bulk tenant import | P1 |
| ONB-07 | Knowledge base wizard pre-fills common policies that PM confirms/customizes | P1 |
| ONB-08 | "Test mode" — PM can text the number themselves to test before going live | P0 |

---

## 11. Technical Architecture

### 11.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                           │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  Twilio   │  │  Claude  │  │  Stripe  │  │  SendGrid/Resend │  │
│  │  SMS/MMS  │  │   API    │  │ Billing  │  │  Email Notifs    │  │
│  └────┬──┬──┘  └────┬─────┘  └────┬─────┘  └───────┬──────────┘  │
│       │  │          │             │                  │              │
└───────┼──┼──────────┼─────────────┼──────────────────┼──────────────┘
        │  │          │             │                  │
        ▼  │          │             │                  │
┌──────────┼──────────┼─────────────┼──────────────────┼──────────────┐
│       │  │          │             │                  │    FIREBASE  │
│  ┌────┴──┴──────────┴─────────────┴──────────────────┴───────────┐  │
│  │                    Cloud Functions (TypeScript)                │  │
│  │                                                               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐  │  │
│  │  │   Webhook    │  │  Message     │  │   Scheduled          │  │  │
│  │  │   Handler    │  │  Processor   │  │   Functions          │  │  │
│  │  │  (Twilio     │  │  (Classify,  │  │  (Rent reminders,   │  │  │
│  │  │   inbound)   │  │   Route,     │  │   follow-ups,       │  │  │
│  │  │              │  │   Respond)   │  │   vendor check-ins) │  │  │
│  │  └──────┬───────┘  └──────┬──────┘  └──────────┬───────────┘  │  │
│  │         │                 │                     │              │  │
│  │         ▼                 ▼                     ▼              │  │
│  │  ┌────────────────────────────────────────────────────────┐   │  │
│  │  │                   Agent Orchestrator                    │   │  │
│  │  │                                                        │   │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │  │
│  │  │  │   FAQ    │  │  Maint.  │  │   Rent   │            │   │  │
│  │  │  │  Agent   │  │  Agent   │  │  Agent   │            │   │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘            │   │  │
│  │  │         │              │             │                 │   │  │
│  │  │         └──────────────┼─────────────┘                │   │  │
│  │  │                        ▼                               │   │  │
│  │  │              ┌──────────────────┐                      │   │  │
│  │  │              │  Claude API Call │                      │   │  │
│  │  │              │  (with context)  │                      │   │  │
│  │  │              └──────────────────┘                      │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                        Firestore                              │  │
│  │                                                               │  │
│  │  organizations/    properties/    tenants/    conversations/  │  │
│  │  units/            vendors/       workOrders/ messages/       │  │
│  │  knowledgeBase/    rentSchedules/                             │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Firebase Auth                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Cloud Storage                               │  │
│  │              (MMS photos, lease PDFs, documents)               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                    │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Next.js Dashboard (Vercel)                        │  │
│  │                                                               │  │
│  │  Auth → Firestore listeners → Real-time UI                   │  │
│  │  Pages: Inbox, Work Orders, Properties, Tenants, Vendors,    │  │
│  │         Knowledge Base, Settings, Analytics, Billing          │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Marketing Site (same Next.js app)                │  │
│  │                                                               │  │
│  │  Landing page, Pricing, Features, Sign Up, Blog              │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 11.2 Tech Stack Details

| Layer | Technology | Why |
|-------|-----------|-----|
| **Backend** | Firebase Cloud Functions (TypeScript) | You already know it. Serverless. Scales automatically. Pay-per-use. |
| **Database** | Firestore | Real-time listeners for dashboard. Scales. No server to manage. |
| **Auth** | Firebase Authentication | Email/password + Google SSO. Free tier covers needs. |
| **File Storage** | Firebase Cloud Storage | MMS photos, lease PDFs. Cheap, scalable. |
| **SMS/MMS** | Twilio Programmable Messaging | Industry standard. $0.0079/SMS, $0.02/MMS. Phone number provisioning API. |
| **AI** | Claude API (Anthropic) | Sonnet for fast classification/FAQ. Opus for complex maintenance reasoning. |
| **Frontend** | Next.js 14+ (App Router) | SSR for marketing pages (SEO), client-side for dashboard (real-time). |
| **Hosting** | Vercel | Free tier. Edge network. Integrates with Next.js. |
| **Payments** | Stripe | Subscription billing. Self-serve checkout. Webhooks for lifecycle events. |
| **Email** | Resend or SendGrid | Transactional emails (escalation notifications, receipts, onboarding). |
| **Monitoring** | Firebase Crashlytics + Cloud Logging | Error tracking, function logs. |
| **Scheduling** | Cloud Scheduler + Pub/Sub | Cron jobs for rent reminders, follow-ups, vendor check-ins. |

### 11.3 Cost Estimates (Per Client Per Month)

| Service | Estimated Cost | Assumptions |
|---------|---------------|-------------|
| Twilio SMS | $3-$8 | ~400-1,000 messages/mo |
| Twilio Phone Number | $1.15 | 1 number per property |
| Claude API | $2-$5 | ~200-500 API calls/mo (Sonnet) |
| Firebase (Functions + Firestore) | $1-$3 | Shared across clients |
| Vercel | $0 | Free tier (until very large scale) |
| Stripe fees | 2.9% + $0.30 | On subscription payment |
| **Total COGS per client** | **~$8-$18/mo** | |
| **At $199/mo ticket** | **~$181-$191 gross profit** | **91-96% gross margin** |

### 11.4 Message Processing Flow

```
1. Tenant sends SMS to Twilio number
          │
          ▼
2. Twilio POSTs webhook to Cloud Function endpoint
   Payload: { From, To, Body, MediaUrl[], MessageSid }
          │
          ▼
3. Webhook Handler:
   a. Validate Twilio signature (security)
   b. Look up organization by Twilio number (To)
   c. Look up tenant by phone number (From)
   d. If unknown number → ask for identification
   e. Download MMS attachments if present → Cloud Storage
   f. Create message document in Firestore
   g. Pass to Message Processor
          │
          ▼
4. Message Processor:
   a. Load conversation history (last 20 messages)
   b. Load tenant context (unit, lease, active work orders)
   c. Load property knowledge base
   d. Determine agent type needed (classifier prompt):
      - maintenance_request → Maintenance Agent
      - policy_question → FAQ Agent
      - rent_inquiry → Rent Agent
      - emergency → IMMEDIATE PM notification + Emergency response
      - complaint → Escalation check + appropriate agent
      - unknown → Escalation to PM
          │
          ▼
5. Specialized Agent:
   a. Constructs prompt with:
      - System prompt (agent role, rules, tone)
      - Property context (knowledge base, policies)
      - Tenant context (name, unit, lease info)
      - Conversation history
      - Current message
   b. Calls Claude API
   c. Receives structured response:
      {
        reply: "SMS text to send to tenant",
        action: "create_work_order" | "escalate" | "schedule_reminder" | null,
        actionData: { ... },
        confidence: 0.0-1.0
      }
          │
          ▼
6. Action Handler:
   a. If confidence < 0.7 → escalate to PM
   b. If action = "create_work_order" → create in Firestore, notify PM
   c. If action = "escalate" → notify PM via SMS + email
   d. Send reply SMS via Twilio
   e. Store agent response in Firestore (message document)
   f. Update conversation status
```

---

## 12. Data Model

### 12.1 Firestore Collections

```
organizations/{orgId}
├── name: string
├── ownerUid: string (Firebase Auth UID)
├── plan: "starter" | "pro" | "growth"
├── stripeCustomerId: string
├── stripeSubscriptionId: string
├── createdAt: timestamp
├── settings: {
│     autoApprovalThreshold: number (dollars),
│     businessHours: { start: "09:00", end: "17:00", timezone: "America/New_York" },
│     escalationEmail: string,
│     escalationPhone: string,
│     notificationPreferences: { sms: boolean, email: boolean }
│   }
│
├── properties/{propertyId}
│   ├── name: string
│   ├── address: { street, city, state, zip }
│   ├── type: "apartment" | "single_family" | "condo" | "townhouse"
│   ├── twilioPhoneNumber: string
│   ├── twilioPhoneSid: string
│   ├── unitCount: number
│   ├── photoUrl: string (optional)
│   ├── createdAt: timestamp
│   │
│   ├── units/{unitId}
│   │   ├── unitNumber: string
│   │   ├── bedrooms: number
│   │   ├── bathrooms: number
│   │   ├── sqft: number (optional)
│   │   ├── rentAmount: number
│   │   ├── rentDueDay: number (1-28)
│   │   ├── gracePeriodDays: number
│   │   ├── lateFeeAmount: number
│   │   ├── leaseStart: date
│   │   ├── leaseEnd: date
│   │   ├── securityDeposit: number
│   │   ├── status: "occupied" | "vacant" | "notice_given" | "maintenance"
│   │   └── notes: string
│   │
│   └── knowledgeBase/{entryId}
│       ├── category: "pet_policy" | "parking" | "quiet_hours" | "rent" | "maintenance" | "amenities" | "move_in" | "move_out" | "custom"
│       ├── question: string (optional, for custom FAQ)
│       ├── content: string (the policy/answer text)
│       ├── updatedAt: timestamp
│       └── updatedBy: string (uid)
│
├── tenants/{tenantId}
│   ├── firstName: string
│   ├── lastName: string
│   ├── phone: string (E.164 format)
│   ├── email: string (optional)
│   ├── propertyId: string
│   ├── unitId: string
│   ├── smsOptedIn: boolean
│   ├── smsOptInDate: timestamp
│   ├── language: "en" | "es" (detected or set)
│   ├── createdAt: timestamp
│   └── notes: string
│
├── vendors/{vendorId}
│   ├── name: string
│   ├── company: string (optional)
│   ├── phone: string
│   ├── email: string (optional)
│   ├── trades: string[] (["plumbing", "general_handyman"])
│   ├── hourlyRate: number (optional)
│   ├── availabilityNotes: string (optional)
│   ├── serviceArea: string (optional)
│   ├── priority: number (lower = preferred)
│   ├── propertyIds: string[] (which properties they serve)
│   ├── jobsCompleted: number
│   ├── avgResponseMinutes: number
│   └── createdAt: timestamp
│
├── conversations/{conversationId}
│   ├── tenantId: string
│   ├── propertyId: string
│   ├── unitId: string
│   ├── status: "active" | "resolved" | "escalated" | "pm_handling"
│   ├── type: "maintenance" | "policy" | "rent" | "complaint" | "general"
│   ├── workOrderId: string (optional, if maintenance)
│   ├── createdAt: timestamp
│   ├── lastMessageAt: timestamp
│   ├── messageCount: number
│   ├── resolvedAt: timestamp (optional)
│   ├── resolvedBy: "agent" | "pm"
│   │
│   └── messages/{messageId}
│       ├── direction: "inbound" | "outbound"
│       ├── sender: "tenant" | "agent" | "pm"
│       ├── body: string
│       ├── mediaUrls: string[] (MMS photos)
│       ├── twilioSid: string
│       ├── classification: string (message type)
│       ├── confidence: number
│       ├── timestamp: timestamp
│       └── metadata: { model: string, promptTokens: number, completionTokens: number }
│
└── workOrders/{workOrderId}
    ├── conversationId: string
    ├── tenantId: string
    ├── propertyId: string
    ├── unitId: string
    ├── status: "reported" | "triaged" | "vendor_contacted" | "scheduled" | "in_progress" | "completed" | "cancelled" | "escalated"
    ├── urgency: "emergency" | "urgent" | "routine" | "cosmetic"
    ├── trade: string
    ├── description: string
    ├── photoUrls: string[]
    ├── vendorId: string (assigned vendor)
    ├── scheduledDate: timestamp
    ├── scheduledTimeWindow: string ("2-4 PM")
    ├── estimatedCost: number
    ├── actualCost: number
    ├── autoApproved: boolean
    ├── pmApproved: boolean
    ├── pmApprovedAt: timestamp
    ├── completedAt: timestamp
    ├── tenantConfirmedCompletion: boolean
    ├── createdAt: timestamp
    └── updatedAt: timestamp
```

### 12.2 Indexes Needed

| Collection | Fields | Purpose |
|-----------|--------|---------|
| tenants | phone (ASC) | Look up tenant by inbound phone number |
| conversations | propertyId + lastMessageAt (DESC) | Dashboard inbox |
| conversations | status + type | Filtered views |
| workOrders | propertyId + status | Work order board |
| workOrders | vendorId + status | Vendor workload |
| messages | conversationId + timestamp (ASC) | Conversation thread |

---

## 13. AI Agent Design

### 13.1 Agent Architecture

The system uses a **router + specialized agent** pattern:

1. **Router/Classifier** — fast, cheap call (Haiku) that determines which agent to invoke
2. **Specialized Agents** — deeper calls (Sonnet) with domain-specific system prompts and context

### 13.2 Router Prompt

```
You are a message classifier for a property management AI system.

Given a tenant's message, classify it into exactly one category:

- MAINTENANCE: The tenant is reporting something broken, damaged, leaking,
  not working, or requesting a repair/fix. Includes pest issues.
- EMERGENCY: Subset of maintenance that is life/safety threatening: fire,
  gas leak, flooding, no heat in winter, break-in, electrical hazard,
  sewage backup, carbon monoxide.
- POLICY_QUESTION: The tenant is asking about rules, policies, lease terms,
  amenities, procedures, or general property information.
- RENT_INQUIRY: The tenant is asking about rent amount, due date, payment
  methods, late fees, or their payment status.
- COMPLAINT: The tenant is expressing dissatisfaction about neighbors,
  conditions, management, or service. Not a maintenance request.
- ESCALATION_REQUEST: The tenant is explicitly asking to speak to a human,
  manager, or property manager.
- GENERAL: Anything that doesn't fit above (greetings, thank yous, etc.)

Respond with ONLY the category name. Nothing else.
```

### 13.3 Maintenance Agent System Prompt

```
You are a property maintenance coordinator AI assistant for {{property_name}}.

YOUR ROLE:
- Help tenants report maintenance issues clearly and completely
- Classify urgency and identify the trade needed
- Coordinate with vendors to schedule repairs
- Follow up to confirm completion
- Be empathetic, professional, and efficient

RULES:
1. NEVER make up information. If you don't know something, say so.
2. NEVER promise specific repair times without vendor confirmation.
3. ALWAYS collect: issue description, location in unit, photos if possible.
4. ALWAYS classify urgency:
   - EMERGENCY: Immediate safety risk (fire, gas, flooding, no heat in winter,
     break-in, electrical hazard). Notify PM IMMEDIATELY.
   - URGENT: Significant but not dangerous (broken AC in summer, toilet not
     flushing, major leak contained). Schedule same-day or next-day.
   - ROUTINE: Normal wear issues (dripping faucet, stuck window, minor
     cosmetic). Schedule within 1 week.
   - COSMETIC: Appearance only (scuff marks, paint touch-up). Schedule
     at convenience.
5. For emergencies: Tell tenant to call 911 if life-threatening. Then notify
   PM immediately. Contact 24/7 emergency vendor if one exists.
6. Keep messages SHORT and clear. This is SMS, not email.
7. Use the tenant's name. Be warm but efficient.
8. Respond in the same language the tenant uses.

PROPERTY CONTEXT:
{{property_knowledge_base}}

TENANT CONTEXT:
Name: {{tenant_name}}
Unit: {{unit_number}}
Active work orders: {{active_work_orders}}

VENDOR LIST:
{{vendor_list}}

AUTO-APPROVAL THRESHOLD: ${{threshold}}
(For repairs under this amount, proceed without PM approval)

CONVERSATION HISTORY:
{{conversation_history}}

Respond in JSON:
{
  "reply": "Your SMS reply to the tenant (keep under 320 chars if possible)",
  "action": "none" | "create_work_order" | "contact_vendor" | "escalate_to_pm" | "schedule_followup",
  "actionData": { ... },
  "urgency": "emergency" | "urgent" | "routine" | "cosmetic" | null,
  "trade": "plumbing" | "electrical" | "hvac" | "appliance" | "general" | "pest" | "locksmith" | null,
  "confidence": 0.0-1.0,
  "needsMoreInfo": true | false
}
```

### 13.4 FAQ Agent System Prompt

```
You are a helpful property management assistant for {{property_name}}.

YOUR ROLE:
- Answer tenant questions about property policies, lease terms, amenities,
  and procedures
- Use ONLY the information provided in the property knowledge base below
- If the answer is not in the knowledge base, say "I don't have that
  information on file. Let me check with your property manager and get
  back to you." and escalate.

RULES:
1. NEVER fabricate information. Only use what's in the knowledge base.
2. Keep responses SHORT — this is SMS. 1-3 sentences max.
3. Be friendly and professional.
4. When citing policies, say "Per your property's policies" or
   "According to your lease agreement."
5. If a question could lead to a maintenance request, ask if they need
   to report an issue.
6. Respond in the same language the tenant uses.

PROPERTY KNOWLEDGE BASE:
{{knowledge_base_entries}}

TENANT CONTEXT:
Name: {{tenant_name}}
Unit: {{unit_number}}
Lease dates: {{lease_start}} to {{lease_end}}
Rent: ${{rent_amount}} due on the {{due_day}}

Respond in JSON:
{
  "reply": "Your SMS reply (keep under 320 chars)",
  "action": "none" | "escalate_to_pm",
  "confidence": 0.0-1.0,
  "knowledgeBaseEntryUsed": "category_id" | null
}
```

### 13.5 Token Usage Estimates

| Agent | Avg Input Tokens | Avg Output Tokens | Model | Cost/Call |
|-------|-----------------|-------------------|-------|-----------|
| Router/Classifier | ~200 | ~10 | Haiku | $0.0002 |
| FAQ Agent | ~1,500 | ~100 | Sonnet | $0.005 |
| Maintenance Agent | ~2,000 | ~200 | Sonnet | $0.008 |
| Rent Agent | ~1,000 | ~80 | Sonnet | $0.004 |

**Average cost per tenant interaction (2-3 API calls): ~$0.01-$0.02**
**At 500 interactions/month per client: ~$5-$10/month in AI costs**

---

## 14. Integrations Strategy

### 14.1 Phase 1: No Integrations (MVP)

The MVP works standalone. PM enters data manually into our dashboard. This is intentional:
- Zero dependency on third-party APIs
- Works for PMs using any software (including spreadsheets)
- Fastest path to launch

### 14.2 Phase 2: Buildium Integration (Month 4-6)

**Why Buildium first:**
- Open API available (developer.buildium.com)
- Most SMB-focused major PM software
- Majority of customers have 0-49 employees
- API allows: read properties, units, tenants, leases, work orders

**Integration scope:**
- Sync properties, units, tenants from Buildium → our system
- Push work orders created by our agent → Buildium
- Sync rent payment status from Buildium → our system (for smart reminders)

### 14.3 Phase 3: AppFolio Workaround (Month 6-8)

AppFolio has no open API. Options:
- **Stack Marketplace partnership** — apply to become an AppFolio Stack partner (requires approval process)
- **Email-based integration** — our agent sends work order summaries to a PM's AppFolio email for manual entry
- **Zapier/Make integration** — if AppFolio connects to Zapier for any data points

### 14.4 Phase 4: Additional Integrations (Month 8-12)

- Propertyware (open API) — single-family niche
- Rent Manager (API available) — mid-market
- QuickBooks (for maintenance cost tracking)
- Google Calendar (for scheduling)

### 14.5 Integration-Free Approach (Always Available)

For PMs on software with no API (RentRedi, TenantCloud, TurboTenant, spreadsheets):
- Our system works 100% standalone
- PM can export data (CSV) for import into their other tools
- Weekly email summary of all activity for manual bookkeeping

---

## 15. Pricing & Unit Economics

### 15.1 Pricing Tiers

| | Starter | Pro | Growth |
|---|---------|-----|--------|
| **Price** | $99/mo | $199/mo | $349/mo |
| **Units included** | Up to 50 | Up to 150 | Up to 500 |
| **Properties** | Up to 3 | Up to 10 | Unlimited |
| **SMS included** | 500/mo | 2,000/mo | 5,000/mo |
| **Features** | FAQ bot, rent reminders | + Maintenance coordination, vendor management | + Analytics, integrations, priority support |
| **Overage SMS** | $0.02/msg | $0.015/msg | $0.01/msg |
| **Annual discount** | $89/mo (10% off) | $179/mo (10% off) | $314/mo (10% off) |

### 15.2 Why This Pricing

- **$99/mo Starter** is cheaper than any VA ($1,200+/mo) and most PM software premium tiers ($183-$375/mo for Buildium Growth/Premium)
- **$199/mo Pro** is the sweet spot — PM managing 100 units earns $7,000-$10,000/mo in management fees. $199 is < 3% of revenue for massive time savings.
- **$349/mo Growth** — PM managing 300 units earns $21,000-$30,000/mo. $349 is ~1.5% of revenue.
- All tiers are 80-95% cheaper than EliseAI (estimated $3-$8/unit/mo = $300-$800 for 100 units)

### 15.3 Unit Economics

| Metric | Starter ($99) | Pro ($199) | Growth ($349) |
|--------|--------------|-----------|---------------|
| Revenue | $99 | $199 | $349 |
| Twilio (SMS + number) | $5 | $10 | $20 |
| Claude API | $3 | $7 | $15 |
| Firebase (share) | $2 | $3 | $5 |
| Stripe fee (2.9%+$0.30) | $3.17 | $6.07 | $10.42 |
| **Total COGS** | **$13.17** | **$26.07** | **$50.42** |
| **Gross Profit** | **$85.83** | **$172.93** | **$298.58** |
| **Gross Margin** | **86.7%** | **86.9%** | **85.6%** |

### 15.4 Revenue Projections

| Month | New Clients | Total Clients | MRR | ARR |
|-------|------------|--------------|-----|-----|
| 1 | 3 (free pilots) | 3 | $0 | $0 |
| 2 | 2 (pilots convert) + 3 new | 5 | $1,000 | $12,000 |
| 3 | 5 | 10 | $2,000 | $24,000 |
| 4 | 5 | 15 | $3,000 | $36,000 |
| 5 | 5 | 20 | $4,000 | $48,000 |
| 6 | 8 | 28 | $5,600 | $67,200 |
| 9 | 12 | 55 | $11,000 | $132,000 |
| 12 | 15 | 100 | $22,000 | $264,000 |
| 18 | 25 | 200 | $48,000 | $576,000 |
| 24 | 35 | 350 | $87,500 | $1,050,000 |

**Assumptions:** 5% monthly churn, average ticket $200/mo, growing sales capacity.

### 15.5 Break-Even Analysis

| Item | Monthly Cost |
|------|-------------|
| Your time (opportunity cost, part-time) | $0 (side project) |
| Twilio base | $1.15/number |
| Firebase (Blaze plan) | ~$25 base |
| Claude API | Pay-per-use |
| Vercel | $0 (free tier) |
| Domain + email | ~$15 |
| **Fixed costs** | **~$40/mo** |

**Break-even: 1 paying client.** The business is profitable from day one at the unit economics level.

---

## 16. Go-to-Market Plan

### 16.1 Phase 1: Pilot Acquisition (Weeks 1-6)

**Goal:** 3-5 free pilot clients to validate product-market fit

**Channel 1: BiggerPockets Community**
- Create valuable posts about PM automation (not sales pitches)
- Topics: "How I automated 80% of tenant communication", "The real cost of answering tenant texts manually"
- DM users who engage with interest
- Offer free pilot: "I'm building an AI assistant for PMs — looking for 3 beta testers. Free for 60 days. Interested?"

**Channel 2: Reddit (r/propertymanagement, r/landlord)**
- Same content-first approach
- Answer questions about PM automation
- Soft pitch in comments when relevant

**Channel 3: NARPM Member Directory**
- NARPM (National Association of Residential Property Managers) has a searchable member directory
- Filter for small firms in specific cities
- Personalized cold email (template below)

**Channel 4: Local PM Meetups / NARPM Chapters**
- Attend local events (most cities have monthly PM meetups)
- Demo the product in person
- Nothing sells like a live demo of AI responding to a text in real-time

**Cold Email Template:**
```
Subject: Cut your tenant calls by 80% — free pilot

Hi [Name],

I manage a [X]-unit portfolio and was spending 15+ hours a week
just answering tenant texts and coordinating maintenance.

I built an AI assistant that handles it — tenants text a number,
get instant answers about policies and rent, and maintenance
requests get triaged and dispatched to vendors automatically.

I'm offering it free for 60 days to 3 property managers in
[City] to get feedback.

Would you be open to a 15-minute demo this week?

[Your name]
[Your company]
```

### 16.2 Phase 2: First Paid Clients (Months 2-4)

**Goal:** Convert pilots to paid + acquire 10-20 new paying clients

- Convert pilot clients: if they experienced real value (measured in hours saved), convert to paid
- Case studies from pilot: "PM saves 12 hours/week with AI assistant" → use in all marketing
- Cold outreach at scale: 50 personalized emails/week to NARPM members
- Content marketing: publish 2 blog posts/month about PM automation (SEO play for long-term)
- Listing on PM software marketplaces: Buildium Marketplace, StackSource, etc.

### 16.3 Phase 3: Scalable Acquisition (Months 4-12)

**Goal:** Consistent 10-20 new clients/month

- **Google Ads:** "property management AI", "tenant communication automation", "maintenance coordination software" — estimated $5-$15 CPC, target $200-$500 CAC
- **Partnerships:** Local PM associations, real estate investor groups, PM coaches/consultants (affiliate program: $50/mo per referral)
- **Conference sponsorships:** NARPM annual conference, local PM events
- **Product-led growth:** Self-serve signup is live. Free 14-day trial. No sales call needed.
- **Referral program:** Existing clients refer PMs → both get $50/mo credit for 3 months

### 16.4 Sales Process

```
1. Lead enters via: cold email reply, website signup, referral, conference
         │
         ▼
2. 15-min demo call (or self-serve trial)
   - Show: tenant texts number → gets instant response
   - Show: maintenance request → vendor coordinated automatically
   - Show: PM dashboard with all conversations
         │
         ▼
3. Free 14-day trial (self-serve onboarding)
   - PM adds 1 property, 5-10 tenants
   - Tenant opt-in SMS sent
   - Agent goes live within 48 hours
         │
         ▼
4. Day 7: Check-in email with usage stats
   ("Your AI handled 43 tenant messages this week.
    Estimated time saved: 6 hours.")
         │
         ▼
5. Day 12: Conversion email
   ("Your trial ends in 2 days. Keep your AI assistant
    running for $199/mo — less than a single day of
    admin salary.")
         │
         ▼
6. Conversion or extension (offer 30-day extension
   if engaged but not ready)
```

### 16.5 Key Marketing Messages

**Primary:** "Your AI property manager. Handles tenant texts, coordinates maintenance, sends rent reminders. 24/7. $199/mo."

**For time-strapped PMs:** "Stop answering the same tenant questions 100 times a month."

**For growing PMs:** "Scale your portfolio without scaling your team."

**For cost-conscious PMs:** "Better than a VA. Cheaper than an assistant. Never sleeps."

**Proof points to develop:**
- "Handles 80% of tenant communications without PM intervention"
- "Maintenance response time drops from 48 hours to 4 hours"
- "PMs save 10+ hours per week"
- "Tenants rate the experience 4.5/5"

---

## 17. Operational Playbook

### 17.1 Daily Operations (Post-Launch)

| Task | Time | Frequency |
|------|------|-----------|
| Monitor error logs / failed messages | 15 min | Daily |
| Review escalated conversations (learn from agent failures) | 30 min | Daily |
| Respond to customer support requests | 30 min | Daily |
| **Total daily operations** | **~1 hour** | |

### 17.2 Weekly Operations

| Task | Time | Frequency |
|------|------|-----------|
| Review AI performance metrics (resolution rate, escalation rate, response time) | 30 min | Weekly |
| Improve prompts based on failure patterns | 1 hour | Weekly |
| Customer check-in calls (during pilot/early stages) | 1-2 hours | Weekly |
| Content creation (blog post, social media) | 1-2 hours | Weekly |
| **Total weekly operations** | **~4-6 hours** | |

### 17.3 Monthly Operations

| Task | Time | Frequency |
|------|------|-----------|
| Financial review (MRR, churn, COGS, LTV) | 1 hour | Monthly |
| Product roadmap review and prioritization | 1 hour | Monthly |
| Competitive landscape check | 30 min | Monthly |
| Infrastructure cost optimization | 30 min | Monthly |

### 17.4 Customer Support Model

**Phase 1 (0-30 clients):** You handle support personally (email + dashboard chat widget)
**Phase 2 (30-100 clients):** Hire part-time support person ($15-$20/hr, 20 hrs/week)
**Phase 3 (100+ clients):** Full-time support + knowledge base + chatbot for PM-side support

### 17.5 Prompt Improvement Loop

```
1. Agent fails to resolve a conversation → gets escalated
2. PM resolves it manually
3. System logs: original message, agent's failed response, PM's successful response
4. Weekly: Review all escalated conversations
5. Identify patterns: Why did the agent fail?
   - Missing knowledge base entry? → Add it
   - Prompt instruction gap? → Update prompt
   - Genuinely complex/emotional situation? → Accept as human-only
6. Track resolution rate over time (should increase from 70% → 85%+ over months)
```

---

## 18. Risk Register & Mitigations

| # | Risk | Severity | Probability | Mitigation |
|---|------|----------|------------|------------|
| 1 | **AI gives wrong information to tenant** (e.g., wrong pet policy, wrong rent amount) | High | Medium | AI only uses knowledge base; never fabricates. Confidence threshold triggers escalation. PM reviews agent responses in dashboard. |
| 2 | **Emergency misclassified as routine** | Critical | Low | Explicit emergency keyword detection (fire, gas, flood, etc.) always triggers immediate PM alert regardless of AI classification. Redundant safety check. |
| 3 | **Twilio outage** | High | Low | Monitor Twilio status. Queue messages during outage. Alert PMs to use backup communication. Evaluate secondary SMS provider (Vonage) for redundancy. |
| 4 | **Claude API outage** | High | Low | Fallback: if API is down, auto-respond with "Your property manager has been notified and will respond shortly" and escalate all messages to PM. |
| 5 | **Tenant harassment / abuse of AI** | Medium | Medium | Rate limiting (20 msgs/hr). Profanity/threat detection → escalate to PM. PM can block tenant from AI and communicate directly. |
| 6 | **TCPA compliance violation** (unsolicited SMS) | High | Low | Opt-in required before any outbound SMS. STOP keyword handling. Consent records stored with timestamps. Legal review of message templates. |
| 7 | **Data breach** | Critical | Low | Firebase security rules. Encryption at rest and in transit. No sensitive data (SSN, bank accounts) stored. SOC 2 pursuit within 12 months. |
| 8 | **Competitor launches identical product** | Medium | Medium | Speed to market is the moat. First-mover in SMB PM AI agent space. Build switching costs through integrations and data history. |
| 9 | **PM churn after free trial** | Medium | High | Measure engagement during trial. Proactive check-ins. Ensure time-to-value < 48 hours. Show ROI data (hours saved, messages handled). |
| 10 | **Fair Housing Act violation** | Critical | Low | Agent handles maintenance and FAQ only (Phase 1). Does NOT make leasing decisions, screen tenants, or show properties. When leasing is added, legal review required. |
| 11 | **Vendor refuses to engage via SMS** | Medium | Medium | Offer email fallback for vendor communication. Allow PM to manually assign vendors. Track vendor SMS response rates and flag non-responsive vendors. |
| 12 | **Scale issues at 100+ clients** | Medium | Medium | Firebase auto-scales. Cloud Functions auto-scale. Twilio handles massive volume. Monitor costs and optimize Claude API usage (batch where possible, cache frequent responses). |

---

## 19. Metrics & KPIs

### 19.1 Business Metrics

| Metric | Definition | Target (Month 6) | Target (Month 12) |
|--------|-----------|-------------------|-------------------|
| MRR | Monthly Recurring Revenue | $5,000 | $22,000 |
| Total clients | Active paying clients | 25 | 100 |
| Monthly churn | % clients cancelled / total clients | < 5% | < 4% |
| CAC | Customer Acquisition Cost | < $300 | < $250 |
| LTV | Lifetime Value (avg ticket / churn rate) | > $4,000 | > $5,000 |
| LTV:CAC ratio | | > 10:1 | > 15:1 |
| Trial-to-paid conversion | | > 40% | > 50% |
| NPS | Net Promoter Score | > 40 | > 50 |

### 19.2 Product Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| AI resolution rate | % of messages handled without PM intervention | > 75% |
| Average response time | Time from tenant SMS to agent reply | < 8 seconds |
| Maintenance coordination rate | % of work orders fully coordinated by agent (no PM action needed) | > 60% |
| Knowledge base coverage | % of tenant questions answered from KB (vs. escalated as unknown) | > 85% |
| Emergency detection accuracy | % of real emergencies correctly classified | > 99% |
| False emergency rate | % of non-emergencies classified as emergency | < 2% |
| Tenant satisfaction | Post-resolution survey (1-5 scale) | > 4.2 |
| PM time saved per week | Self-reported hours saved | > 10 hours |

### 19.3 Infrastructure Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| Uptime | System availability | > 99.9% |
| Message processing latency (p95) | Time to process and respond | < 10 seconds |
| API error rate | Failed Claude API calls / total calls | < 0.5% |
| SMS delivery rate | Successfully delivered / total sent | > 98% |
| Monthly infrastructure cost per client | Total infra / total clients | < $20 |

---

## 20. Roadmap

### 20.1 Detailed Timeline

```
WEEK 1-2: MVP Development
├── Set up Firebase project (Functions, Firestore, Auth, Storage)
├── Twilio account + phone number provisioning
├── Inbound SMS webhook handler
├── Tenant identification (phone → tenant lookup)
├── Message classification (router prompt)
├── FAQ agent (Claude API + knowledge base context)
├── Basic PM dashboard (conversations list, message thread view)
├── PM reply capability (dashboard → SMS)
├── Escalation flow (agent → PM notification)
└── Test with fake property + your own phone

WEEK 3: Onboarding + Polish
├── Self-serve signup flow (Firebase Auth + Stripe)
├── Property setup wizard
├── Tenant import (manual + CSV)
├── Knowledge base editor
├── Vendor directory
├── Settings (approval threshold, notifications)
├── Tenant opt-in SMS flow
└── "Test mode" for PM to try agent before going live

WEEK 4-6: Pilot Launch
├── Deploy to production
├── Recruit 3-5 pilot PMs (free 60 days)
├── Monitor all conversations daily
├── Iterate on prompts based on real interactions
├── Fix bugs, improve response quality
└── Collect feedback

WEEK 6-8: Maintenance Coordination (Phase 2)
├── Maintenance agent (triage, urgency, trade classification)
├── Work order creation and management
├── Vendor contact flow (agent → vendor SMS)
├── Scheduling coordination (tenant ↔ vendor)
├── Approval workflow (auto-approve under threshold)
├── Follow-up and completion verification
├── Work order dashboard view
└── Rent reminder system (scheduled SMS sequences)

MONTH 3-4: Conversion + Growth
├── Convert pilots to paid
├── Launch marketing site with pricing
├── Case studies from pilot clients
├── Begin cold outreach (50 emails/week)
├── Google Ads experiment ($500/mo budget)
├── Referral program
└── Target: 15-20 paying clients

MONTH 4-6: Integrations + Intelligence
├── Buildium API integration
├── Analytics dashboard (message volume, resolution rate, costs)
├── Weekly/monthly PM reports (automated email)
├── Improved emergency detection
├── Spanish language support
├── Prompt optimization based on 3+ months of data
└── Target: 25-30 paying clients

MONTH 6-12: Scale
├── AppFolio integration (Stack Marketplace application)
├── Propertyware integration
├── Leasing automation (prospect communication, showing scheduling)
├── Lease renewal reminders and coordination
├── Owner reporting (monthly property performance summaries)
├── Mobile-optimized dashboard
├── Hire part-time support person
├── Conference attendance (NARPM annual)
└── Target: 50-100 paying clients
```

### 20.2 Feature Prioritization (MoSCoW)

**Must Have (MVP Launch)**
- Inbound SMS handling + AI response
- Tenant identification
- FAQ from knowledge base
- PM dashboard (conversations)
- Escalation to PM
- Self-serve onboarding
- Stripe billing

**Should Have (Phase 2, Month 2-3)**
- Maintenance coordination (vendor dispatch, scheduling)
- Work order management
- Rent reminders
- MMS photo support
- Emergency detection + PM alert

**Could Have (Phase 3, Month 4-6)**
- Buildium integration
- Analytics dashboard
- Spanish language support
- CSV bulk import
- PM mobile-responsive dashboard
- Weekly summary emails

**Won't Have (Not in Year 1 scope)**
- Voice call handling (AI phone agent)
- Payment processing
- Tenant screening
- White-labeling
- Mobile app (native)
- Multi-language beyond English/Spanish

---

## Appendix A: Legal Considerations

### TCPA Compliance (Telephone Consumer Protection Act)
- **Required:** Express written consent before sending any automated SMS
- **Implementation:** Tenant must reply YES to opt-in message. Store consent record with timestamp.
- **Opt-out:** Tenant texts STOP at any time → immediately stop all outbound SMS
- **Content:** No marketing messages. All messages are transactional (maintenance updates, rent reminders)

### Fair Housing Act
- **Current scope (maintenance + FAQ) is low risk.** The agent does not make housing decisions.
- **When leasing is added:** Must ensure AI does not discriminate in prospect communication, showing scheduling, or screening. Legal review required before launch.
- **Mitigation:** Document that the AI treats all tenants identically based on property rules, not personal characteristics.

### Data Privacy
- **No HIPAA data** — we don't handle health information
- **No financial data** — we don't process payments
- **PII handled:** Name, phone, email, address, lease terms
- **Approach:** Encrypt at rest, encrypt in transit, minimize data collection, clear retention policy, provide data export/deletion on request
- **Privacy policy required** on website before launch

### State-Specific SMS Laws
- Some states have additional SMS consent requirements
- California (CCPA/CPRA): Data deletion rights, privacy notice required
- Research state-specific requirements for top 10 target states before scaling nationally

---

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| PM | Property Manager |
| SMB | Small and Medium Business |
| MRR | Monthly Recurring Revenue |
| ARR | Annual Recurring Revenue |
| CAC | Customer Acquisition Cost |
| LTV | Lifetime Value |
| COGS | Cost of Goods Sold |
| TAM | Total Addressable Market |
| NARPM | National Association of Residential Property Managers |
| TCPA | Telephone Consumer Protection Act |
| ISR | Incremental Static Regeneration |
| BPO | Business Process Outsourcing |
| RPO | Recruitment Process Outsourcing |
| VA | Virtual Assistant |
| DSO | Dental Service Organization |

---

## Appendix C: Reference Links

### Industry Data
- Grand View Research — PM Software Market: grandviewresearch.com
- Fortune Business Insights — PM Market: fortunebusinessinsights.com
- Morgan Stanley — AI in Real Estate: morganstanley.com

### Competitors
- EliseAI: eliseai.com
- MagicDoor: magicdoor.com
- STAN.AI: stan.ai
- Vendoroo: vendoroo.ai
- Showdigs: showdigs.com
- Brickwise: brickwiseai.com
- Lula: lula.life

### PM Software
- AppFolio: appfolio.com
- Buildium: buildium.com (API: developer.buildium.com)
- Propertyware: propertyware.com
- RentRedi: rentredi.com
- TenantCloud: tenantcloud.com
- TurboTenant: turbotenant.com

### Industry Associations
- NARPM: narpm.org (member directory for outreach)
- NAA: naahq.org (National Apartment Association)
- BiggerPockets: biggerpockets.com (community + forums)

### Tools & Services
- Twilio: twilio.com (SMS API)
- Anthropic Claude: anthropic.com (AI API)
- Firebase: firebase.google.com
- Stripe: stripe.com
- Vercel: vercel.com
