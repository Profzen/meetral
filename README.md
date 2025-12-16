## Supabase Storage - Bucket `events`
We use a storage bucket named `events` for event cover uploads. If uploads fail with `Bucket not found`:

1. Go to the Supabase Console → Storage → Create a new bucket named `events` (public).
2. Make the bucket public or configure the appropriate signed URL access for uploads and public URLs.
3. If you use a different bucket name, update `src/components/events/EventForm.jsx` and the server code accordingly.

### Allow client uploads via storage policy

If you want to allow the client to upload files directly (without server relay), you must ensure the `storage.objects` RLS policy allows authenticated users to insert rows. Run this SQL in the Supabase SQL editor:

```sql
-- Allow authenticated users to insert objects
CREATE POLICY allow_insert_authenticated ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Allow users to read objects (if desired)
CREATE POLICY allow_select_authenticated ON storage.objects
FOR SELECT
TO authenticated
USING (true);
```

Note: For most setups, it's simpler to mark the bucket `events` public in the Supabase Console and use the client to upload as an authenticated user. If you prefer stricter control, keep the bucket private and use server-side uploads (our `/api/upload` route uses service role and avoids client storage policy constraints).

## Debugging API & Health

If the UI reports 404 on `/api/events` or request fails, verify the dev server is running and reachable:

1. Health: Open `http://localhost:3000/api/health` (or proper dev port). Should return `{ ok: true }`.
2. Events: GET `http://localhost:3000/api/events` should return a JSON list or fallback samples.
3. If these return 404 or 500, restart dev server and check terminal logs for errors. Also ensure `SUPABASE_SERVICE_ROLE_KEY` is defined in `.env.local` so `supabaseAdmin` can initialize.


# Meetral

Structure initiale du projet Meetral (Next.js + Supabase).

## Database migration

We added a SQL migration file to add `lang` to the `users` table and `price`/`capacity` to the `events` table.
Run the migration with the following command (powershell):

```powershell
npm run migrate:db
```

The script will look for the DB connection string in the following environment variables in this order:
- `PG_CONNECTION` (explicit override)
- `DATABASE_URL` (common name)
- `SUPABASE_DB_URL` or `SUPABASE_DATABASE_URL` (custom name)

If you use Supabase and your `.env.local` doesn’t currently include the DB connection string, get it from the Supabase Console:

1. Supabase Console → Project → Settings → Database → Connection string
2. Copy the connection string (`postgres://...` or `postgresql://...`) and add it to `.env.local`:

```dotenv
SUPABASE_DB_URL=postgres://postgres:password@db.abcd.supabase.co:5432/postgres
```

Then run:

```powershell
$env:PG_CONNECTION = $env:SUPABASE_DB_URL
npm run migrate:db
```

Alternatively, use the Supabase SQL Editor UI:

1. Supabase Console → Database → SQL Editor → New Query
2. Paste the SQL content of `prisma/migrations/2025-12-12_add_lang_price_capacity.sql`
3. Click Run

## Internationalization (i18n) fallback

We implemented a minimal i18n helper and translations for 'fr' and 'en' using `src/lib/i18n.js` and `UserContext`. It provides a `useTranslation()` hook.

Change the language in the Profile page and it will persist in localStorage and try to persist in the `users.lang` column when you're logged in.

## Tests (unit & e2e)

We added a basic test setup using `vitest` for unit tests and `playwright` for e2e.

- Run unit tests:

```bash
npm run test:unit
```

- Run e2e tests (Playwright requires browsers installation; run the following once):

```bash
npx playwright install
npm run test:e2e
```

Unit tests added:
- `tests/unit/components/EventForm.test.jsx` — covers basic form behavior and submit call
- `tests/unit/pages/OrganizerDashboard.test.jsx` — verify organizer event list rendering
- `tests/unit/pages/EventsListing.test.jsx` — verify listing page fetch and display

If you want more advanced flows (sign-in + create event + dashboard retrieval), we can expand e2e tests next.

