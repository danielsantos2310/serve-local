# 03 — User flows

Sequence and flow diagrams in Mermaid. Each flow lists the states it passes through, so developers can check the code against the diagram.

## 3.1 Customer books a clean

```mermaid
sequenceDiagram
    actor C as Customer
    participant W as Web app
    participant DB as Supabase (Postgres)
    participant S as Stripe (test mode)
    participant P as Provider
    C->>W: Enter postcode, date, job size
    W->>DB: Query verified, available providers
    DB-->>W: Matching providers and slots
    C->>W: Choose provider and slot
    W->>S: Create PaymentIntent (manual capture)
    S-->>W: Client secret
    C->>S: Confirm card (test card)
    S-->>W: Authorised
    W->>DB: Create booking status = requested
    DB-->>P: Notify by email
    P->>W: Accept
    W->>DB: status = accepted
    W-->>C: Confirmation email
```

## 3.2 Booking state machine

```mermaid
stateDiagram-v2
    [*] --> requested
    requested --> accepted: provider accepts
    requested --> declined: provider declines
    requested --> cancelled_by_customer: customer cancels
    declined --> requested: customer picks another provider
    accepted --> in_progress: job starts
    accepted --> cancelled_by_customer: customer cancels in window
    accepted --> cancelled_by_provider: provider cancels
    in_progress --> completed_pending: provider marks done
    completed_pending --> completed: 24h without dispute
    completed_pending --> disputed: customer disputes
    disputed --> completed: admin releases
    disputed --> refunded: admin refunds
    cancelled_by_provider --> requested: rematch offered
    completed --> [*]
    refunded --> [*]
    cancelled_by_customer --> [*]
```

Payment rules by state:

| State | Payment action |
|---|---|
| requested | Authorised, not captured |
| accepted | Still authorised |
| completed | Captured; provider payout scheduled |
| disputed | Capture paused |
| refunded | Authorisation cancelled or refunded |
| cancelled by customer in window | Authorisation cancelled, no charge |
| cancelled by customer outside window | Cancellation fee captured (amount set in config) |

## 3.3 Provider onboarding and verification

```mermaid
flowchart TD
    A[Apply online] --> B[Upload ID and right-to-work proof]
    B --> C[Connect payout account via Stripe test mode]
    C --> D{Admin review}
    D -->|Pass| E[Verified: listed in pilot postcode]
    D -->|Missing info| F[Request more; provider notified]
    F --> B
    D -->|Fail| G[Rejected; reason stored, appeal allowed once]
    E --> H[Set availability]
    H --> I[Ready for jobs]
```

## 3.4 Job completion and review

```mermaid
flowchart LR
    A[Provider marks job complete] --> B[Photos uploaded]
    B --> C{Customer disputes within 24h?}
    C -->|No| D[Payment captured and released]
    C -->|Yes| E[Dispute opened, capture paused]
    E --> F[Admin reviews evidence]
    F --> G[Refund, partial, or release]
    D --> H[Review invitation sent]
    G --> H
    H --> I{Review submitted?}
    I -->|Yes, once per booking| J[Rating published to provider profile]
    I -->|No| K[No review]
```

## 3.5 Admin dispute handling

```mermaid
flowchart TD
    A[Dispute opened] --> B[Freeze payment]
    B --> C[Notify both parties, request evidence within 48h]
    C --> D[Admin reviews photos, messages, booking record]
    D --> E{Decision}
    E -->|Provider fault| F[Full refund to customer]
    E -->|Customer fault| G[Release payment to provider]
    E -->|Shared| H[Partial refund, rest released]
    F --> I[Log decision and reason]
    G --> I
    H --> I
```
