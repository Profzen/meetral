# Configuration Supabase - Redirection Email

## Problème
Les emails de confirmation Supabase pointent vers `localhost` au lieu de l'URL de production.

## Solution

### 1. Accéder aux paramètres Supabase
1. Va sur https://app.supabase.com
2. Sélectionne ton projet Meetral
3. Va dans **Authentication** → **URL Configuration**

### 2. Configurer les URLs de redirection

Dans **Site URL** :
```
https://meetral.vercel.app
```

Dans **Redirect URLs** (liste autorisée), ajoute :
```
https://meetral.vercel.app/auth/login
https://meetral.vercel.app/auth/register
https://meetral.vercel.app/**
http://localhost:3000/** (pour développement local)
```

### 3. Configurer les templates d'email

Va dans **Authentication** → **Email Templates** → **Confirm signup**

Template par défaut :
```html
<h2>Confirme ton inscription</h2>
<p>Clique sur le lien ci-dessous pour confirmer ton email :</p>
<p><a href="{{ .ConfirmationURL }}">Confirmer mon email</a></p>
```

Le `{{ .ConfirmationURL }}` pointera automatiquement vers ta **Site URL** configurée.

### 4. Variables d'environnement (optionnel)

Dans ton `.env.local` et dans Vercel :
```
NEXT_PUBLIC_SUPABASE_URL=https://[ton-projet].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ta-clé-anon]
SUPABASE_SERVICE_ROLE_KEY=[ta-clé-service-role]
NEXT_PUBLIC_SITE_URL=https://meetral.vercel.app
```

### 5. Redirection après confirmation

Crée un handler pour `/auth/confirm` :

**Fichier : `src/app/auth/confirm/route.js`**
```javascript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (token_hash && type) {
    const supabase = createRouteHandlerClient({ cookies });
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    
    if (!error) {
      return NextResponse.redirect(new URL('/auth/login?verified=true', requestUrl.origin));
    }
  }

  // Erreur ou token invalide
  return NextResponse.redirect(new URL('/auth/login?error=verification_failed', requestUrl.origin));
}
```

### 6. Tester

1. Inscris un nouvel utilisateur sur https://meetral.vercel.app/auth/register
2. Vérifie l'email reçu
3. Le lien doit pointer vers `https://meetral.vercel.app/auth/confirm?token_hash=...`
4. Après confirmation, redirection vers `/auth/login?verified=true`

## En local

Pour tester en local, change temporairement **Site URL** dans Supabase vers :
```
http://localhost:3000
```

**⚠️ N'oublie pas de remettre l'URL de prod après !**
