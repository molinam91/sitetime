# Eve's Sweets — Order Online

React + Firebase rebuild of the Claude Artifact bakery ordering app. This replaces the
self-publishing-artifact trick (which had an unfixable staleness/caching problem on some
phones and in-app browsers) with a real Firestore database: every device gets menu, price,
and promo changes instantly, with no caching ambiguity, because there's no static HTML page
being re-published — just live reads from Firestore.

All business rules from the original app are preserved exactly:
- Wednesday 4pm order cutoff → ready that Friday (or the following Friday if the cutoff passed)
- Free delivery once $25+ of the $5-tier items (gelatins, rice pudding) are in the cart
- 2-for-$35 bundle on the $20-tier items (odd quantities: pairs discounted, remainder full price)
- Owner-managed promo codes (free delivery, or a free item above a minimum purchase)
- WhatsApp/SMS order alert on checkout, with the exact same message format
- Owner dashboard behind a PIN, with Menu/Catering/Orders/Share-QR/Settings tabs

One thing changed on purpose: **orders are now written straight to Firestore when the
customer places them**, so the Orders tab is a live, real-time list on every device instead
of the old "paste the WhatsApp message to log it" workaround. That workaround existed only
because the old artifact had no real backend — now that there is one, it's no longer needed.
The WhatsApp/SMS "alert the owner" step is still there and unchanged, since that's still how
the owner gets pinged immediately.

## 1. Firebase project

This app is set up to **reuse the existing `sitetime-masterbuilders` Firebase project**
(the same one the SiteTime time-tracking app at the repo root uses), rather than a separate
project. `.env.local` in this folder already has that project's config filled in (it's
gitignored, so re-copy it from `.env.example` + the values in the repo root's `firebase.js`
if you ever lose it locally). Firestore collection names don't collide — SiteTime uses
`employees`/`punches`/`sites`, Eve's Sweets uses `settings`/`menu`/`orders`/`counters` — so
both apps can safely share the project.

Two things still need doing once, in the Firebase console for that project:

1. Enable **Authentication → Sign-in method → Email/Password** (if not already on).
2. In **Authentication → Users**, add exactly one user for Eve's Sweets. Its email doesn't
   matter (customers never see or type it) but it must match `REACT_APP_OWNER_EMAIL` in
   `.env.local` — the default is `owner@eves-sweets.local`. **Its password is the dashboard
   PIN** the baker will type on the "🔒 Baker Login" screen — Firebase requires 6+ characters,
   so something like `eves1234` keeps it PIN-like. (SiteTime doesn't use Firebase Auth at all,
   so there's no naming conflict here either.)

If you'd rather split Eve's Sweets into its own separate Firebase project later, nothing
above is hard to redo — just swap the values in `.env.local` for the new project's config.

## 2. Set the Firestore security rules

**Because this project is shared with SiteTime, don't just paste `firestore.rules` from this
folder in and Publish — that would replace whatever rules currently protect SiteTime's
`employees`/`punches`/`sites` collections.** Instead: open **Firestore Database → Rules** in
the console, copy the *current* rules text out, and merge in the `match` blocks from
`firestore.rules` here (they're scoped to `/settings`, `/menu`, `/orders`, `/counters`, so
they slot in as additional `match` blocks inside the same `service cloud.firestore { match
/databases/{database}/documents { ... } }` wrapper without touching SiteTime's existing
blocks). Short version of what Eve's Sweets' rules do:
- Menu items and business settings: anyone can read (that's the public ordering page),
  only the signed-in owner can write.
- Orders: anyone can create one (that's how customers place orders without an account);
  only the signed-in owner can read, edit, or delete them.
- The shared order-number counter can only ever be incremented by exactly 1 at a time.

**Note on the promo codes / business settings being publicly readable:** this matches the
original app, which embedded its entire settings JSON (including the PIN) in the public page
source — anyone could already view-source it. This rebuild is not a regression on that front,
but if you'd like the dashboard PIN to stop being a plaintext value anywhere, that's already
true here: the real gate is a Firebase Auth password (see step 1.2), and the `pin` field
from the old data is no longer used or stored.

## 3. Import the current live menu (one-time)

The first time you open the dashboard (Settings tab) after deploying with an empty Firestore
database, you'll see an **"Import your current live menu"** button. It seeds Firestore with
the exact menu items, prices, photos, and settings that are live right now on the old
Claude Artifact page (bundled in `src/data/seedData.json`), so you don't have to re-enter
everything by hand. It only appears while the menu collection is empty, so it's safe to run
once and never worry about it again.

## 4. Run it locally

```
npm install
cp .env.example .env.local   # fill in your Firebase config
npm start
```

## 5. Deploy

Any static host works since this is a plain Create React App build (`npm run build` produces
a `build/` folder). Netlify and Vercel both auto-detect this; just set the same
`REACT_APP_FIREBASE_*` / `REACT_APP_OWNER_EMAIL` environment variables in their project
settings that you used in `.env.local`. Once deployed, share the new URL (Dashboard → Share/QR
tab has a QR code + copy-link button) — this is the one-time link change the original handoff
doc already flagged as an accepted cost of moving off Claude Artifact hosting.

## Notes for whoever maintains this next

- Photos are still stored as base64 JPEGs (resized to ~380px, quality 0.55) directly on each
  menu item's Firestore document — same approach as before, but the old app's real bug (an
  11-item menu growing into a single 1.5MB JSON blob that took 20–30s to save) can't happen
  anymore, because every item is now its own small Firestore document that saves independently
  and instantly. Firestore's 1MiB-per-document limit is nowhere close to being hit by a single
  resized photo.
- The dashboard "PIN" is the password of one fixed Firebase Auth account (see step 1.4). This
  is what makes the Firestore write rules enforceable server-side — the original PIN check ran
  entirely in client JS with no backend to actually stop a determined visitor.
- `src/lib/business.js` holds every pure business rule (cutoff date math, both promos, promo
  code logic, the WhatsApp/SMS message format) as plain functions with no React or Firebase
  dependency, ported directly from the original single-file app.
