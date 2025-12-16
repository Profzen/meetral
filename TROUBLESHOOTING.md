# Erreurs Communes et Solutions

## Erreur : `Failed to load resource: net::ERR_NAME_NOT_RESOLVED`

### Cause
Certains événements ont des URLs d'images malformées comme `600x400?text=Event` au lieu de `https://via.placeholder.com/600x400?text=Event`.

### Solution Appliquée
1. **Validation côté client** : Ajout de `getValidImageUrl()` dans EventCard et EventModal qui vérifie si l'URL commence par `http://`, `https://` ou `/`
2. **Fallback automatique** : Si l'URL est invalide, utilise `https://via.placeholder.com/600x400?text=Event`
3. **Handler d'erreur** : `onError` sur les balises `<img>` pour fallback en cas d'échec de chargement

### Nettoyage Base de Données
Exécute la migration SQL pour corriger les URLs existantes :
```bash
psql $DATABASE_URL -f prisma/migrations/2025-12-16_fix_image_urls.sql
```

Ou via Supabase SQL Editor :
```sql
-- Copie le contenu de prisma/migrations/2025-12-16_fix_image_urls.sql
```

---

## Warning : `Skipping auto-scroll behavior due to position: sticky/fixed`

### Cause
Next.js détecte des éléments avec `position: fixed` (modales) et skip l'auto-scroll.

### Impact
⚠️ **Pas de problème** — C'est un warning normal, pas une erreur. Les modales fonctionnent correctement.

### Solution (optionnelle)
Pour masquer ce warning, ajoute dans `next.config.mjs` :
```javascript
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Supprime les warnings spécifiques
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.infrastructureLogging = {
        level: 'error',
      };
    }
    return config;
  },
};
```

---

## Erreur : Événements complets affichés

### Solution Appliquée
Filtrage à **3 niveaux** :
1. **API `/api/events/smart-ranked`** : `if (isFull) return null;`
2. **API `/api/events` (fallback)** : `filter(e => e.registered < e.capacity)`
3. **Client (pages)** : Double vérification avec `registered >= capacity`

### Vider le cache
Si tu vois encore des événements complets :
1. Console navigateur (F12)
2. Tape : `localStorage.clear()`
3. Recharge (F5)

---

## Performance : Pages lentes

### Optimisations Appliquées
- ✅ Cache localStorage (TTL 3 min)
- ✅ Colonnes optimisées (select spécifique)
- ✅ Indexes SQL (date, created_at, registered, etc.)
- ✅ Pagination serveur (offset/limit)
- ✅ Favoris inclus dans smart-ranked (1 appel au lieu de 2)

### Gain Attendu
- **Temps de chargement** : -75% (800ms → 150-200ms)
- **Appels API** : -67% (3 → 1 sur 1ère visite, 0 sur visites suivantes < 3 min)

---

## Cache : Données pas à jour

### Symptôme
Les événements ne se mettent pas à jour immédiatement après inscription/modification.

### Solution
Le cache se vide automatiquement après :
- ✅ Inscription à un événement (`onRegistrationSuccess`)
- ✅ 3 minutes (TTL automatique)

### Forcer le rafraîchissement manuel
Console (F12) :
```javascript
localStorage.clear();
location.reload();
```

---

## Email Confirmation : Redirection vers localhost

### Configuration Supabase
1. Va sur https://app.supabase.com
2. **Authentication** → **URL Configuration**
3. **Site URL** : `https://meetral.vercel.app`
4. **Redirect URLs** : Ajoute `https://meetral.vercel.app/**`

Voir [SUPABASE_EMAIL_CONFIG.md](SUPABASE_EMAIL_CONFIG.md) pour le guide complet.
