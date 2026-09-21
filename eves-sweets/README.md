# Eve's Sweets — Order Online

React + Netlify rebuild of the Claude Artifact bakery ordering app. This replaces the
self-publishing-artifact trick (which had an unfixable staleness/caching problem on some
phones and in-app browsers) with a real backend: **Netlify Functions** for the API and
**Netlify Blobs** for storage, both built into the same Netlify site — no separate database
account, no separate hosting account, nothing else to sign up for.

All business rules from the original app are preserved exactly:
- Wednesday 4pm order cutoff → ready that Friday (or the following Friday if the cutoff passed)
- Free delivery once $25+ of the $5-tier items (gelatins, rice pudding) are in the cart
- 2-for-$35 bundle on the $20-tier items (odd quantities: pairs discounted, remainder full price)
- Owner-managed promo codes (free delivery, or a free item above a minimum purchase)
- WhatsApp/SMS order alert on checkout, with the exact same message format
- Owner dashboard behind a PIN, with Menu/Catering/Orders/Share-QR/Settings tabs

Two things changed on purpose:
- **Orders are now written straight to the backend when the customer places them**, so the
  Orders tab is a live list on every device instead of the old "paste the WhatsApp message to
  log it" workaround. The WhatsApp/SMS "alert the owner" step is still there too, unchanged.
- **The dashboard PIN now also gates the backend, not just the screen.** The original PIN
  check ran entirely in client JS — nothing stopped a visitor who opened dev tools from
  calling the save logic directly. Here, every write (adding a menu item, changing settings,
  editing orders) requires a signed session token that only a correct PIN can obtain, checked
  inside the Netlify Function itself before it touches storage.

## How the pieces fit together

- **Frontend**: a normal Create React App, in `src/`.
- **Backend**: `netlify/functions/` — plain serverless functions (`settings.js`, `menu.js`,
  `orders.js`, `login.js`, `change-pin.js`), each handling one resource's GET/POST/PUT/DELETE.
- **Storage**: [Netlify Blobs](https://docs.netlify.com/blobs/overview/), a key-value store
  scoped to the site. No setup or connection string needed — `getStore()` inside a Function
  running on Netlify auto-binds to the deploying site. See `netlify/functions/_shared/blobs.js`.
- **Auth**: `login.js` checks a submitted PIN and, on success, returns a signed session token
  (HMAC'd with a `SESSION_SECRET` you set once — see below). The dashboard stores that token
  and sends it as a bearer token on every write; each Function verifies it server-side before
  doing anything. See `netlify/functions/_shared/token.js`.
- **Live updates**: Netlify Blobs has no push/subscribe mechanism like Firestore's, so the
  frontend polls (`src/lib/data.js`) — every 8s for the public menu/settings, every 5s for the
  dashboard's order list — and also refetches immediately after its own writes. This still
  means "no caching ambiguity": every poll is a fresh read from the Function, never a stale
  cached page, which was the actual problem with the old Claude Artifact hosting. It's not
  instant push like Firestore would have been, but it's simple, needs no extra accounts, and
  is more than fast enough for a bakery taking orders.

## Setup

Two environment variables need to be set on the Netlify **site** (Site settings →
Environment variables), not in any local `.env` file — these are server-side secrets used
only inside the Functions, never shipped to the browser:

- `DASHBOARD_PIN` — the PIN used the very first time anyone logs into the dashboard. After
  that first login, the Function stores a hash of it in Blobs and this env var is never read
  again (so "Change PIN" in Settings works from then on without touching Netlify again).
- `SESSION_SECRET` — any long random string (e.g. generate one with
  `openssl rand -hex 32`). Used to sign session tokens and to hash the PIN. Changing it later
  invalidates all existing sessions and the stored PIN hash (which then re-bootstraps from
  `DASHBOARD_PIN` on next login).

No Firebase project, no separate database, no other accounts.

### Deploying

1. In Netlify: **Add new site → Import an existing project → Deploy with GitHub**, pick this
   repo.
2. Build settings:
   - **Base directory:** `eves-sweets`
   - **Build command:** `npm run build`
   - **Publish directory:** `eves-sweets/build` (Netlify may already infer this correctly
     from `netlify.toml` once the base directory is set — the important part either way is
     that it resolves to `eves-sweets/build`)
   - **Functions directory:** resolved from `netlify.toml` (`netlify/functions`, relative to
     the base directory) — shouldn't need manual entry.
3. Set `DASHBOARD_PIN` and `SESSION_SECRET` under Site settings → Environment variables.
4. Deploy. Netlify gives you the live `*.netlify.app` link, and auto-redeploys on every future
   push to this branch.

### Local development

`netlify dev` (from the Netlify CLI) runs the CRA dev server and the Functions together on
one local port, which is what you want for testing the dashboard locally:

```
npm install -g netlify-cli
cd eves-sweets
npm install
netlify dev
```

Plain `npm start` also works for UI-only work, but the dashboard's login/save calls will 404
since there's no Functions runtime behind a plain CRA dev server.

## Import the current live menu (one-time)

The first time you open the dashboard (Settings tab) with an empty menu, you'll see an
**"Import your current live menu"** button. It seeds the backend with the exact menu items,
prices, photos, and settings that are live right now on the old Claude Artifact page (bundled
in `src/data/seedData.json`), so you don't have to re-enter everything by hand. It only
appears while the menu is empty.

## Notes for whoever maintains this next

- Photos are still stored as base64 JPEGs (resized to ~380px, quality 0.55) directly inside
  the menu item's JSON — same approach as before, and still small enough per item (tens of KB)
  that the whole menu blob stays well under any size concern.
- `src/lib/business.js` holds every pure business rule (cutoff date math, both promos, promo
  code logic, the WhatsApp/SMS message format) as plain functions with no React or backend
  dependency, ported directly from the original single-file app.
- Order numbers are assigned read-modify-write inside `orders.js`, not with a truly atomic
  counter — two orders landing in the exact same instant could in theory get the same display
  number. Each order's real identity is its `id` (a UUID), so this is a cosmetic edge case,
  not a data-integrity one; see the comment in `netlify/functions/orders.js` if you want to
  harden it later.
