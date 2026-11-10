# 06 — Data model

Schema is in [`supabase/migrations/`](../supabase/migrations/). This page explains it.

## Entity relationship diagram

```mermaid
erDiagram
    PROFILES ||--o| PROVIDER_PROFILES : "is a provider"
    PROFILES ||--o{ BOOKINGS : "books as customer"
    PROVIDER_PROFILES ||--o{ BOOKINGS : "fulfils"
    PROVIDER_PROFILES ||--o{ PROVIDER_SERVICES : "offers"
    SERVICES ||--o{ PROVIDER_SERVICES : "is offered via"
    PROVIDER_PROFILES ||--o{ AVAILABILITY_RULES : "sets"
    PROVIDER_PROFILES ||--o{ VERIFICATION_CHECKS : "is checked by"
    BOOKINGS ||--o| REVIEWS : "may have one"
    BOOKINGS ||--o{ PAYMENT_EVENTS : "records"
    BOOKINGS ||--o{ DISPUTES : "may have"
    BOOKINGS ||--o{ AUDIT_LOG : "logged in"

    PROFILES {
      uuid id PK
      text role "customer | provider | admin"
      text full_name
      text postcode
      timestamptz created_at
    }
    PROVIDER_PROFILES {
      uuid id PK
      uuid profile_id FK
      text status "applied | verified | suspended | rejected"
      text bio
      int years_experience
      text stripe_account_id
      timestamptz verified_at
    }
    SERVICES {
      uuid id PK
      text code "clean_standard | clean_deep | ..."
      text label
      int min_rate_pence
    }
    PROVIDER_SERVICES {
      uuid provider_id FK
      uuid service_id FK
      int rate_pence
    }
    AVAILABILITY_RULES {
      uuid id PK
      uuid provider_id FK
      int weekday
      time start_time
      time end_time
    }
    VERIFICATION_CHECKS {
      uuid id PK
      uuid provider_id FK
      text check_type "id | right_to_work | insurance | reference"
      text result "pending | pass | fail"
      uuid reviewed_by FK
      timestamptz reviewed_at
    }
    BOOKINGS {
      uuid id PK
      uuid customer_id FK
      uuid provider_id FK
      uuid service_id FK
      text status
      timestamptz starts_at
      int hours
      int total_pence
      int platform_fee_pence
      text stripe_payment_intent_id
    }
    PAYMENT_EVENTS {
      uuid id PK
      uuid booking_id FK
      text event_type
      int amount_pence
      timestamptz created_at
    }
    REVIEWS {
      uuid id PK
      uuid booking_id FK "unique"
      int rating
      text body
    }
    DISPUTES {
      uuid id PK
      uuid booking_id FK
      text status
      text decision
      uuid decided_by FK
    }
    AUDIT_LOG {
      uuid id PK
      text actor_id
      text action
      text entity
      jsonb detail
      timestamptz created_at
    }
```

## Design rules

| Rule | Reason |
|---|---|
| Money in **integer pence** | Avoids floating-point errors |
| `bookings.status` follows the state machine in [03](03-user-flows.md) | One source of truth for payment decisions |
| One review per booking (unique constraint) | Only paid, completed jobs can be reviewed |
| `audit_log` is append-only | Supports dispute decisions and verification records |
| `verification_checks` keeps history, never overwrites | Shows what was checked and when |
| ID documents not in the database, only a storage path | Keeps sensitive files in a private bucket |
| Platform fee stored per booking | Lets us change the fee later without rewriting history |

## Row-level security (summary)

| Table | Customer | Provider | Admin |
|---|---|---|---|
| profiles | own row | own row | all |
| provider_profiles | public fields if verified | own row | all |
| bookings | own bookings | own bookings | all |
| verification_checks | none | none | all |
| reviews | create for own completed booking; read public | read own provider | all |
| disputes | create for own booking; read own | create for own booking; read own | all |
| audit_log | none | none | read; insert via functions only |

Full policies are in `supabase/migrations/`.

## Data we do **not** store

- Card numbers (Stripe holds them)
- Full ID document images in the database (only in the private bucket, deleted per retention rules)
- Health, criminal record or other special-category data (see [07](07-trust-safety-compliance.md))
