# Serve Local — free public beta

A booking-first marketplace for local home services. Right now: cleaning, free to use, no payments.

**Live beta:** https://danielsantos2310.github.io/serve-local/ *(after GitHub Pages is enabled, see [docs/10-beta-launch.md](docs/10-beta-launch.md))*

## What the beta does

- **Customers** find a verified cleaner in their area, send a booking request, and rate the job afterwards.
- **Providers** apply, set their rates, and accept, decline or complete jobs.
- **Admins** approve providers by hand, read feedback and watch the booking numbers.

Free periods, set in the database (`beta_config`):

| Who | Free for |
|---|---|
| Customers | 3 months from sign-up |
| Providers | 5 months from application |

Nothing is charged during the beta. Monetisation comes after feedback.

## Stack (all free tier)

| Part | Tool |
|---|---|
| Front end | Plain HTML, CSS and JavaScript (no build step) |
| Hosting | GitHub Pages |
| Database, auth, access rules | Supabase (Postgres + row-level security) |
| Supabase region | London (`eu-west-2`) |

## Repository layout

```
index.html, styles.css, app.js   the whole front end
config.js                        public Supabase URL and anon key only
supabase/migrations/             database history, applied in order
scripts/make-admin.sql           makes one account an admin (run by the owner only)
docs/                            overview, user stories, flows, architecture,
                                 data model, trust and compliance, roadmap, ADRs,
                                 research report
```

## Running it locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

The app talks to the live beta database, so use a test account, not real personal data, while developing.

## Rules for contributors

1. **Never commit secrets.** No service-role keys, no Stripe secret keys, no `.env` files.
2. **Access rules belong in the database.** The front end is not trusted with anything. Every new table needs row-level security and a policy.
3. **Change the database with a new migration file**, never by editing an old one.
4. **Cleaning only** until the compliance work is done. Gas, electrical and childcare are not listed.
5. **No payments** until the decision to charge has been made and recorded in an ADR.

## Read next

- [Beta launch and admin steps](docs/10-beta-launch.md)
- [Overview](docs/00-overview.md) and [mind map](docs/01-mindmap.md)
- [Architecture](docs/04-architecture.md) and [data model](docs/06-data-model.md)
- [Trust, safety and compliance](docs/07-trust-safety-compliance.md)
- [Roadmap and metrics](docs/08-roadmap-and-validation.md)
- [Open questions and risks](docs/09-open-questions-and-risks.md)
- [Research report](docs/research-report.md)
