# 🚀 Guide de Déploiement sur Vercel

## Prérequis

- ✅ Code poussé sur GitHub: https://github.com/albertduplantin/todolist.git
- ✅ Compte Vercel: https://vercel.com
- ✅ Base de données Neon PostgreSQL configurée
- ✅ Compte Clerk configuré
- ✅ Compte Pusher configuré
- ✅ Compte Uploadthing configuré

---

## 📋 Étape 1: Import du Projet sur Vercel

### 1.1 Connexion à Vercel

1. Aller sur https://vercel.com
2. Se connecter avec GitHub
3. Cliquer "Add New..." → "Project"

### 1.2 Import du Repository

1. Sélectionner `albertduplantin/todolist`
2. Cliquer "Import"

### 1.3 Configuration du Projet

**Framework Preset:** Next.js (détecté automatiquement)

**Root Directory:** `./` (racine)

**Build Command:** `npm run build` (par défaut)

**Output Directory:** `.next` (par défaut)

**Install Command:** `npm install` (par défaut)

---

## 🔐 Étape 2: Variables d'Environnement

### Important ⚠️

**NE JAMAIS** commiter les valeurs réelles dans `.env` !

### 2.1 Clerk (Authentification)

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_VOTRE_CLE
CLERK_SECRET_KEY=sk_test_VOTRE_CLE
CLERK_WEBHOOK_SECRET=whsec_VOTRE_SECRET
```

**Où trouver ces clés ?**
1. https://dashboard.clerk.com
2. Sélectionner votre application
3. **API Keys** dans le menu

**Configuration Webhook Clerk (Optionnel mais recommandé):**
1. Dashboard Clerk → Webhooks
2. Add Endpoint: `https://VOTRE-APP.vercel.app/api/webhooks/clerk`
3. Subscribe to events: `user.created`, `user.updated`, `user.deleted`
4. Copier le **Signing Secret** → `CLERK_WEBHOOK_SECRET`

### 2.2 Neon (Base de Données PostgreSQL)

```bash
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/database?sslmode=require
```

**Où trouver ?**
1. https://console.neon.tech
2. Sélectionner votre projet
3. **Connection Details** → **Connection string**

**⚠️ Important:** 
- Utiliser la connection string **avec pooling** pour Vercel
- Format: `postgresql://user:password@host/db?sslmode=require`

### 2.3 Pusher (Temps Réel)

```bash
NEXT_PUBLIC_PUSHER_APP_KEY=VOTRE_APP_KEY
PUSHER_APP_ID=VOTRE_APP_ID
PUSHER_SECRET=VOTRE_SECRET
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

**Où trouver ?**
1. https://dashboard.pusher.com
2. Sélectionner votre app (ou en créer une nouvelle)
3. **App Keys** dans le menu

**Configuration recommandée:**
- **Cluster:** `eu` (Europe) ou `us2` (US East)
- **Enable client events:** ✅ (pour typing indicators)
- **Enable SSL only:** ✅ (sécurité)

### 2.4 Uploadthing (Upload d'Images)

```bash
UPLOADTHING_TOKEN=eyJhcGlLZXk...VOTRE_TOKEN
```

**Où trouver ?**
1. https://uploadthing.com/dashboard
2. Sélectionner votre app
3. **API Keys** → Copier le token

**Limites gratuites:**
- 2 GB storage
- 1 GB bandwidth/mois
- Parfait pour débuter

---

## 🔧 Étape 3: Configuration dans Vercel

### 3.1 Ajouter les Variables d'Environnement

Dans Vercel Dashboard:

1. Aller dans **Settings** → **Environment Variables**

2. Ajouter **chaque variable** une par une:
   - Name: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Value: `pk_test_...`
   - Environment: `Production`, `Preview`, `Development` (tous cochés)

3. Répéter pour toutes les variables

**⚠️ Variables NEXT_PUBLIC_***

Les variables préfixées `NEXT_PUBLIC_` sont exposées au client.
- ✅ OK: API keys publiques (Clerk, Pusher)
- ✗ NON: Secrets, tokens privés

### 3.2 Vérifier la Configuration

Liste complète des variables à ajouter:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Neon
DATABASE_URL=postgresql://...

# Pusher
NEXT_PUBLIC_PUSHER_APP_KEY=...
PUSHER_APP_ID=...
PUSHER_SECRET=...
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# Uploadthing
UPLOADTHING_TOKEN=eyJhcGlL...
```

**Total: 9 variables**

---

## 🚢 Étape 4: Déploiement

### 4.1 Premier Déploiement

1. Vérifier que toutes les variables sont ajoutées
2. Cliquer "Deploy"
3. Attendre 2-3 minutes (build + déploiement)

