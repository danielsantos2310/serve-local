# 00 — Overview and scope

## Problem

Households need reliable, vetted people for recurring home jobs (cleaning, repairs, childcare). Today they find them through word of mouth, Facebook groups, or lead directories where they receive several quotes and pay for the privilege. Providers pay per lead or subscription and have no guarantee of repeat work.

## Hypothesis to test

A platform that:

1. holds payment at booking,
2. verifies each provider before they can accept a job,
3. ties reviews only to paid bookings,

will produce **higher repeat rates** and **more stable provider income** than lead-based directories, in one postcode area, within 12 weeks.

## Why this shape (from the research)

- Lead-generation directories are shrinking (Angi's active US pros fell 17%; see the report).
- Instant, subsidised on-demand services burned cash and closed (Pync, Homejoy).
- Deliveroo's economics depend on very high density, which services don't have.
- The surviving model is **booking with payment control**, starting with one category.

## In scope for the prototype

| Area | Included |
|---|---|
| Customers | Sign up, request a clean, pick a time, pay (test mode), rate |
| Providers | Apply, submit ID and right-to-work documents, set availability, accept or decline jobs, get paid (test mode) |
| Admin | Approve providers, handle disputes manually, see the basic metrics |
| Payments | Stripe test mode, Connect Express accounts for providers, booking hold and release |
| Trust | Manual verification, verified-job reviews only |
| Ops | Email notifications, a simple admin dashboard |

## Explicitly out of scope

- Real money, real payouts, or any live Stripe account
- Gas, electrical, childcare or any regulated trade
- Dispatch or algorithmic matching (customers choose providers from a list)
- Native mobile apps (responsive web only)
- Multiple cities, multiple languages, instant booking
- Automated identity verification (manual review only)
- Insurance products (we only ask for proof of insurance where relevant later)

## Success criteria for the pilot (12 weeks)

| Metric | Target to proceed to a robust build |
|---|---|
| Second-booking rate, customers within 30 days | ≥ 35% |
| Providers still active after 8 weeks | ≥ 70% of onboarded |
| Share of requests that get at least one accepted provider within 24h | ≥ 80% |
| Average customer rating | ≥ 4.5 / 5 |
| Verified-job reviews as share of all reviews | 100% (by design) |

These are starting hypotheses, not benchmarks. The research found no UK or Irish services benchmark to anchor them. See [08-roadmap-and-validation.md](08-roadmap-and-validation.md).

## Principles

1. **Test before build.** Manual steps are fine if they prove demand.
2. **Hold the money, verify the people.** These are the two things that make the platform worth more than a directory.
3. **Stay out of regulated work** until the checks exist.
4. **Keep a paper trail.** Log every verification and dispute decision.
