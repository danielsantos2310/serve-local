# 10 — Public beta: launch and admin steps

This page describes the **current** version. Where it differs from the earlier pilot plan (docs 00 to 09), this page wins. Those earlier pages still describe the later paid release.

## What is live

| Part | Status |
|---|---|
| Supabase project `serve-local-beta` (London) | Created, schema applied (migrations 0001 to 0003) |
| Database access rules (row-level security) | Applied and tested (11 checks, all pass) |
| Front end (static site) | Built in the repository root |
| GitHub repository | Public, see the repository page |
| GitHub Pages | Enable it in the repository settings (step 1 below) |

## Free periods

Set in the database table `beta_config`, so they can be changed without a code release:

| Setting | Value | Applies to |
|---|---|---|
| `customer_free_months` | 3 | Set on each customer's profile at sign-up |
| `provider_free_months` | 5 | Set on each provider profile at application |

The free period is stored on the profile (`free_until`). Only an admin can change it. Users see the date on their pages.

## Launch checklist (owner)

1. **Turn on GitHub Pages.** In the repository: Settings, Pages, Source "Deploy from a branch", branch `main`, folder `/` (root). The site will then be at `https://danielsantos2310.github.io/serve-local/`.
2. **Set the Supabase auth URLs.** In the Supabase dashboard for `serve-local-beta`: Authentication, URL configuration. Set the Site URL to the Pages address, and add it to the redirect URLs. Without this, email confirmation links will not return users to the site.
3. **Decide on email confirmation.** The default Supabase email sending is limited in volume. For a public beta, either set up custom SMTP (a free tier is available from some providers) or accept that sign-ups may be slow on busy days.
4. **Sign up with your own account**, then make it an admin. Open `scripts/make-admin.sql`, put in your email, and run it in the Supabase SQL editor.
5. **Recruit and check providers by hand.** Nothing appears in search until an admin approves the provider. Approval is a manual check of identity and right to work, done outside the app for now.
6. **Get a solicitor to review** the About page notice and the terms before inviting the general public. The About page says so, and the text is marked as a draft.

## Admin routine (weekly during the beta)

- Open **Admin** in the menu.
- Approve, reject or suspend provider applications. Keep a note of why, outside the app, until an audit feature exists.
- Read the **Feedback** list and log items in your own tracker.
- Check **Bookings by status**. Watch for requests that stay in "requested" for a long time, which means providers are not responding.

## What users can do (beta)

| Action | Who |
|---|---|
| Browse verified providers, filter by service and area | Anyone |
| Sign up, sign in | Anyone |
| Send a booking request, cancel it | Customers |
| Accept, decline, complete, cancel a booking | Providers (for their own bookings) |
| Leave one review per completed booking | Customers |
| Apply to offer services, set rates | Signed-in users |
| Send feedback | Signed-in users |
| Approve, reject, suspend providers; read all bookings and feedback | Admins |

## Deliberately left out of the beta

| Left out | Why |
|---|---|
| Payments, card storage, payouts | Beta is free. Payments come after feedback, with a compliance review first. |
| Uploaded ID documents | Checks are done by hand for now. Upload and private storage come in the next version. |
| Disputes process in the app | Use feedback and the admin routine for now. |
| Customer names visible to providers | Privacy. Providers see the booking details, not who booked. |
| Availability calendar | Customers choose any future time. Providers accept or decline. |
| Notifications by email | Users check My bookings. |
| Data export and account deletion in the app | Handled by hand on request, through feedback. Must be built before a wider launch. |

## Known limits to tell beta users

- Providers accept or decline requests by hand, so response times vary.
- The number of providers is small at the start, so some areas will have no results.
- The database is on the free Supabase tier. Expect occasional slowness and do not rely on the beta for anything critical.

## Security notes

- The anon key in `config.js` is public by design. Access is controlled by row-level security in the database.
- Two views (`public_providers`, `provider_rating_summary`) run with the owner's rights, on purpose. They expose only safe columns, such as a provider's first name, not their full name. Changing this requires a rewrite of the views.
- The function `current_role_name()` can be called by signed-in and anonymous users. This is required for the access rules, and it returns only the caller's own role.
- Trigger functions cannot be called through the API (migration 0003).
- Run the Supabase security advisor again after each migration.

## Feedback loop

1. Collect feedback in the app, and from direct messages.
2. Each week, record what users asked for and what broke.
3. Decide what to fix before the paid release. Write any decision on charging as a new ADR.
4. Re-run the access-rule checks (see `docs/test-results/`) after each migration.