### 4.2 Vérifier le Déploiement

Vous recevrez une URL: `https://VOTRE-APP.vercel.app`

**Tests à effectuer:**

1. ✅ Page d'accueil charge
2. ✅ Sign in fonctionne (Clerk)
3. ✅ Créer une todo fonctionne (DB)
4. ✅ Triple-tap sur logo fonctionne
5. ✅ Chat charge (avec salons si admin)
6. ✅ Envoyer un message fonctionne (Pusher + DB)
7. ✅ Upload d'image fonctionne (Uploadthing)

### 4.3 Logs de Déploiement

Si erreur, vérifier les logs:

1. Vercel Dashboard → **Deployments**
2. Cliquer sur le dernier déploiement
3. Onglet **Build Logs** ou **Function Logs**

**Erreurs communes:**

| Erreur | Solution |
|--------|----------|
| `DATABASE_URL not defined` | Vérifier variable d'environnement |
| `Clerk: Invalid API key` | Vérifier `CLERK_SECRET_KEY` |
| `Pusher authentication failed` | Vérifier `PUSHER_SECRET` |
| `Module not found` | Vérifier `package.json`, réinstaller deps |

---

## 🗄️ Étape 5: Migration de la Base de Données

### 5.1 Appliquer le Schéma Drizzle

**Depuis votre machine locale:**

```bash
# Vérifier que DATABASE_URL pointe vers Neon production
npm run db:push
```

Cela va créer toutes les tables dans votre DB Neon:
- `users`
- `rooms`
- `room_members`
- `messages`
- `todos`

### 5.2 Vérifier les Tables

```bash
# Ouvrir Drizzle Studio
npm run db:studio
```

Ou directement dans Neon Console:
1. https://console.neon.tech
2. **SQL Editor**
3. Exécuter:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Devrait retourner: `users`, `rooms`, `room_members`, `messages`, `todos`

---

## 👨‍💼 Étape 6: Créer un Utilisateur Admin

### 6.1 Créer un Compte

1. Aller sur `https://VOTRE-APP.vercel.app`
2. Cliquer "Sign Up"
3. Créer votre compte

### 6.2 Le Promouvoir Admin

**Via Clerk Dashboard:**

1. https://dashboard.clerk.com
2. **Users** → Sélectionner votre utilisateur
3. **Metadata** → **Public Metadata**
4. Ajouter:

```json
{
  "isAdmin": true
}
```

5. Sauvegarder

**Via Code (API):**

```bash
curl -X PATCH https://api.clerk.com/v1/users/USER_ID \
  -H "Authorization: Bearer YOUR_CLERK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"public_metadata": {"isAdmin": true}}'
```

### 6.3 Vérifier les Permissions

1. Déconnectez-vous et reconnectez-vous
2. Vous devriez voir un bouton "Admin" dans le menu
3. Accès à `/admin` devrait fonctionner

---

## 🏰 Étape 7: Créer les Premiers Salons

### 7.1 Accéder au Backoffice Admin

1. `https://VOTRE-APP.vercel.app/admin`
2. Onglet **Salons**

### 7.2 Créer un Salon

1. Cliquer "Créer un salon"
2. **Nom:** `Général`
3. **Description:** `Salon principal`
4. **Clé de chiffrement:** Générée automatiquement
5. Cliquer "Créer"

### 7.3 Inviter des Membres

1. Onglet **Membres**
2. Sélectionner le salon `Général`
3. Chercher un utilisateur
4. Cliquer "Inviter"

**Note:** Les utilisateurs doivent s'être inscrits avant de pouvoir être invités.

---

## 🔒 Étape 8: Sécurité Post-Déploiement

### 8.1 Configurer les Domaines Autorisés

**Clerk:**
1. Dashboard → **Domains**
2. Ajouter `VOTRE-APP.vercel.app`

**Pusher:**
1. Dashboard → App Settings
2. **Authorized domains:** Ajouter `VOTRE-APP.vercel.app`

### 8.2 HTTPS Seulement

Vercel force automatiquement HTTPS ✅

### 8.3 CORS (si API externe)

Par défaut, Next.js API routes n'acceptent que les requêtes du même domaine ✅

---

## 📊 Étape 9: Monitoring et Analytics

### 9.1 Vercel Analytics (Gratuit)

