# 05 — Free tech stack

Everything here is chosen to cost nothing at pilot scale. **Free-tier limits change, so check each provider's current pricing page before you rely on a number here.** The limits below are what the project plans around, not verified figures.

## Stack at a glance

| Layer | Tool | Free use | Limit to watch (verify) |
|---|---|---|---|
| Frontend | Next.js (or plain HTML + JS for a first spike) | Open source | None |
| Hosting | Netlify or Cloudflare Pages | Free hosting and deploys | Build minutes and bandwidth caps |
| Database, auth, storage | Supabase | Postgres, auth, file storage, edge functions | Free projects may pause after a period of inactivity; storage and bandwidth caps |
| Payments | Stripe, test mode + Connect | No charges in test mode | No real money; live use needs full setup and compliance |
| Email | Resend (or Supabase's built-in email for auth) | Free monthly send allowance | Daily and monthly send caps |
| Maps and postcodes | Postcode lookup via a free open dataset (e.g. ONSPD) or a free API | Free for a pilot | Check API terms |
| Analytics | PostHog free tier, or plain SQL on the Supabase database | Free tier | Event caps |
| Error logging | Sentry free tier | Free for small volumes | Event caps |
| Source control | GitHub free | Free | None relevant |
| Diagrams | Mermaid (in Markdown) | Free, renders on GitHub | None |
| Mind maps | Mermaid `mindmap` syntax | Free | None |
| Design | Figma free plan, or simple wireframes in Markdown | Free | File and team limits |
| Forms (provider application) | Supabase tables + the app's own form | Free | None |
| Scheduling and reminders | Supabase `pg_cron` (where enabled) or a free cron service | Free | Verify on the free tier |

## Why each choice

**Supabase.** One free project covers the database, login, file storage for ID documents and serverless functions. Row-level security is built in, which matters because the database enforces who can see what. See [ADR 0002](adr/0002-supabase-backend.md).

**Stripe test mode.** Test mode is free and exercises the full flow: authorisation, capture, Connect accounts and webhooks. The prototype never leaves test mode. See [ADR 0003](adr/0003-stripe-test-mode-manual-capture.md).

**Netlify or Cloudflare Pages.** Static hosting with serverless functions, free for a small pilot. Either works; pick the one you already have an account for.

**Next.js.** Standard, well documented, and works with Supabase's client library. A plain-HTML spike is acceptable for the first screen if you want to validate the layout before committing to a framework.

## What is deliberately not in the stack

| Tool | Why not, for the prototype |
|---|---|
| Native mobile app | Doubles the build; web is enough to test demand |
| Paid map or geocoding APIs | Postcode-area matching is enough for one pilot area |
| Automated ID verification vendors | Cost and onboarding time; manual checks first |
| Dispatch or routing engines | Out of scope; customers choose providers |
| Kubernetes or microservices | Premature. One database and a few functions are enough |
| Any live payment provider | Test mode only until compliance is reviewed |

## Cost guardrail

- Set a monthly budget of **£0**. If any service needs a card on file, use test cards only and check the plan before upgrading.
- Keep one free Supabase project for staging and one for the pilot. Do not upgrade either without a decision recorded in `docs/adr/`.
- Review free-tier limits at the start of each pilot phase.

## Setup checklist (to do in Phase 0)

- [ ] GitHub repository created (private until the pilot)
- [ ] Supabase project created (staging), schema applied from `supabase/migrations/`
- [ ] Stripe account in test mode, Connect enabled in test mode
- [ ] Netlify or Cloudflare Pages project linked to the repository
- [ ] Resend account and sending domain verified (or the Supabase email option chosen)
- [ ] `.env.example` filled in locally (never commit real keys)
- [ ] Sentry and PostHog projects created (optional for Phase 1)
