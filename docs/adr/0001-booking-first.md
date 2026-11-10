# ADR 0001 — Booking-first model, no dispatch

- **Status:** Accepted for the prototype
- **Date:** 2026-11-09
- **Deciders:** Founder

## Context

The research report found three models in local services: lead generation (Angi, Checkatrade, MyBuilder, Bark), booking with a per-job take (TaskRabbit, Urban Company, Rover), and on-demand with platform-owned dispatch (Urban Company InstaHelp, Snabbit, the now-closed Pync). Lead-gen platforms are shrinking. Instant, subsidised operators have burned cash. Dispatch-driven matching raises worker-status risk under UK case law (Uber v Aslam; IWGB v CAC).

## Decision

The prototype is a **booking marketplace**: customers choose a provider from a list of verified, available people, pay at booking, and the platform releases payment after the job. There is **no algorithmic dispatch** and no instant service.

## Consequences

- We keep payment control, which the research says is needed for a take rate.
- We lose the density efficiency that makes Deliveroo profitable. Accepted, because the prototype is testing demand and repeat use, not unit economics at scale.
- Worker-status risk is lower: providers set their rates and can decline without penalty.
- Customers must browse rather than being matched, which may reduce fill rate. This is measured in Phase 3.
- The decision is revisited at the decision gate. A robust build must explicitly choose a worker-status model.

## Alternatives considered

| Option | Why not now |
|---|---|
| Lead-generation directory | Shrinking model; no transaction control |
| On-demand dispatch | Subsidy-heavy and classification-risky; Pync closed in January 2026 |
| Full managed service (we employ cleaners) | Employer obligations, insurance and cost before demand is proven |
