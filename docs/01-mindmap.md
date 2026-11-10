# 01 — Mind map

The whole project on one page. Renders on GitHub and in any Mermaid viewer.

```mermaid
mindmap
  root((Serve Local<br/>prototype))
    Problem
      Finding trusted home help
      Lead directories are costly
      No guarantee of repeat work
    Hypothesis
      Hold payment at booking
      Verify providers first
      Reviews only after paid jobs
    Users
      Customers
        Book a clean
        Pay and rate
        Rebook
      Providers
        Apply and verify
        Set availability
        Accept or decline
        Get paid
      Admin
        Approve providers
        Resolve disputes
        Read metrics
    Product
      Booking flow
      Provider onboarding
      Payments via Stripe test mode
      Reviews
      Notifications by email
      Admin dashboard
    Tech stack free
      Frontend Next.js or plain web
      Hosting Netlify or Cloudflare Pages
      Backend Supabase free tier
      Auth Supabase Auth
      Storage Supabase Storage for ID docs
      Payments Stripe test mode and Connect
      Email Resend or Supabase email
      Analytics PostHog or simple SQL
    Trust and safety
      Manual ID and right-to-work check
      Insurance proof recorded
      Verified-job reviews
      Dispute process
      Data protection UK GDPR
    Compliance
      Stripe test mode only
      Cleaning only
      Worker status risk
        Provider sets price
        Provider can decline
        No platform-set penalties
      Consumer law fake reviews
    Validation
      Pilot one postcode
      12-week timebox
      Repeat rate
      Provider retention
      Gate to robust build
    Risks
      Supply quality
      Cold start
      Classification
      Costs of manual checks
      Test-mode limits
```

## Reading the map

- **Problem and hypothesis** explain why the project exists.
- **Users** are the three sides a booking marketplace must serve.
- **Product** is the minimum we build. Anything not on this branch is out of scope.
- **Tech stack** is entirely free-tier; see [05-free-tech-stack.md](05-free-tech-stack.md).
- **Trust, compliance and risks** are the branches most likely to stop the project, so they get the most scrutiny.
