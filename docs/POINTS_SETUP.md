# Points, login, feedback and sharing

## Database upgrade

For the existing app, run the full contents of
`supabase/migrations/202609250002_points_weekly_access.sql` in Supabase SQL Editor.
The previously applied `202609250001_points_and_auth.sql` is a prerequisite;
do not rerun the original schema or the old migration after upgrading.
The new migration is transactional and can itself be rerun safely.

For a fresh database, apply schema.sql, admin.sql, then migration 001 and 002 in
that order. The new feedback privacy policy uses the existing `is_admin` helper.

The legacy `point_transactions` table is preserved. The application uses
`card_point_accounts` and `card_point_entries`; it does not import legacy balances.
No existing account balance or point history is reset by migration 002.

## Communication update

After migration 002, run `supabase/migrations/202609250003_communication_rewards.sql`.
This extends rewards to question posts and comments/answers on one's own posts.
It applies to new activity; old activity is not retroactively credited.

## Current rules

- New signup: 20 P once per auth account.
- Members who previously received 10 P receive the missing 10 P once, even if
  they already spent their gift. This is recorded as `welcome_adjustment`.
- Each news post about a place: +3 P, including no-stock reports. Question posts earn +1 P.
  Moderation reports do not earn rewards.
- Each comment/answer: +1 P, including question posts and discussion on one's own post.
- First like on another person's post: +1 P, including question posts. Self-likes
  and unliking/re-liking do not earn more points. Like RPC returns the actual award.
- A place costs 5 P for seven days. Returning during that window is free,
  including from another device or via the equivalent database UUID link.
  Free visits do not extend the expiry. A new purchase after expiry costs 5 P.
- Existing place purchases receive a seven-day window measured from their
  original purchase time. Old detail RPC access is revoked; expiry is enforced
  in the database. Duplicate request IDs never cause a second charge.
- In-app feedback: rating 1–5, one-line summary (2–100 characters), and detailed
  feedback (5–2,000 characters). First submission earns 15 P, regardless of rating.
  Account uniqueness and transaction locking prevent duplicate submissions/rewards.
  Feedback is private to its author and administrators; admins can read it in
  the new '앱 후기' tab. This does not reward App Store reviews.
- Post/comment deletion does not reverse rewards. Spam still requires moderation.

Balances and rewards are modified only by database functions/triggers. The client
announces actual ledger entries, not optimistic estimated rewards. Amounts and
expiry are determined by the server. Balances cannot go negative.

## Screens

The map occupies the viewport. Its header, map and tab bar stay fixed while the
selected place and store list scroll inside a single bottom panel. Each store
shows its card-news count using server aggregation (not a limited REST row list).
Counts are visible before paying; loading/errors are not represented as zero.

Balances appear in the home trainer area and the upper-right of the profile's
red trainer card. `/points` explains rules; `/points/history` paginates ledger
entries. Signup explains the welcome gift and point rules. A global notification
shows earned/spent points on signup, reports, comments, likes, purchases and feedback.
Home hosts app sharing and the feedback form; place sharing stays on place screens.

Basic map metadata and individual community posts remain available to signed-in
users so they can discover places and earn points. Paid detail access is not a
confidentiality boundary around the map catalogue or individual community posts.
Functional routes and database access require login; landing/auth/policy pages
remain available before signup.

## Build and verification

`npm run test:points` runs PostgreSQL/PGlite against the real migrations and RLS.
It covers both the original schema and the upgrade: bonuses, duplicate likes,
question-post likes, expiry, UUID aliases, retries, authorization, counts,
feedback validation/privacy and reward uniqueness. It never uses production data.

`npm run build` checks TypeScript and bundles the client; `npx cap sync ios` updates
the iOS assets. Physical-device scrolling, OAuth and share-sheet QA remains manual.
The existing lint script has no ESLint flat config and cannot currently run.

`VITE_PUBLIC_APP_URL` defaults to
`https://jelleo01.github.io/Pokemon-Card-Store-App/`. GitHub Pages builds use
`VITE_BASE_PATH=/Pokemon-Card-Store-App/`; native builds use `/`.
Sharing uses public `?place=...` links, preserves the destination through login,
and never grants free access. Native sharing uses Capacitor Share; browsers use
Web Share or a clipboard/selectable-link fallback.
