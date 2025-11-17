# 🚀 Guide de Configuration - TaskFlow (Application Secrète)

Cette application est une **todo-list fonctionnelle** qui cache un **système de chat chiffré et sécurisé**. Suivez ce guide pour la déployer.

---

## 📋 Prérequis

- Node.js 18+ installé
- Un compte GitHub (pour le code)
- Un compte Vercel (gratuit)
- Un compte Clerk (gratuit - 10k users)
- Une base de données Neon (gratuit - 512MB)
- Un compte Pusher (gratuit - 200k messages/jour)
- Un compte Uploadthing (gratuit - 2GB)

---

## 🔧 1. Configuration de la Base de Données (Neon)

1. Allez sur [neon.tech](https://neon.tech)
2. Créez un compte et un nouveau projet
3. Copiez la **Connection String** PostgreSQL
4. Elle ressemble à : `postgresql://user:password@host/database?sslmode=require`

---

## 🔐 2. Configuration de l'Authentification (Clerk)

1. Allez sur [clerk.com](https://clerk.com)
2. Créez une application
3. Dans **API Keys**, copiez :
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Dans **Webhooks**, créez un webhook :
   - URL : `https://votre-domaine.vercel.app/api/webhooks/clerk`
   - Événements : `user.created`, `user.updated`, `user.deleted`
   - Copiez le **Signing Secret** → `CLERK_WEBHOOK_SECRET`
5. Dans **User & Authentication** → **Metadata**, ajoutez un champ custom `isAdmin` (boolean)

### Définir un utilisateur comme admin :
1. Créez votre compte utilisateur dans l'app
2. Dans Clerk Dashboard → Users → Sélectionnez votre user
3. Dans **Metadata** → **Public metadata**, ajoutez :
```json
{
  "isAdmin": true
}
```

---

## 📡 3. Configuration du Temps Réel (Pusher)

1. Allez sur [pusher.com](https://pusher.com)
2. Créez une application (Channels)
3. Choisissez le cluster le plus proche (ex: `eu`)
4. Copiez :
   - `app_id` → `PUSHER_APP_ID`
   - `key` → `NEXT_PUBLIC_PUSHER_APP_KEY`
   - `secret` → `PUSHER_SECRET`
   - `cluster` → `NEXT_PUBLIC_PUSHER_CLUSTER`

---

## 📤 4. Configuration Upload d'Images (Uploadthing)

1. Allez sur [uploadthing.com](https://uploadthing.com)
2. Créez une application
3. Copiez le **Token** → `UPLOADTHING_TOKEN`

---

## ⚙️ 5. Variables d'Environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Neon Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Pusher for Real-time
NEXT_PUBLIC_PUSHER_APP_KEY=xxxxx
PUSHER_APP_ID=xxxxx
PUSHER_SECRET=xxxxx
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# Uploadthing for Images
UPLOADTHING_TOKEN=xxxxx

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📦 6. Installation et Démarrage Local

```bash
# Installer les dépendances
npm install

# Générer et appliquer le schéma de base de données
npm run db:push

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

---

## 🌐 7. Déploiement sur Vercel

### Via l'interface Vercel :

1. Allez sur [vercel.com](https://vercel.com)
2. Importez votre dépôt GitHub
3. Dans **Environment Variables**, ajoutez TOUTES les variables du fichier `.env.local`
4. Cliquez sur **Deploy**

### Via CLI Vercel :

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Ajouter les variables d'environnement
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# ... répéter pour toutes les variables

# Redéployer avec les variables
vercel --prod
```

---

## 🔒 8. Fonctionnalités de Sécurité

### Triple-Tap Secret
- **3 taps rapides sur le logo** → Accès au chat caché
- Le geste doit être effectué en moins de 800ms

### Panic Mode
- **Bouton PANIC** dans le chat → Retour immédiat à la todo-list
- Suppression de toutes les traces locales (messages, clés de chiffrement)
- Nettoyage du localStorage

### Suppression Automatique
Les traces sont automatiquement supprimées :
- À la fermeture de l'onglet chat
- À la fermeture de l'application
- Après **10 minutes d'inactivité**

### Chiffrement End-to-End
- Tous les messages sont chiffrés côté client avec **TweetNaCl**
- Clés de chiffrement stockées localement (supprimées au panic mode)
- Le serveur ne stocke que les messages chiffrés

---

## 👥 9. Utilisation Admin

1. Créez votre compte utilisateur
2. Définissez-vous comme admin dans Clerk (voir section 2)
3. Accédez à `/admin` ou cliquez sur "Admin" dans le header
4. Créez des salons de discussion
5. Invitez des utilisateurs par email
6. Gérez les membres

---

## 📱 10. PWA (Progressive Web App)

L'application est une PWA et peut être installée sur mobile :

### Android :
1. Ouvrez l'app dans Chrome
2. Menu → "Ajouter à l'écran d'accueil"

### iOS :
1. Ouvrez l'app dans Safari
2. Bouton Partager → "Sur l'écran d'accueil"

---

## 🔍 11. Gestion de la Base de Données

```bash
# Générer une migration
npm run db:generate

# Appliquer les migrations
npm run db:migrate

# Push direct (développement)
npm run db:push

# Interface visuelle Drizzle Studio
npm run db:studio
```

---

## 🐛 12. Dépannage

### Erreur de connexion DB
- Vérifiez que `DATABASE_URL` est correcte
- Vérifiez que la DB Neon est active

### Messages ne s'affichent pas
- Vérifiez les credentials Pusher
- Vérifiez que le cluster est correct

### Upload d'images échoue
- Vérifiez `UPLOADTHING_TOKEN`
- Vérifiez la limite de taille (4MB max)

### Triple-tap ne fonctionne pas
- Tapez rapidement (< 800ms entre chaque tap)
- Tapez directement sur le logo

---

## 📊 13. Limites Gratuites

| Service | Limite Gratuite |
|---------|----------------|
| **Clerk** | 10,000 utilisateurs |
| **Neon** | 512 MB stockage, 100h compute/mois |
| **Pusher** | 200k messages/jour, 100 connexions simultanées |
| **Uploadthing** | 2 GB stockage, 500 MB/mois upload |
| **Vercel** | 100 GB bandwidth/mois |

Avec **200 messages texte/mois** et **3-4 images/mois**, vous êtes **largement dans les limites gratuites** ! ✅

---

## 🚨 14. Recommandations de Sécurité

1. **Ne partagez JAMAIS les variables d'environnement**
2. **Utilisez des emails de confiance** pour les invitations
3. **Supprimez régulièrement les anciens messages** (via l'interface)
4. **Activez le panic mode** en cas de danger
5. **Utilisez la PWA** sur mobile pour plus de discrétion
6. **Ne prenez pas de screenshots** du chat

---

## 📝 15. Architecture Technique

```
todolist/
├── app/                    # Pages Next.js (App Router)
│   ├── api/               # API Routes
│   │   ├── todos/         # Gestion des tâches
│   │   ├── rooms/         # Gestion des salons
│   │   ├── messages/      # Messages chiffrés
│   │   ├── uploadthing/   # Upload d'images
│   │   └── webhooks/      # Webhooks Clerk
│   ├── admin/             # Interface admin
│   ├── sign-in/           # Authentification
│   └── sign-up/           # Inscription
├── components/            # Composants React
│   ├── ui/                # Composants UI réutilisables
│   ├── logo.tsx           # Logo avec triple-tap
│   ├── todo-list.tsx      # Interface todo-list
│   ├── chat-interface.tsx # Interface chat chiffrée
│   └── inactivity-monitor.tsx # Surveillance inactivité
├── lib/                   # Utilitaires
│   ├── db/                # Configuration Drizzle + Schéma
│   ├── encryption.ts      # Fonctions de chiffrement
│   ├── store.ts           # State management (Zustand)
│   └── utils.ts           # Utilitaires divers
└── public/                # Fichiers statiques + PWA

Stack :
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Clerk (Auth)
- Neon PostgreSQL
- Drizzle ORM
- Pusher (Temps réel)
- Uploadthing (Images)
- TweetNaCl (Chiffrement E2E)
- Zustand (State)
- PWA
```

---

## ✅ 16. Checklist de Déploiement

- [ ] Base de données Neon créée
- [ ] Application Clerk configurée
- [ ] Webhook Clerk configuré
- [ ] Application Pusher créée
- [ ] Uploadthing configuré
- [ ] Variables d'environnement ajoutées à Vercel
- [ ] DB schema appliqué (`npm run db:push`)
- [ ] Application déployée sur Vercel
- [ ] Premier utilisateur admin créé
- [ ] Premier salon créé
- [ ] Triple-tap testé
- [ ] Panic mode testé
- [ ] Upload d'image testé
- [ ] PWA installée sur mobile

---

## 🎉 C'est terminé !

Votre application secrète est maintenant prête. Profitez de vos communications sécurisées ! 🔒

**Note importante** : Cette application a été conçue pour la confidentialité. Utilisez-la de manière responsable et légale.

---

## 📞 Support

Pour toute question ou problème, consultez la documentation des services :
- [Next.js Docs](https://nextjs.org/docs)
- [Clerk Docs](https://clerk.com/docs)
- [Neon Docs](https://neon.tech/docs)
- [Pusher Docs](https://pusher.com/docs)
- [Uploadthing Docs](https://docs.uploadthing.com)