1. Vercel Dashboard → **Analytics**
2. Activer (gratuit jusqu'à 100k events/mois)

### 9.2 Logs en Production

**Function Logs:**
- Vercel Dashboard → **Functions** → Sélectionner une fonction
- Voir les logs en temps réel

**Filtrer par erreurs:**
```bash
# Dans les logs
[Send] Error sending message
[Sync] Failed to fetch messages
```

### 9.3 Performance

**Lighthouse Score (attendu):**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 100
- SEO: 90+

---

## 🔄 Étape 10: Déploiements Continus

### 10.1 Automatic Deployments

Vercel déploie automatiquement à chaque push sur `main`:

```bash
git add .
git commit -m "Nouvelle fonctionnalité"
git push origin main
# → Vercel déploie automatiquement !
```

### 10.2 Preview Deployments

Chaque branche/PR crée un preview:

```bash
git checkout -b feature/nouvelle-fonction
# ... modifications ...
git push origin feature/nouvelle-fonction
# → Vercel crée un preview: https://todolist-xxx.vercel.app
```

### 10.3 Rollback

Si problème en production:

1. Vercel Dashboard → **Deployments**
2. Sélectionner un déploiement précédent
3. Cliquer "Promote to Production"

---

## 🧪 Tests en Production

### Checklist Complète

- [ ] **Auth:** Sign up / Sign in / Sign out
- [ ] **Todos:** Créer / Modifier / Supprimer
- [ ] **Triple-tap:** Logo fonctionne (3 taps rapides)
- [ ] **Chat:** Liste des salons affichée
- [ ] **Messages:** Envoi / Réception (multi-utilisateurs)
- [ ] **Images:** Upload fonctionne
- [ ] **Temps réel:** Messages apparaissent instantanément
- [ ] **Panic Mode:** Bouton rouge efface tout
- [ ] **Admin:** Backoffice accessible (si admin)
- [ ] **PWA:** Installation possible sur mobile
- [ ] **Service Worker:** Pas de cache des API (vérifier DevTools)
- [ ] **Responsive:** Mobile / Tablet / Desktop
- [ ] **Performance:** Chargement < 3s

---

## ❓ Troubleshooting

### Problème: Messages ne se synchronisent pas

**Solution:**
1. Vérifier que `public/sw.js` v3 est déployé
2. Hard refresh: `Ctrl + Shift + R`
3. DevTools → Application → Clear Storage
4. Vérifier logs: `[SW] Bypassing cache for API route`

### Problème: Auth ne fonctionne pas

**Solution:**
1. Vérifier `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
2. Vérifier que le domaine est autorisé dans Clerk
3. Vérifier que `CLERK_SECRET_KEY` est correct

### Problème: Messages en temps réel ne marchent pas

**Solution:**
1. Vérifier Pusher credentials
2. Vérifier que le cluster est correct (`eu` ou `us2`)
3. Tester dans Pusher Debug Console

### Problème: Upload d'images échoue

**Solution:**
1. Vérifier `UPLOADTHING_TOKEN`
2. Vérifier la taille de l'image (max 4MB)
3. Vérifier les logs Uploadthing dashboard

### Problème: Base de données erreurs

**Solution:**
1. Vérifier `DATABASE_URL`
2. Relancer `npm run db:push`
3. Vérifier les tables dans Neon Console

---

## 📚 Ressources

### Documentation

- **Vercel:** https://vercel.com/docs
- **Next.js:** https://nextjs.org/docs
- **Clerk:** https://clerk.com/docs
- **Pusher:** https://pusher.com/docs
- **Neon:** https://neon.tech/docs
- **Uploadthing:** https://docs.uploadthing.com

### Support

- **Vercel:** https://vercel.com/support
- **Clerk:** https://clerk.com/support
- **GitHub Issues:** https://github.com/albertduplantin/todolist/issues

---

## ✅ Checklist Finale

Avant de considérer le déploiement terminé:

- [ ] Application accessible sur Vercel
- [ ] Toutes les variables d'environnement configurées
- [ ] Base de données migrée (tables créées)
- [ ] Au moins 1 utilisateur admin créé
- [ ] Au moins 1 salon créé
- [ ] Tests multi-utilisateurs effectués
- [ ] Service Worker v3 actif (pas de cache API)
- [ ] PWA installable sur mobile
- [ ] Monitoring activé (Vercel Analytics)
- [ ] Documentation lue et comprise
- [ ] Backup de `.env.local` en lieu sûr

---

## 🎉 C'est Fini !

Votre application **TaskFlow** est maintenant déployée en production sur Vercel !

**URL de production:** `https://VOTRE-APP.vercel.app`

**Prochaines étapes:**
1. Partager l'URL avec vos utilisateurs
2. Surveiller les métriques Vercel
3. Améliorer selon les retours utilisateurs

**Besoin d'aide ?**
- 📧 Créer une issue sur GitHub
- 💬 Consulter la documentation
- 🔍 Vérifier les logs Vercel

---

**Bon chat sécurisé ! 🔐💬**

