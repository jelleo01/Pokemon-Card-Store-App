# Login, points and sharing

## Apply the database migration before deploying the client

Run the complete contents of `supabase/migrations/202609250001_points_and_auth.sql`
in your project's Supabase SQL Editor, using the default database-owner role.
The existing `schema.sql` must already be installed. Do not rerun `schema.sql`
on an existing project. The migration is transactional and safe to rerun.

An older `point_transactions` table may already exist. It is deliberately left
untouched: no records are deleted. This release uses `card_point_accounts`,
`card_point_entries`, `card_place_catalog` and `card_place_visits` as a new system.
Old balances are not imported. All existing and new members receive one starting
credit of 10 points in the new system. Legacy triggers may continue maintaining
legacy tables, but those tables are not read or used to spend points by this app.

Rules:

- A profile receives 10 points once per auth account, including existing members.
- Each new `news` post linked to a place earns 3 points, including no-stock reports.
  Questions and moderation/abuse reports do not earn points.
- Each comment on someone else's news post earns 1 point.
- The first like on someone else's news post earns 1 point. Unliking and re-liking
  never earns again. Self-reactions do not earn points.
- Opening the place detail screen costs 5 points after tapping the explicit
  purchase button. A new visit costs 5 again. Retry/refresh in the same mounted
  screen uses the same request ID and cannot charge twice.
- There are no cash payments. Balances cannot go negative. Mutations run only in
  database functions/triggers; API clients cannot edit the ledger or balance.
- Deleting a post/comment does not reverse its reward. Duplicate likes are
  deduplicated; moderation is still needed for spam reports/comments.

Basic map names, locations and individual community posts remain available to
signed-in users, allowing them to discover places and earn points. The paid
screen assembles place details and recent reports via an authenticated paid-visit
RPC. This is not a confidentiality boundary around the public map catalogue or
individual community posts. A visit token is only usable by its owner.

All functional routes require login and a completed trainer profile. Landing,
login, onboarding and policy pages remain public. Restrictive RLS policies also
block anonymous database access to functional tables. Policy metadata remains
public so users can read the terms before registering.

## Sharing and deployments

`VITE_PUBLIC_APP_URL` is the public HTTPS app root. Default:
`https://jelleo01.github.io/Pokemon-Card-Store-App/`.
Place links use `?place=PC-0001` and go through login/onboarding before showing
the paid detail screen. Sending a link does not grant or spend points.
Native iOS uses `@capacitor/share`; supported browsers use Web Share; other
browsers copy the URL or display a selectable link if copying fails.

The GitHub Pages workflow supplies `VITE_BASE_PATH=/Pokemon-Card-Store-App/`.
Keep `VITE_BASE_PATH=/` for native iOS builds. In Supabase Authentication > URL
Configuration, allow your public app URL and its `/login` callback path (including
query parameters according to your project's redirect allowlist configuration).
Existing native OAuth callbacks are unchanged.

After changing the web client, run `npm run build` and `npx cap sync ios` before
building in Xcode. The native share plugin is registered by Capacitor sync.

## Verification

`npm run test:points` runs an isolated PostgreSQL (PGlite) instance with the real
schema, migration, triggers, role grants and RLS policies. It checks onboarding,
rewards, re-like deduplication, self-action exclusion, unauthorized balance edits,
anonymous reads, private visit access, duplicate requests and insufficient funds.
It never connects to production. `npm run build` checks TypeScript and bundles the
client. Physical-device OAuth/share-sheet testing still requires an iPhone.

The repository currently has no ESLint flat config, so the pre-existing
`npm run lint` script cannot run until an ESLint configuration is added.
