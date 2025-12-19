# Architecture Supabase Auth + Table Users

## Comprendre les deux tables

### 1. `auth.users` (Système Supabase)
- **Gérée automatiquement** par Supabase Auth
- Créée par `supabase.auth.signUp()`
- Contient:
  - `id` (UUID) - identifiant unique
  - `email` - l'email de l'utilisateur
  - `encrypted_password` - mot de passe hashé (bcrypt)
  - `email_confirmed_at` - date de confirmation email
  - `raw_user_meta_data` - données personnalisées (display_name, role_request, etc.)
  - `created_at`, `updated_at`, `last_sign_in_at`
- **Tu n'y accèdes JAMAIS directement** dans ton code
- Visible dans: Dashboard Supabase → Authentication → Users

### 2. `public.users` (Ta table métier)
- **Tu dois la remplir toi-même**
- Contient:
  - `user_id` (UUID, FK vers auth.users.id)
  - `role` (admin, user, organisateur)
  - `display_name`
  - `lang`, `price`, `capacity`
  - `created_at`
- Utilisée pour:
  - Permissions personnalisées (RLS policies)
  - Relations avec events, tickets, favorites
  - Données métier de ton app

## Comment ça fonctionne ensemble?

### Lors de l'inscription (`signUp`)
1. L'utilisateur remplit le formulaire de register
2. `supabase.auth.signUp({ email, password, options: { data: {...} } })`
3. Supabase crée automatiquement une entrée dans `auth.users`
4. Les données dans `options.data` sont stockées dans `raw_user_meta_data`
5. **PROBLÈME**: `public.users` n'est PAS remplie automatiquement

### Lors de la connexion (`signIn`)
1. L'utilisateur entre email + password
2. `supabase.auth.signInWithPassword({ email, password })`
3. Supabase compare avec `auth.users.encrypted_password`
4. Si correct, crée une session JWT
5. **L'authentification fonctionne même si `public.users` est vide**

### Pourquoi on a besoin de `public.users`?
- Pour les RLS policies (ex: `auth.uid() = user_id`)
- Pour les relations (FK events.organizer_id → users.user_id)
- Pour stocker le rôle métier (admin, organisateur)
- Pour les requêtes business (liste des organisateurs, etc.)

## Solutions pour synchroniser

### Solution 1: Trigger automatique (RECOMMANDÉ ✅)
Créer un trigger PostgreSQL qui insère dans `public.users` à chaque nouveau `auth.users`:

```sql
-- Voir: prisma/migrations/2025-12-19_auto_create_public_user.sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Avantages:**
- Automatique, pas besoin de code côté app
- Fonctionne avec tous les modes d'inscription (email/password, OAuth, magic link)
- Impossible d'oublier

### Solution 2: Appel API après signUp
Dans `register/page.jsx`, après `signUp` réussi, appeler `/api/create-profile`:

```javascript
const { data, error } = await supabase.auth.signUp({...});
if (!error && data.user) {
  // Créer le profil dans public.users
  await fetch('/api/create-profile', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.session.access_token}`
    },
    body: JSON.stringify({ 
      role: roleRequest, 
      display_name: displayName 
    })
  });
}
```

**Inconvénients:**
- Code dupliqué si plusieurs points d'inscription
- Peut échouer si problème réseau
- OAuth/magic link nécessitent un hook séparé

## Migration des users existants

Si tu as déjà des users dans `auth.users` mais pas dans `public.users`:

```sql
-- Voir: prisma/migrations/2025-12-19_migrate_existing_users.sql
INSERT INTO public.users (user_id, role, display_name, created_at)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'role_request', 'user'),
  raw_user_meta_data->>'display_name',
  created_at
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.users);
```

## FAQ

### Pourquoi je ne vois pas la colonne `password` dans `public.users`?
Parce que les mots de passe sont dans `auth.users.encrypted_password` (table système). Tu n'as JAMAIS besoin de gérer les passwords toi-même avec Supabase Auth.

### Comment Supabase compare les passwords lors du login?
1. Tu appelles `signInWithPassword({ email, password })`
2. Supabase cherche dans `auth.users` par email
3. Compare `password` (clair) avec `encrypted_password` (hashé bcrypt)
4. Retourne une session JWT si correct

### Puis-je accéder à `auth.users` depuis mon code?
Non. Utilise les méthodes Supabase Auth (`signUp`, `signIn`, `getSession`, `getUser`). Pour les données métier, utilise `public.users`.

### Comment voir les données dans `auth.users`?
- Dashboard Supabase → Authentication → Users
- OU SQL Editor: `SELECT id, email, raw_user_meta_data FROM auth.users;`

## Commandes à exécuter maintenant

1. **Créer le trigger automatique:**
   - Va dans Supabase → SQL Editor
   - Copie le contenu de `prisma/migrations/2025-12-19_auto_create_public_user.sql`
   - Exécute

2. **Migrer les users existants:**
   - Copie le contenu de `prisma/migrations/2025-12-19_migrate_existing_users.sql`
   - Exécute

3. **Vérifier:**
   ```sql
   SELECT COUNT(*) FROM auth.users;
   SELECT COUNT(*) FROM public.users;
   -- Les deux doivent être égaux
   ```

4. **Tester:**
   - Crée un nouveau compte sur ton app
   - Vérifie que l'entrée apparaît dans `public.users` automatiquement
