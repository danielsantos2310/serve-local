# 02 — User stories

Format: **As a** [role], **I want** [capability], **so that** [outcome]. Each story has acceptance criteria. Priority: **P0** must be in the pilot, **P1** should be, **P2** later.

## Customer

| ID | Priority | Story | Acceptance criteria |
|---|---|---|---|
| C1 | P0 | As a customer, I want to sign up with email, so that I can book. | Email + password or magic link; email verified before first booking. |
| C2 | P0 | As a customer, I want to enter my postcode and see available providers, so that I know someone can come. | Only providers in the pilot postcode area; only verified and available providers listed. |
| C3 | P0 | As a customer, I want to pick a date, time slot and job size, so that the price is clear before I pay. | Price shown before checkout; price = base rate × hours, no hidden fees. |
| C4 | P0 | As a customer, I want to pay at booking, so that the provider is committed. | Payment authorised at booking (test mode); captured after job completion. |
| C5 | P0 | As a customer, I want to see my booking status, so that I know what happens next. | Statuses: requested, accepted, in progress, completed, cancelled, disputed. |
| C6 | P0 | As a customer, I want to rate and review after a completed job, so that others can trust the provider. | Only the paying customer for a completed booking can review; one review per booking. |
| C7 | P0 | As a customer, I want to cancel with clear terms, so that I'm not trapped. | Free cancellation up to a set window; the rule is shown before payment. |
| C8 | P1 | As a customer, I want to rebook my last provider in one tap, so that repeat use is easy. | "Book again" on past bookings; preferred provider stored. |
| C9 | P1 | As a customer, I want to raise a dispute, so that I'm protected if the job goes wrong. | Dispute form with photos; admin notified; payment held until resolved. |
| C10 | P2 | As a customer, I want recurring bookings, so that I don't have to rebook weekly. | Not in the prototype. Test manually first. |

## Provider

| ID | Priority | Story | Acceptance criteria |
|---|---|---|---|
| P1 | P0 | As a provider, I want to apply with my details and services, so that I can start earning. | Name, postcode, services, base rate, bio, experience. |
| P2 | P0 | As a provider, I want to upload ID and right-to-work proof, so that I can be verified. | Files stored in private storage; visible only to admins. |
| P3 | P0 | As a provider, I want to connect a payout account, so that I get paid. | Stripe Connect Express onboarding (test mode in the prototype). |
| P4 | P0 | As a provider, I want to set my weekly availability, so that I only get jobs I can do. | Recurring weekly slots plus one-off blocks. |
| P5 | P0 | As a provider, I want to accept or decline a job, so that I keep control of my work. | Accept or decline; no penalty for declining (see [07](07-trust-safety-compliance.md)). |
| P6 | P0 | As a provider, I want to see my earnings and payout dates, so that I can plan. | Earnings list with booking, fee, net amount, payout status. |
| P7 | P1 | As a provider, I want to set my own rate within a platform minimum, so that I price fairly. | Minimum rate enforced; provider may set above it. |
| P8 | P1 | As a provider, I want to mark a job complete with photos, so that payment releases. | Completion marked by provider; customer has 24h to dispute. |

## Admin

| ID | Priority | Story | Acceptance criteria |
|---|---|---|---|
| A1 | P0 | As an admin, I want to review provider applications, so that only verified people are listed. | Checklist (ID, right to work, insurance, references); approve, reject or request more. |
| A2 | P0 | As an admin, I want to see all bookings and their status, so that I can intervene. | Filter by status, postcode, date. |
| A3 | P0 | As an admin, I want to resolve disputes, so that both sides are treated fairly. | Refund, partial refund or release; reason recorded. |
| A4 | P0 | As an admin, I want an audit log, so that every decision can be explained. | Every verification and dispute action is logged with user, time and reason. |
| A5 | P1 | As an admin, I want a weekly metrics view, so that I can judge the pilot. | Repeat rate, active providers, fill rate, rating average. |
