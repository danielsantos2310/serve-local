# scripts/

Small helper scripts for the prototype. Keep them free of secrets: read keys from `.env.local`.

Planned scripts (Phase 0–2):

| Script | Purpose | Phase |
|---|---|---|
| `seed-staging.sql` | Insert test customers, providers, services and bookings into the staging project | 0 |
| `export-bookings.csv.sh` | Export bookings to CSV for the weekly metrics sheet | 1 |
| `purge-expired-id-docs.sql` | Delete verification documents past `ID_RETENTION_DAYS` (confirm the rule with a solicitor first) | 3 |
| `stripe-test-webhooks.md` | How to forward Stripe test webhooks to a local server using the free Stripe CLI | 2 |

Do not add a script that touches live Stripe or live customer data without an ADR.
