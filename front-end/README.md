# LosttoFound — Frontend

This fills in the `front-end` half of your MERN project with React + React
Router + Tailwind, matching your design mockup. Everything here runs on
**mock data** — no backend required yet — through one file
(`src/services/api.js`), so you can swap in real `fetch()` calls later
without touching any component.

## How to merge this into your existing project

1. Copy everything under `src/` into your `front-end/src/` folder
   (overwrite `App.jsx`, `main.jsx`, `index.css` — everything else is new).
2. Copy `tailwind.config.js` into `front-end/` — **merge** it with your
   existing one if you've already customized it; the important part is the
   `brand` color palette under `theme.extend.colors`.
3. Install the two new dependencies:
   ```
   npm install react-router-dom lucide-react
   ```
4. `npm run dev` and you're up.

I verified this whole set of files compiles cleanly with `vite build` +
Tailwind v3 before sending it to you.

## What's included

- **Login** (`pages/Login.jsx`) — Sign In / Sign Up tabs, Google button (UI
  stub — see note below), matches your mockup.
- **Home** (`pages/Home.jsx`) — hero, "Lost an item? / Found an item?" cards,
  recent lost items row.
- **Lost Items / Found Items** (`pages/LostItems.jsx`, `FoundItems.jsx`) —
  both reuse `components/ItemsListView.jsx` with search + sort.
- **Report Lost / Report Found** (`pages/ReportLostItem.jsx`,
  `ReportFoundItem.jsx`) — both reuse `components/ReportItemForm.jsx`.
  **No photo upload field**, as you asked — matching relies on the written
  description instead.
- **Item Detail** (`pages/ItemDetail.jsx`) — full report + a ranked list of
  possible matches from the opposite list (lost ↔ found).
- **Profile** (`pages/Profile.jsx`) — honor level bar, stats, badges.
- **Navbar / Sidebar** (`components/`) — the top bar + slide-in menu from
  your "Home Page (Sidebar Open)" mockup frame.

## Safety features you asked for

- **Phone verification gate**: `components/OtpField.jsx` + `sendOtp` /
  `verifyOtp` in `services/api.js`. Posting a lost or found report is
  blocked until the number is verified. It's **simulated** right now — any
  6-digit... actually 4-digit code `1234` verifies it, so you can demo the
  full flow with no SMS provider. When your backend is ready, replace the
  bodies of `sendOtp`/`verifyOtp` with real calls to your Express route that
  talks to an SMS API (Twilio, MSG91, etc.) — the component doesn't need to
  change.
- **No photo uploads anywhere** — intentionally left out of the report
  forms.
- **Description-based matching**: `services/matching.js` tokenizes both
  descriptions, scores overlap with a Jaccard similarity, and adds a bonus
  if the item type and general area also match. It returns a 0–100%
  compatibility score, shown as a badge on `MatchList.jsx`. This runs
  entirely client-side against the mock list for now — it's a reasonable
  placeholder algorithm, but you'll likely want to move this logic to your
  Express backend later (and could later upgrade it to embeddings/AI-based
  similarity for smarter matching).

## Wiring up your real backend later

Everything backend-shaped lives in `src/services/api.js` — every function
returns a Promise already, so swap the mock bodies for real `fetch(...)`
calls to your Express routes (e.g. `POST /api/items`, `POST /api/otp/send`)
and nothing in the pages/components needs to change.

## One structural change from your current App.jsx

Your original `App.jsx` wrapped everything in
`<div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">`. I removed that
outer wrapper because the Home hero and Login screen are meant to run
full-width (edge-to-edge green backgrounds, per your mockup) — each page now
manages its own inner `max-w-*` + padding instead. If you were relying on
that wrapper elsewhere, just re-add it around the parts that need it.

## Questions you may want to think about next

- Real OTP: which SMS provider (Twilio, MSG91, Firebase Phone Auth)?
- Real Google login: Firebase Auth or your own OAuth flow?
- Should "This is mine" / "I found this" open a real chat, or just reveal
  contact info after both sides confirm?
- Matching threshold: right now items only show as a "match" above 25%
  compatibility — tune this once you see real data.
