/* Serve Local — public beta front end.
 * Plain JavaScript, no build step. All access rules live in Postgres (row-level security),
 * so this file is not trusted with anything sensitive. */
(() => {
  "use strict";

  const cfg = window.SERVE_LOCAL_CONFIG;
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);

  const state = {
    user: null,
    profile: null,
    provider: null,
    services: [],
    filter: { service: "", area: "" },
    nextFlash: null,
  };

  const view = document.getElementById("view");
  const nav = document.getElementById("nav");

  /* ---------- helpers ---------- */
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const gbp = (pence) => "£" + (Number(pence || 0) / 100).toFixed(2);
  const when = (iso) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  const day = (iso) => new Date(iso).toLocaleDateString("en-GB", { dateStyle: "long" });
  const label = (s) => String(s || "").replace(/_/g, " ");

  function friendly(err) {
    const m = err?.message || "Something went wrong. Please try again.";
    const map = [
      ["booking must be in the future", "Please choose a time in the future."],
      ["not available for bookings", "This provider is not taking bookings right now."],
      ["does not offer that service", "This provider does not offer that service."],
      ["already applied", "You have already applied to offer services."],
      ["role change not allowed", "That change is not allowed."],
      ["free period cannot be changed", "That change is not allowed."],
      ["row-level security", "You do not have permission to do that."],
    ];
    const hit = map.find(([k]) => m.includes(k));
    return hit ? hit[1] : m;
  }

  function flash(msg, kind = "ok", next = false) {
    if (!next) {
      const el = document.getElementById("flash");
      if (el) { el.className = `notice ${kind}`; el.textContent = msg; el.hidden = false; return; }
    }
    state.nextFlash = { msg, kind };
  }

  function freeNote() {
    const until = state.provider?.free_until ?? state.profile?.free_until;
    if (!state.user || !until) return "";
    const who = state.provider ? "provider" : "customer";
    return `<p class="free-note">Free beta: your ${who} access is free until ${esc(day(until))}. We will tell you before anything is charged.</p>`;
  }

  function pageStart() {
    let note = "";
    if (state.nextFlash) {
      note = `<div class="notice ${esc(state.nextFlash.kind)}">${esc(state.nextFlash.msg)}</div>`;
      state.nextFlash = null;
    }
    return `<div id="flash" class="notice" hidden></div>${note}${freeNote()}`;
  }

  const page = (html) => { view.innerHTML = pageStart() + html; };

  function localInput(offsetMinutes = 60) {
    const d = new Date(Date.now() + offsetMinutes * 60000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  function need() {
    if (state.user) return true;
    state.nextFlash = { msg: "Please sign in first.", kind: "warn" };
    location.hash = "#/sign-in";
    return false;
  }

  async function loadServices() {
    const { data } = await sb.from("services").select("*").eq("active", true).order("min_rate_pence");
    state.services = data ?? [];
  }

  async function refreshAuth() {
    const { data } = await sb.auth.getSession();
    state.user = data.session?.user ?? null;
    state.profile = null;
    state.provider = null;
    if (state.user) {
      const [{ data: p }, { data: pp }] = await Promise.all([
        sb.from("profiles").select("*").eq("id", state.user.id).maybeSingle(),
        sb.from("provider_profiles").select("*").eq("profile_id", state.user.id).maybeSingle(),
      ]);
      state.profile = p;
      state.provider = pp;
    }
  }

  async function setBookingStatus(id, status) {
    const { error } = await sb.from("bookings").update({ status }).eq("id", id);
    if (error) throw new Error(friendly(error));
  }

  async function setProviderStatus(id, status) {
    const { error } = await sb.from("provider_profiles").update({ status }).eq("id", id);
    if (error) throw new Error(friendly(error));
  }

  /* ---------- pages ---------- */
  async function renderHome() {
    if (!state.services.length) await loadServices();
    const [{ data: providers }, { data: offers }, { data: ratings }] = await Promise.all([
      sb.from("public_providers").select("*"),
      sb.from("provider_services").select("provider_id, rate_pence, services(code,label)"),
      sb.from("provider_rating_summary").select("*"),
    ]);

    const offersBy = {};
    (offers ?? []).forEach((o) => { (offersBy[o.provider_id] ||= []).push(o); });
    const ratingBy = Object.fromEntries((ratings ?? []).map((r) => [r.provider_id, r]));
    const f = state.filter;
    const list = (providers ?? []).filter((p) => {
      const offered = offersBy[p.provider_id] ?? [];
      if (f.service && !offered.some((o) => o.services?.code === f.service)) return false;
      if (f.area && !(p.postcode_area || "").toUpperCase().startsWith(f.area.toUpperCase())) return false;
      return true;
    });

    const cards = list.map((p) => {
      const r = ratingBy[p.provider_id];
      const offered = offersBy[p.provider_id] ?? [];
      return `<article class="card">
        <h3>${esc(p.first_name)} <span class="muted small">· ${esc(p.postcode_area || "area not set")}</span></h3>
        <p>${esc(p.bio || "")}</p>
        <p class="muted small">${esc(p.years_experience ?? 0)} years' experience ·
          ${r ? `★ ${esc(r.avg_rating)} (${esc(r.review_count)} review${r.review_count === 1 ? "" : "s"})` : "No reviews yet"}</p>
        <ul class="prices">${offered.map((o) => `<li>${esc(o.services?.label)}: ${gbp(o.rate_pence)} an hour</li>`).join("")}</ul>
        <div class="actions"><a class="button" href="#/book/${esc(p.provider_id)}">Book</a></div>
      </article>`;
    }).join("");

    page(`<h2>Find a cleaner</h2>
      <form id="filter-form" class="row">
        <label>Service
          <select name="service">
            <option value="">All services</option>
            ${state.services.map((s) => `<option value="${esc(s.code)}" ${f.service === s.code ? "selected" : ""}>${esc(s.label)}</option>`).join("")}
          </select>
        </label>
        <label>Area (start of postcode, e.g. E8)
          <input name="area" value="${esc(f.area)}" maxlength="4" placeholder="Any">
        </label>
        <div><button type="submit">Search</button></div>
      </form>
      <div class="stack" style="margin-top:18px">
        ${cards || `<div class="notice warn">No cleaners match yet. The beta is growing, so check back soon, or tell us what you need in <a href="#/feedback">feedback</a>.</div>`}
      </div>`);
  }

  function renderAbout() {
    page(`<h2>About the beta</h2>
      <p>Serve Local helps people find trusted local cleaners, with a booking request sent through the site.
      This is a free public beta. We want your feedback before we decide how the service should work.</p>
      <h3>What is free, and for how long</h3>
      <ul>
        <li><strong>Customers:</strong> free for 3 months from when you sign up.</li>
        <li><strong>Providers:</strong> free for 5 months from when you apply to offer services.</li>
      </ul>
      <p>Nothing is charged during the beta, and no payment details are taken. Before we charge anything,
      we will tell you what it costs and give you a clear way to decide.</p>
      <h3>What is offered</h3>
      <p>Home cleaning only. We do not offer gas, electrical, childcare or other regulated work.</p>
      <h3>How providers are checked</h3>
      <p>Every provider is reviewed by hand before they appear in search. Providers are self-employed
      and responsible for their own work and insurance. Reviews can only be left after a completed booking.</p>
      <h3>Your information</h3>
      <p>We store your name, email, postcode, bookings, reviews and any feedback you send. Customers can see a
      provider's first name, area, bio and rates. Providers can see booking dates, services and notes, but not
      customers' names. To ask for a copy of your data or for your account to be deleted, use the feedback form.</p>
      <p class="muted small">Draft notice for the beta. It must be reviewed by a solicitor before a wider launch.</p>`);
  }

  function renderSignIn() {
    if (state.user) { location.hash = "#/bookings"; return; }
    page(`<h2>Sign in</h2>
      <form id="signin-form" class="stack">
        <label>Email <input name="email" type="email" required autocomplete="email"></label>
        <label>Password <input name="password" type="password" required autocomplete="current-password"></label>
        <button type="submit">Sign in</button>
      </form>
      <p class="muted">New here? <a href="#/sign-up">Create an account</a>.</p>`);
  }

  function renderSignUp() {
    if (state.user) { location.hash = "#/bookings"; return; }
    page(`<h2>Create an account</h2>
      <form id="signup-form" class="stack">
        <label>Your name <input name="full_name" required maxlength="100" autocomplete="name"></label>
        <label>Email <input name="email" type="email" required autocomplete="email"></label>
        <label>Password (at least 8 characters) <input name="password" type="password" required minlength="8" autocomplete="new-password"></label>
        <button type="submit">Create account</button>
      </form>
      <p class="muted small">By signing up you agree this is a beta. Read <a href="#/about">what the beta includes</a>.</p>`);
  }

  async function renderBook(providerId) {
    if (!need()) return;
    if (!providerId) { location.hash = "#/"; return; }
    const [{ data: prov }, { data: offers }] = await Promise.all([
      sb.from("public_providers").select("*").eq("provider_id", providerId).maybeSingle(),
      sb.from("provider_services").select("rate_pence, service_id, services(id,code,label)").eq("provider_id", providerId),
    ]);
    if (!prov || !offers?.length) {
      page(`<div class="notice warn">This provider is not available for bookings.</div><a href="#/">Back to search</a>`);
      return;
    }
    page(`<h2>Book ${esc(prov.first_name)}</h2>
      <form id="book-form" class="stack" data-provider="${esc(providerId)}">
        <label>Service
          <select name="service" required>
            ${offers.map((o) => `<option value="${esc(o.service_id)}" data-rate="${o.rate_pence}">${esc(o.services?.label)} · ${gbp(o.rate_pence)} an hour</option>`).join("")}
          </select>
        </label>
        <label>Date and time <input type="datetime-local" name="starts" required min="${localInput()}"></label>
        <label>Hours <input type="number" name="hours" min="1" max="12" step="0.5" value="2" required></label>
        <label>Notes for ${esc(prov.first_name)} (optional)
          <textarea name="notes" maxlength="500" placeholder="Access, pets, what needs doing"></textarea>
        </label>
        <p id="estimate" class="muted"></p>
        <p class="muted small">This sends a request. ${esc(prov.first_name)} can accept or decline it. No payment is taken in the beta.</p>
        <button type="submit">Send booking request</button>
      </form>`);
    updateEstimate(document.getElementById("book-form"));
  }

  function updateEstimate(form) {
    if (!form) return;
    const rate = Number(form.service.selectedOptions[0]?.dataset.rate || 0);
    const hours = Number(form.hours.value || 0);
    document.getElementById("estimate").textContent =
      `Estimated price: ${gbp(rate * hours)} (${gbp(rate)} an hour × ${hours} hours).`;
  }

  async function renderBookings() {
    if (!need()) return;
    const { data: rows, error } = await sb.from("bookings")
      .select("*, services(label)").eq("customer_id", state.user.id).order("starts_at", { ascending: false });
    if (error) throw new Error(friendly(error));
    const ids = (rows ?? []).map((r) => r.id);
    const [{ data: revs }, { data: names }] = await Promise.all([
      ids.length ? sb.from("reviews").select("booking_id").in("booking_id", ids) : Promise.resolve({ data: [] }),
      sb.from("public_providers").select("provider_id, first_name"),
    ]);
    const reviewed = new Set((revs ?? []).map((r) => r.booking_id));
    const nameOf = Object.fromEntries((names ?? []).map((n) => [n.provider_id, n.first_name]));

    const items = (rows ?? []).map((b) => {
      const actions = [];
      if (["requested", "accepted"].includes(b.status)) {
        actions.push(`<button class="secondary" data-action="cancel-customer" data-id="${esc(b.id)}">Cancel</button>`);
      }
      if (b.status === "completed" && !reviewed.has(b.id)) {
        actions.push(`<form class="review-form" data-booking="${esc(b.id)}">
          <div class="row">
            <label>Rating <select name="rating">${[5, 4, 3, 2, 1].map((n) => `<option value="${n}">${n} star${n === 1 ? "" : "s"}</option>`).join("")}</select></label>
          </div>
          <label>How did it go? <textarea name="body" maxlength="1000"></textarea></label>
          <button type="submit">Leave review</button>
        </form>`);
      }
      return `<article class="card">
        <h3>${esc(b.services?.label)} with ${esc(nameOf[b.provider_id] || "your provider")}</h3>
        <p><span class="status">${esc(label(b.status))}</span></p>
        <p class="muted small">${esc(when(b.starts_at))} · ${esc(b.hours)} hours · ${gbp(b.agreed_price_pence)}</p>
        ${b.notes ? `<p class="small">${esc(b.notes)}</p>` : ""}
        <div class="actions">${actions.join("")}</div>
      </article>`;
    }).join("");

    page(`<h2>My bookings</h2>
      ${items || `<div class="notice warn">No bookings yet. <a href="#/">Find a cleaner</a> to get started.</div>`}`);
  }

  async function renderProvider() {
    if (!need()) return;
    const pp = state.provider;
    if (!pp) {
      page(`<h2>Offer your services</h2>
        <p>You have not applied yet.</p>
        <a class="button" href="#/apply">Apply to offer services</a>`);
      return;
    }
    if (pp.status === "applied") {
      page(`<h2>Your application</h2>
        <div class="notice warn">Application received. We check every provider by hand before you appear in search.
        We will be in touch if we need anything else.</div>`);
      return;
    }
    if (pp.status === "rejected") {
      page(`<h2>Your application</h2><div class="notice error">We could not approve this application.
        Send us a note through <a href="#/feedback">feedback</a> if you want to know more.</div>`);
      return;
    }
    if (pp.status === "suspended") {
      page(`<h2>Your profile</h2><div class="notice warn">Your profile is paused while we review it.
        Contact us through <a href="#/feedback">feedback</a>.</div>`);
      return;
    }

    const [{ data: rows }, { data: mine }] = await Promise.all([
      sb.from("bookings").select("*, services(label)").eq("provider_id", pp.id).order("starts_at"),
      sb.from("provider_services").select("rate_pence, services(label)").eq("provider_id", pp.id),
    ]);
    const card = (b) => {
      const actions = [];
      if (b.status === "requested") {
        actions.push(`<button data-action="accept" data-id="${esc(b.id)}">Accept</button>`);
        actions.push(`<button class="danger" data-action="decline" data-id="${esc(b.id)}">Decline</button>`);
      }
      if (b.status === "accepted") {
        actions.push(`<button data-action="complete" data-id="${esc(b.id)}">Mark as done</button>`);
        actions.push(`<button class="secondary" data-action="cancel-provider" data-id="${esc(b.id)}">Cancel</button>`);
      }
      return `<article class="card">
        <h3>${esc(b.services?.label)}</h3>
        <p><span class="status">${esc(label(b.status))}</span></p>
        <p class="muted small">${esc(when(b.starts_at))} · ${esc(b.hours)} hours · ${gbp(b.agreed_price_pence)}</p>
        ${b.notes ? `<p class="small">Notes: ${esc(b.notes)}</p>` : ""}
        <div class="actions">${actions.join("")}</div>
      </article>`;
    };
    const section = (title, status) => {
      const list = (rows ?? []).filter((b) => b.status === status);
      return `<h3>${title}</h3>${list.map(card).join("") || `<p class="muted small">Nothing here.</p>`}`;
    };

    page(`<h2>Your provider page</h2>
      <p class="muted small">Services: ${(mine ?? []).map((m) => `${esc(m.services?.label)} at ${gbp(m.rate_pence)} an hour`).join(", ") || "none"}.
      Customers see your first name, area, bio and rates. They do not see your surname.</p>
      ${section("New requests", "requested")}
      ${section("Accepted", "accepted")}
      ${section("Completed", "completed")}`);
  }

  async function renderApply() {
    if (!need()) return;
    if (state.provider) { location.hash = "#/provider"; return; }
    if (!state.services.length) await loadServices();
    page(`<h2>Offer your services</h2>
      <p class="muted">Tell us about you. We check every provider by hand before you appear in search.
      Rates are per hour and must meet the minimum shown. Your profile is free for 5 months from when you apply.</p>
      <form id="apply-form" class="stack">
        <label>Short bio
          <textarea name="bio" maxlength="1000" rows="4" placeholder="Your experience, what you are good at, where you work"></textarea>
        </label>
        <label>Years of experience <input name="years" type="number" min="0" max="80" value="1"></label>
        <label>Full postcode (only the first part is shown to customers) <input name="postcode" maxlength="10" placeholder="E8 1AA"></label>
        <fieldset>
          <legend>Services and hourly rates</legend>
          ${state.services.map((s) => `<div class="svc">
            <label><input type="checkbox" name="svc" value="${esc(s.code)}" data-label="${esc(s.label)}"> ${esc(s.label)}</label>
            <label>Your rate, £ an hour
              <input type="number" name="rate_${esc(s.code)}" min="${s.min_rate_pence / 100}" step="0.5" value="${s.min_rate_pence / 100}">
            </label>
          </div>`).join("")}
        </fieldset>
        <button type="submit">Send application</button>
      </form>`);
  }

  async function renderAdmin() {
    if (!need()) return;
    if (state.profile?.role !== "admin") {
      page(`<div class="notice error">This page is for beta admins only.</div>`);
      return;
    }
    const [{ data: apps }, { data: fb }, { data: bks }] = await Promise.all([
      sb.from("provider_profiles").select("id, status, bio, years_experience, created_at, profiles(full_name, postcode)").order("created_at", { ascending: false }),
      sb.from("feedback").select("*").order("created_at", { ascending: false }).limit(100),
      sb.from("bookings").select("status"),
    ]);
    const counts = {};
    (bks ?? []).forEach((b) => { counts[b.status] = (counts[b.status] || 0) + 1; });

    const actionsFor = (s) => ({
      applied: ["approve", "reject"],
      verified: ["suspend"],
      suspended: ["approve"],
      rejected: ["approve"],
    })[s] || [];
    const names = { approve: "Approve", reject: "Reject", suspend: "Suspend" };

    const rows = (apps ?? []).map((a) => `<tr>
      <td>${esc(a.profiles?.full_name)}<div class="muted small">${esc(a.profiles?.postcode || "")}</div></td>
      <td>${esc(a.years_experience ?? 0)} yrs</td>
      <td><span class="status">${esc(a.status)}</span></td>
      <td class="small">${esc(a.bio || "")}</td>
      <td>${actionsFor(a.status).map((act) =>
        `<button class="${act === "approve" ? "" : "secondary"} small" data-action="${act}-provider" data-id="${esc(a.id)}">${names[act]}</button>`).join(" ")}</td>
    </tr>`).join("");

    const fbRows = (fb ?? []).map((f) => `<tr>
      <td class="small">${esc(when(f.created_at))}</td>
      <td>${esc(f.kind)}</td>
      <td>${esc(f.message)}<div class="muted small">${esc(f.page || "")}</div></td>
    </tr>`).join("");

    page(`<h2>Beta admin</h2>
      <h3>Bookings by status</h3>
      <p>${Object.entries(counts).map(([k, v]) => `${esc(label(k))}: <strong>${v}</strong>`).join(" · ") || "No bookings yet."}</p>
      <h3>Provider applications</h3>
      <div style="overflow-x:auto"><table>
        <thead><tr><th>Name</th><th>Experience</th><th>Status</th><th>Bio</th><th></th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5" class="muted">No applications yet.</td></tr>`}</tbody>
      </table></div>
      <h3>Feedback</h3>
      <div style="overflow-x:auto"><table>
        <thead><tr><th>When</th><th>Kind</th><th>Message</th></tr></thead>
        <tbody>${fbRows || `<tr><td colspan="3" class="muted">No feedback yet.</td></tr>`}</tbody>
      </table></div>`);
  }

  function renderFeedback() {
    if (!state.user) {
      page(`<h2>Send feedback</h2>
        <p>Please <a href="#/sign-in">sign in</a> so we can follow up with you if needed.</p>`);
      return;
    }
    page(`<h2>Send feedback</h2>
      <p class="muted">Bugs, confusing bits, ideas, or anything you would like to see. This helps us decide what to build next.</p>
      <form id="feedback-form" class="stack">
        <label>Type
          <select name="kind">
            <option value="bug">Something is broken</option>
            <option value="idea">An idea</option>
            <option value="praise">Something works well</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>Your message <textarea name="message" required minlength="5" maxlength="2000" rows="5"></textarea></label>
        <button type="submit">Send</button>
      </form>`);
  }

  /* ---------- router ---------- */
  const routes = {
    "": renderHome,
    about: renderAbout,
    "sign-in": renderSignIn,
    "sign-up": renderSignUp,
    book: renderBook,
    bookings: renderBookings,
    provider: renderProvider,
    apply: renderApply,
    admin: renderAdmin,
    feedback: renderFeedback,
  };

  function renderNav() {
    const links = [["#/", "Find a cleaner"], ["#/about", "About the beta"]];
    if (state.user) {
      links.push(["#/bookings", "My bookings"]);
      links.push(state.provider ? ["#/provider", "My provider page"] : ["#/apply", "Offer services"]);
      if (state.profile?.role === "admin") links.push(["#/admin", "Admin"]);
    }
    links.push(["#/feedback", "Feedback"]);
    nav.innerHTML = links.map(([h, t]) => `<a href="${h}">${esc(t)}</a>`).join("") +
      (state.user
        ? `<button class="link" data-action="signout">Sign out</button>`
        : `<a href="#/sign-in">Sign in</a> <a class="button small" href="#/sign-up">Sign up</a>`);
  }

  let routeSeq = 0;
  async function route() {
    const seq = ++routeSeq;
    try {
      await refreshAuth();
      if (seq !== routeSeq) return;
      const [name, arg] = location.hash.replace(/^#\/?/, "").split("/");
      const fn = routes[name || ""] || renderHome;
      renderNav();
      view.innerHTML = `<p class="muted">Loading…</p>`;
      await fn(arg ? decodeURIComponent(arg) : "");
    } catch (e) {
      if (seq !== routeSeq) return;
      view.innerHTML = `${pageStart()}<div class="notice error">${esc(friendly(e))}</div>`;
    }
  }

  /* ---------- events (delegated, so re-rendering is safe) ---------- */
  view.addEventListener("submit", async (e) => {
    const form = e.target;
    e.preventDefault();
    const btn = form.querySelector("button[type=submit]");
    if (btn) btn.disabled = true;
    try {
      if (form.id === "filter-form") {
        state.filter = { service: form.service.value, area: form.area.value.trim() };
        return route();
      }

      if (form.id === "signin-form") {
        const { error } = await sb.auth.signInWithPassword({
          email: form.email.value.trim(), password: form.password.value,
        });
        if (error) throw error;
        location.hash = "#/bookings";
        return;
      }

      if (form.id === "signup-form") {
        const { data, error } = await sb.auth.signUp({
          email: form.email.value.trim(),
          password: form.password.value,
          options: { data: { full_name: form.full_name.value.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          flash("Check your email and click the confirmation link. Then sign in.", "ok");
          return;
        }
        location.hash = "#/bookings";
        return;
      }

      if (form.id === "book-form") {
        const { error } = await sb.from("bookings").insert({
          customer_id: state.user.id,
          provider_id: form.dataset.provider,
          service_id: form.service.value,
          starts_at: new Date(form.starts.value).toISOString(),
          hours: Number(form.hours.value),
          notes: form.notes.value.trim() || null,
        });
        if (error) throw error;
        flash("Booking request sent. You will see the status under My bookings.", "ok", true);
        location.hash = "#/bookings";
        return;
      }

      if (form.classList.contains("review-form")) {
        const { error } = await sb.from("reviews").insert({
          booking_id: form.dataset.booking,
          rating: Number(form.rating.value),
          body: form.body.value.trim() || null,
        });
        if (error) throw error;
        flash("Thank you for your review.", "ok", true);
        return route();
      }

      if (form.id === "apply-form") {
        const services = [];
        for (const cb of form.querySelectorAll('input[name="svc"]:checked')) {
          const rate = form.querySelector(`input[name="rate_${cb.value}"]`);
          const pounds = Number(rate.value);
          const min = Number(rate.min);
          if (!(pounds >= min)) throw new Error(`The rate for ${cb.dataset.label} must be at least £${min} an hour.`);
          services.push({ code: cb.value, rate_pence: Math.round(pounds * 100) });
        }
        if (!services.length) throw new Error("Choose at least one service.");
        const { error } = await sb.rpc("apply_as_provider", {
          p_bio: form.bio.value.trim(),
          p_years: Number(form.years.value || 0),
          p_postcode: form.postcode.value.trim(),
          p_services: services,
        });
        if (error) throw error;
        flash("Application sent. We check every provider by hand before they appear in search.", "ok", true);
        location.hash = "#/provider";
        return;
      }

      if (form.id === "feedback-form") {
        const { error } = await sb.from("feedback").insert({
          user_id: state.user.id,
          kind: form.kind.value,
          message: form.message.value.trim(),
          page: location.hash.slice(0, 200) || "#/",
        });
        if (error) throw error;
        form.reset();
        flash("Thank you. Your feedback has been received.", "ok");
        return;
      }
    } catch (err) {
      flash(friendly(err), "error");
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  view.addEventListener("input", (e) => {
    if (e.target.closest("#book-form")) updateEstimate(e.target.closest("form"));
  });

  view.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const { action, id } = btn.dataset;
    btn.disabled = true;
    try {
      if (action === "cancel-customer") await setBookingStatus(id, "cancelled_by_customer");
      else if (action === "accept") await setBookingStatus(id, "accepted");
      else if (action === "decline") await setBookingStatus(id, "declined");
      else if (action === "complete") await setBookingStatus(id, "completed");
      else if (action === "cancel-provider") await setBookingStatus(id, "cancelled_by_provider");
      else if (action === "approve-provider") await setProviderStatus(id, "verified");
      else if (action === "reject-provider") await setProviderStatus(id, "rejected");
      else if (action === "suspend-provider") await setProviderStatus(id, "suspended");
      else return;
      return route();
    } catch (err) {
      flash(err.message, "error");
      btn.disabled = false;
    }
  });

  nav.addEventListener("click", async (e) => {
    if (e.target.closest("[data-action=signout]")) {
      await sb.auth.signOut();
      location.hash = "#/";
    }
  });

  /* ---------- boot ---------- */
  sb.auth.onAuthStateChange((event) => {
    if (["INITIAL_SESSION", "SIGNED_IN", "SIGNED_OUT"].includes(event)) route();
  });
  window.addEventListener("hashchange", route);
  loadServices();
})();
