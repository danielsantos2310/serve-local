# ADR 0002 — Supabase as the prototype backend

- **Status:** Accepted for the prototype
- **Date:** 2026-11-09

## Context

We need a database, login, private file storage and serverless functions, all free at pilot scale, with access control enforced close to the data.

## Decision

Use **Supabase**: Postgres with row-level security, Supabase Auth, Storage (private bucket for ID documents), and Edge Functions for Stripe webhooks and notifications.

## Consequences

- Access rules live in the database, so a bug in the frontend cannot expose another user's bookings. Tests T10 and T12 in [08](../08-roadmap-and-validation.md) check this.
- One vendor for four needs keeps setup small.
- Free projects may pause after inactivity and have storage and bandwidth limits. Verify current limits before Phase 0 (see [05](../05-free-tech-stack.md)).
- Lock-in is moderate: the schema is standard Postgres, so a move to another host is possible.

## Alternatives considered

| Option | Why not |
|---|---|
| Firebase | Weaker relational modelling for bookings and payments |
| Self-hosted Postgres plus custom auth | More work and more security risk for no pilot benefit |
| Airtable or no-code tools | Poor fit for payment webhooks and access control |
