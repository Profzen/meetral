# Meetral

Application d'événements (Next.js App Router + Supabase). Tous les montants sont en XOF (entiers) et les flux d'auth utilisent Supabase (signup avec confirmation, mot de passe oublié / reset).

## Démarrage rapide
- Installer les dépendances :
	```powershell
	npm install
	```
- Créer `.env.local` :
	```dotenv
	NEXT_PUBLIC_SUPABASE_URL=https://<votre-projet>.supabase.co
	NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
	SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
	# Optionnel DB pour migrations
	SUPABASE_DB_URL=postgres://postgres:password@db.xxx.supabase.co:5432/postgres
	```
- Lancer les tests unitaires :
	```powershell
	npx vitest run
	```
- Démarrer le serveur dev :
	```powershell
	npm run dev
	```

## Configuration Supabase
- **URLs** (Dashboard → Authentication → URL Configuration)
	- Site URL: votre URL (ex: https://meetral.vercel.app ou http://localhost:3000 en local)
	- Redirect URLs: ajouter au minimum `/auth/confirm` et `/auth/reset` (hash ou query acceptés), plus `/auth/login` si vous redirigez après confirmation.
- **Templates email** : garder `{{ .ConfirmationURL }}` dans Confirm Signup et Reset Password (il pointera vers les URLs ci-dessus).
- **Stockage** : créer un bucket `events` (public ou règles adaptées). Si vous changez de nom, ajustez les appels d'upload.
- **Synchronisation users** : triggers SQL recommandés dans `prisma/migrations/2025-12-19_auto_create_public_user.sql` et `2025-12-19_migrate_existing_users.sql` pour peupler `public.users` depuis `auth.users`.

## Migrations base de données
- Commande :
	```powershell
	npm run migrate:db
	```
- Variables utilisées par le script : `PG_CONNECTION` > `DATABASE_URL` > `SUPABASE_DB_URL`.
- Migrations clés :
	- `2025-12-12_add_lang_price_capacity.sql` (lang, price, capacity)
	- `2025-12-19_auto_create_public_user.sql` (trigger `public.users`)
	- `2025-12-19_migrate_existing_users.sql` (rattrapage des users existants)
	- Indexes/perf: `2025-12-16_add_performance_indexes.sql`

## Architecture et points importants
- **Stack** : Next.js (App Router), Supabase (auth + db + storage), Tailwind/CSS vars, Vitest, Playwright (optionnel).
- **Dossiers clés** :
	- `src/app` : pages (auth/confirm, auth/forgot, auth/reset, events listing/detail/create, dashboard, admin, etc.)
	- `src/components` : EventCard, EventForm, Header, modales, UI partagées
	- `src/lib` : clients Supabase (`supabaseClient`, `supabaseAdmin`), i18n, perf metrics
	- `src/server/api` : routes Next (ex: `/api/events`)
	- `prisma/migrations` : scripts SQL
	- `tests` : unit (Vitest) et e2e (Playwright)
- **Auth flows** :
	- Confirmation : `/auth/confirm` accepte token dans hash ou query, redirige vers `/auth/login` après succès.
	- Mot de passe oublié : `/auth/forgot` envoie un email; `/auth/reset` accepte token hash ou query et met à jour le mot de passe.
- **Monnaie** : XOF affiché via `formatCurrency`, prix saisis en entiers (step=1) et envoyés en entiers au serveur.

## Tests
- Unitaires : `npx vitest run`
- E2E (optionnel) : installer Playwright (`npx playwright install`) puis `npm run test:e2e`

## Dépannage actif
- `/api/events` ou `/api/health` en erreur : vérifier que le serveur dev tourne et que `SUPABASE_SERVICE_ROLE_KEY` est présent dans `.env.local`.
- Upload d'image échoue : confirmer l'existence du bucket `events` et ses droits (public ou politiques RLS adaptées).

## Notes rapides pour l'équipe
- Header mobile montre le `display_name` du profil Supabase après auth; rechargement possible en cas de cache local.
- Les prix et capacities sont coercis côté client et côté API pour éviter les flottants.

