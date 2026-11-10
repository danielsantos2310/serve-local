# ADR 0003 — Stripe in test mode with manual capture

- **Status:** Accepted for the prototype
- **Date:** 2026-11-09

## Context

Bookings need to commit the customer's money without taking it until the job is done, and providers need a payout account. The prototype must test these flows at no cost.

## Decision

- Use **Stripe in test mode only**, with **Connect Express** accounts for providers.
- Create each payment with **manual capture**: authorise at booking, capture on completion, cancel the authorisation on cancellation or refund.
- Handle state changes only from **verified webhooks**.

## Consequences

- The whole booking flow can be tested with test cards at no cost.
- Authorisations expire if not captured within the card network's window. Jobs longer than that window need a plan. Check the window before Phase 2 and avoid bookings further out than it allows.
- Test mode does not reproduce real declines, chargebacks or payout failures. Risk R7 in [09](../09-open-questions-and-risks.md) records this.
- Live use is a separate decision with compliance review. Nothing here should be switched to live without an ADR superseding this one.

## Alternatives considered

| Option | Why not |
|---|---|
| Capture immediately at booking | Hard to refund cleanly; weaker commitment model for cancellations |
| Pay by bank transfer only | Good for Phase 1 manual pilot, but no automated split or payout |
| Another provider's test sandbox | Stripe Connect fits the marketplace model and is free in test mode |
