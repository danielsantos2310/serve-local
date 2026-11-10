# 09 — Open questions and risks

## Open questions

| # | Question | Why it matters | How to resolve | Owner |
|---|---|---|---|---|
| Q1 | Will customers pay a platform fee on top of the cleaner's rate? | Decides take rate and the business model | Test two fee levels in Phase 1 | Founder |
| Q2 | What is the right cancellation window? | Protects providers without trapping customers | Use a standard window in Phase 1; review after 20 bookings | Founder |
| Q3 | Can we use a UK-region Supabase project on the free tier? | UK GDPR data location | Check in Supabase console at Phase 0 | Founder |
| Q4 | Do Stripe Connect Express accounts work for sole traders in test mode for our flow? | Core payout path | Build a 1-day spike in Phase 0 | Developer |
| Q5 | What insurance do providers need, and who buys it? | Liability for injury or damage | Speak to an insurance broker | Founder |
| Q6 | Is the provider agreement enough to support self-employed status? | Worker-status risk | Solicitor review before pilot | Founder + solicitor |
| Q7 | What is the Irish childcare regime, and when does it apply? | Only relevant before any childcare listing | Track Tusla announcements; the research flags the deadline as unconfirmed | Founder |
| Q8 | Which postcode area should the pilot use? | Density decides the test | Pick one with a clear cleaner supply and customer demand | Founder |
| Q9 | Is manual ID checking acceptable at 20 providers? | Admin time and consistency | Time it in Phase 1 | Founder |
| Q10 | What is the retention period for ID documents? | UK GDPR minimisation | Solicitor advice | Founder + solicitor |

## Risks

| # | Risk | Likelihood | Impact | Mitigation | Early signal |
|---|---|---|---|---|---|
| R1 | Cold start: no customers, so no providers join; or the reverse | High | High | Start Phase 1 by hand; start with one postcode; recruit providers first and show them demand | Providers sign up but get no jobs |
| R2 | Supply quality: no-shows, poor work, fake profiles | High | High | Manual checks; verified-job reviews; dispute process; quick removal | Dispute rate above 5% |
| R3 | Worker-status challenge | Medium | High | Design rules in [07](07-trust-safety-compliance.md); solicitor review; no dispatch | Provider complaint about control or pay |
| R4 | Costs of manual checks outweigh the income | Medium | Medium | Time each check; batch them; move to automation only when proven | Admin hours per provider rising |
| R5 | Free-tier limits or pausing disrupt the pilot | Medium | Medium | Check limits in Phase 0; keep a backup export; upgrade with an ADR if needed | Project paused or quota errors |
| R6 | Data breach or mishandled ID | Low | Very high | RLS; private bucket; minimal retention; access logging | Unexpected access in logs |
| R7 | Stripe test mode hides real problems (declines, disputes) | High | Medium | Document this gap; plan a live-mode review before scaling | Real declines appear in pilot |
| R8 | Fake reviews | Medium | Medium | Verified-job reviews only; removal process | Sudden rating spikes |
| R9 | Customers refuse the platform fee | Medium | High | Test fee levels; show value (guarantee, dispute cover) | Drop-off at checkout |
| R10 | Founder time: prototype takes longer than planned | High | Medium | Timebox each phase; stop at the gate | Phase overruns by more than 50% |
| R11 | Mis-stated facts from research (undated or secondary figures) | Medium | Medium | Verify before any external claim; see the report's gap table | Conflicting numbers in pitch material |
| R12 | Regulated work creeps in (gas, electrical, childcare) | Medium | Very high | Category allow-list in config; no free-text service names | Requests for excluded categories |

## Known gaps from the research (carry forward)

- Build cost, timeline and team size: not researched
- UK and Irish Stripe fees and identity-check vendor costs: not verified
- Gas Safe rules, landlord duties, Irish gas registration: not retrieved
- Ofsted nanny exemptions and DBS levels; Garda vetting: not retrieved
- Employment Rights Act 2025 implementation and effect on classification: not confirmed
- Supply-side failures at UK and Irish services platforms: not searched (largest gap)
- Dublin trade and childminder counts: not verified

Close these in Phase 0 and Phase 1 where they block a decision. Do not close them from memory.
