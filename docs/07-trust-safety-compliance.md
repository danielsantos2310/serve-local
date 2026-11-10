# 07 — Trust, safety and compliance

This document is a working checklist, not legal advice. Before any real person's data or money enters the pilot, have a UK solicitor review the terms, privacy notice and the provider classification approach.

## 1. Who we protect and how

| Risk | Control in the prototype | Control for a robust build |
|---|---|---|
| Customer harmed by a provider | Manual ID and right-to-work check; insurance proof recorded; verified-job reviews; dispute process | Automated ID checks; background checks (DBS-style where lawful); insurance verification |
| Provider not paid | Payment captured after completion; payout via Stripe Connect; audit log | Automated payout monitoring; reserve policy |
| Fake reviews | Reviews only on completed, paid bookings; one per booking | Review-fraud detection; takedown process (DMCC Act) |
| Data leak | Private storage for ID; RLS; no card data stored | Penetration test; encryption review; retention automation |
| Discrimination or unsafe matching | Customers choose from a list; no algorithmic filtering on protected traits | Equality impact assessment before scaling |
| Under-age or unlawful work | Right-to-work check mandatory; age 18+ only | Same, automated where possible |

## 2. Worker status (classification)

The research found that the decisive facts in UK case law are control, substitution and whether the worker can decline work or set terms. For the prototype we apply these rules to reduce classification risk:

| Do | Do not |
|---|---|
| Let providers set their own rate above a platform minimum | Set a fixed rate the provider cannot change |
| Let providers accept or decline any job without penalty | Penalise declining, or auto-assign jobs |
| Let providers choose their availability | Require minimum hours or shifts |
| Let providers send a substitute with the customer's agreement (where the service allows) | Forbid substitutes |
| Describe providers as independent businesses in the terms | Describe them as employees or use staff-style language |
| Use ratings to inform customers, not to discipline providers automatically | Remove providers automatically for low ratings without a human review |

**Open point:** the tension between efficient matching and worker status is real (see the research report). The prototype avoids the question by not dispatching at all. A robust build must decide this explicitly.

## 3. Consumer law

- **Fake reviews:** since 6 April 2025 the DMCC Act requires platforms to take steps to prevent and remove fake reviews. Our review rules are designed around this; the admin process for removal must be written before the pilot.
- **Price transparency:** the total price, including any platform fee, is shown before payment.
- **Cancellation terms:** shown before payment, with the window and any fee stated.
- **Complaints route:** one clear contact address and a response time (aim for 2 working days).

## 4. Data protection (UK GDPR)

| Item | Prototype approach |
|---|---|
| Lawful basis | Consent at sign-up for marketing; contract for booking; legal obligation for right-to-work checks |
| Privacy notice | Short plain-English notice, reviewed before the pilot |
| Data minimisation | Only collect what each flow needs |
| Retention | ID documents deleted within a fixed period after verification (set in config, e.g. 90 days after the decision, subject to legal advice); booking records kept for the period needed for disputes and tax |
| Subject access requests | Process written down; admin can export a user's data |
| Right to erasure | Process written down; respects legal retention duties |
| Data location | Supabase project in a UK or EU region if available on the free tier; check before creating the project |
| International transfers | Note Stripe, Netlify and Resend process data outside the UK; check their transfer mechanisms |

## 5. Regulated work we avoid in the prototype

| Work | Why excluded | Future route |
|---|---|---|
| Gas work | Gas Safe registration; serious harm risk | Only list Gas Safe registered engineers, checked against the register before listing |
| Electrical work | Part P (England) or RECI/Safe Electric (Ireland) | List only registered installers; check the register |
| Childcare (childminders, nannies) | Ofsted (England); Tusla registration coming (Ireland); vetting | Wait for the Irish regime to settle; DBS and Garda vetting processes |
| Anything involving children or vulnerable adults unsupervised | Safeguarding | Not planned |

## 6. Insurance

- Ask providers to upload their public liability insurance certificate. Record the expiry date and check it at each renewal.
- Do not describe the platform as insured. Insurance on the job belongs to the provider unless the platform buys cover; that decision needs an insurance broker.

## 7. Dispute and incident process

1. Customer or provider raises an issue in the app (or by email).
2. Payment is paused.
3. Both parties get 48 hours to send evidence.
4. Admin decides (full refund, partial, or release) and records the reason.
5. For safety incidents (injury, theft, abuse): stop listings for that provider immediately, preserve evidence, and seek advice on reporting to police. Do not wait for the dispute process.

## 8. Pilot consent and safety checklist

- [ ] Terms and privacy notice reviewed by a solicitor
- [ ] Providers sign an agreement that they are self-employed and responsible for their own insurance
- [ ] Customers accept terms and cancellation policy before first booking
- [ ] Admin trained on the dispute process
- [ ] Incident contact details published
- [ ] ID and right-to-work checks written up as a procedure, with a record of each decision
