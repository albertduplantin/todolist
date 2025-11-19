# 🔐 TaskFlow - Application de Chat Sécurisé Déguisée en TodoList

> Une application de **chat chiffré end-to-end** qui se fait passer pour une simple TodoList. Triple-tap secret pour accéder au mode chat. Mode panic pour tout effacer instantanément.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/albertduplantin/todolist)

---

## 🌟 Fonctionnalités

### 🎭 Double Interface

- **TodoList** : Interface publique sobre et professionnelle
- **Chat Secret** : Accessible via triple-tap rapide sur le logo
- **Panic Mode** : Bouton rouge pour retour instantané + suppression traces

### 🔒 Sécurité Maximale

- ✅ **Chiffrement E2E** : TweetNaCl (NaCl/libsodium)
- ✅ **Clés éphémères** : Stockage en sessionStorage (effacé à la fermeture)
- ✅ **Soft Delete** : Messages marqués `deletedAt` au lieu de suppression physique
- ✅ **Auto-cleanup** : Suppression après 30s d'inactivité
- ✅ **Pas de cache API** : Service Worker exclu les routes /api/

### 💬 Chat Temps Réel

- **Salons privés** : Invitations par admin uniquement
- **Messages chiffrés** : Déchiffrement côté client seulement
- **Temps réel** : Pusher Channels pour instant messaging
- **Upload d'images** : Uploadthing avec chiffrement metadata
- **Indicateur typing** : "X est en train d'écrire..."
- **Notifications Push** : Avec demande de permission

### 👨‍💼 Backoffice Admin

- **Gestion des salons** : Créer, supprimer
- **Gestion des membres** : Inviter, bannir
- **Clés de chiffrement** : Générées automatiquement par salon
- **Dashboard** : Vue d'ensemble de l'activité

### 📱 PWA (Progressive Web App)

- **Installable** : Sur mobile et desktop
- **Mode offline** : Assets statiques en cache
- **Service Worker v3** : API routes JAMAIS en cache (fix synchronisation)
- **Manifest** : Icônes 192x192 et 512x512

---

## 🛠️ Stack Technique

| Catégorie | Technologie | Version |
|-----------|-------------|---------|
| **Frontend** | Next.js | 16.0.3 |
| | React | 19.2.0 |
| | TypeScript | 5.x |
| | Tailwind CSS | 4.x |
| | shadcn/ui | Latest |
| **Backend** | Next.js API Routes | - |
| | Neon PostgreSQL | - |
| | Drizzle ORM | 0.44.7 |
| **Auth** | Clerk | 6.35.1 |
| **Real-time** | Pusher Channels | 8.4.0 |
| **Upload** | Uploadthing | 7.7.4 |
| **Encryption** | TweetNaCl | 1.0.3 |
| **State** | Zustand | 5.0.8 |

---

## 🚀 Déploiement Rapide sur Vercel

### Option 1 : Déploiement en 1-Click

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/albertduplantin/todolist)

**Important :** Après le déploiement, vous devrez configurer les variables d'environnement.

### Option 2 : Déploiement Manuel

Voir le guide complet : [DEPLOIEMENT_VERCEL.md](./DEPLOIEMENT_VERCEL.md)

**Résumé rapide :**

```bash
# 1. Clone le repo
git clone https://github.com/albertduplantin/todolist.git
cd todolist

# 2. Installer les dépendances
npm install

# 3. Configurer .env.local (voir section ci-dessous)
cp .env.example .env.local
# Éditer .env.local avec vos clés

# 4. Migrer la DB
npm run db:push

# 5. Lancer en dev
npm run dev

# 6. Déployer sur Vercel
vercel --prod
```

---

## 🔐 Variables d'Environnement

Créer un fichier `.env.local` :

```bash
# Clerk (Auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Neon (Database)
DATABASE_URL=postgresql://...

# Pusher (Real-time)
NEXT_PUBLIC_PUSHER_APP_KEY=...
PUSHER_APP_ID=...
PUSHER_SECRET=...
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# Uploadthing (Images)
UPLOADTHING_TOKEN=eyJhcGlL...
```

**Où obtenir ces clés ?**

| Service | URL | Gratuit ? |
|---------|-----|-----------|
| **Clerk** | https://dashboard.clerk.com | ✅ Oui (10k MAU) |
| **Neon** | https://console.neon.tech | ✅ Oui (3 projets) |
| **Pusher** | https://dashboard.pusher.com | ✅ Oui (100 connexions) |
| **Uploadthing** | https://uploadthing.com/dashboard | ✅ Oui (2GB storage) |

---

## 📦 Installation Locale

```bash
# Clone
git clone https://github.com/albertduplantin/todolist.git
cd todolist

# Installation
npm install

# Configurer .env.local
cp .env.example .env.local
# Éditer avec vos clés

# Migration DB
npm run db:push

# Dev server
npm run dev
```

Application disponible sur http://localhost:3000

---

## 🗄️ Schéma de Base de Données

```sql
-- Users (sync avec Clerk)
users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255),
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  imageUrl TEXT,
  createdAt TIMESTAMP
)

-- Rooms (salons de chat)
rooms (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  encryptionKey TEXT, -- Clé de chiffrement du salon
  createdAt TIMESTAMP
)

-- Room Members (membres des salons)
room_members (
  id UUID PRIMARY KEY,
  roomId UUID → rooms.id,
  userId VARCHAR(255) → users.id,
  role VARCHAR(50), -- 'member' | 'admin'
  isBanned BOOLEAN,
  joinedAt TIMESTAMP
)

-- Messages (chiffrés)
messages (
  id UUID PRIMARY KEY,
  roomId UUID → rooms.id,
  senderId VARCHAR(255) → users.id,
  encryptedContent TEXT, -- Message chiffré
  messageType VARCHAR(20), -- 'text' | 'image'
  imageUrl TEXT,
  createdAt TIMESTAMP,
  deletedAt TIMESTAMP -- Soft delete
)

-- Todos (application de couverture)
todos (
  id UUID PRIMARY KEY,
  userId VARCHAR(255) → users.id,
  title VARCHAR(255),
  completed BOOLEAN,
  color VARCHAR(7), -- HEX color
  createdAt TIMESTAMP
)
```

---

## 🎯 Utilisation

### Mode TodoList (Public)

1. Ouvrir l'application
2. S'inscrire / Se connecter
3. Créer des tâches normalement
4. Interface sobre et professionnelle

### Mode Chat Secret

1. **Triple-tap rapide** sur le logo (< 800ms entre chaque tap)
2. Interface bascule vers le chat
3. Sélectionner un salon (si invité)
4. Chatter en temps réel
5. **Panic Mode** : Bouton rouge → retour instantané

### Backoffice Admin

1. Créer un compte
2. Dans Clerk Dashboard → Users → Public Metadata :
   ```json
   {"isAdmin": true}
   ```
3. Se déconnecter/reconnecter
4. Accès au bouton "Admin"
5. `/admin` : Gérer salons et membres

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [DEPLOIEMENT_VERCEL.md](./DEPLOIEMENT_VERCEL.md) | Guide complet déploiement Vercel |
| [SYNCHRONISATION_MESSAGES.md](./SYNCHRONISATION_MESSAGES.md) | Architecture sync messages |
| [SERVICE_WORKER_FIX.md](./SERVICE_WORKER_FIX.md) | Fix cache Service Worker |
| [SECURITE.md](./SECURITE.md) | Détails sécurité E2E |
| [RESUME_FINAL.md](./RESUME_FINAL.md) | Vue d'ensemble complète |

---

## 🐛 Problèmes Connus et Solutions

### Messages ne se synchronisent pas

**Cause** : Service Worker mettait en cache les API (v2)

**Solution** : ✅ Corrigé dans v3
- Routes /api/ exclues du cache
- Hard refresh : `Ctrl + Shift + R`
- DevTools → Application → Clear Storage

### Triple-tap ne fonctionne pas

**Solution** :
- Tapper **rapidement** (< 800ms entre chaque)
- Sur le logo, pas à côté
- 3 taps exactement

### Panic Mode ne supprime pas tout

**Solution** : ✅ Fonctionne correctement
- Efface le store Zustand
- Efface sessionStorage (clés)
- Service Worker v3 n'a plus de cache API

---

## 🧪 Tests

### Tests Locaux

```bash
# Build production locale
npm run build
npm start

# Tests manuels
1. Créer 2 utilisateurs
2. Admin : créer un salon, inviter l'autre
3. Les 2 : envoyer des messages
4. Vérifier temps réel
5. Tester panic mode
6. Tester triple-tap
```

### Tests en Production

Voir [DEPLOIEMENT_VERCEL.md](./DEPLOIEMENT_VERCEL.md) section "Tests en Production"

---

## 🤝 Contribution

Les contributions sont les bienvenues !

```bash
# Fork le projet
git fork https://github.com/albertduplantin/todolist.git

# Créer une branche
git checkout -b feature/ma-fonctionnalite

# Commiter
git commit -m "feat: Ma fonctionnalité"

# Push
git push origin feature/ma-fonctionnalite

# Créer une Pull Request
```

---

## 📝 License

Ce projet est sous licence MIT. Voir [LICENSE](./LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- [Next.js](https://nextjs.org) - Framework React
- [Clerk](https://clerk.com) - Authentification
- [Neon](https://neon.tech) - PostgreSQL serverless
- [Pusher](https://pusher.com) - WebSockets temps réel
- [TweetNaCl](https://tweetnacl.js.org) - Chiffrement E2E
- [shadcn/ui](https://ui.shadcn.com) - Composants UI
- [Drizzle](https://orm.drizzle.team) - ORM TypeScript

---

## 📧 Contact

Pour toute question :
- 🐛 [Créer une issue](https://github.com/albertduplantin/todolist/issues)
- 💬 [Discussions](https://github.com/albertduplantin/todolist/discussions)

---

## 🚨 Avertissement Sécurité

Cette application est conçue pour l'éducation et démonstration du chiffrement E2E.

**Pour usage en production :**
- ✅ Effectuer un audit de sécurité complet
- ✅ Implémenter rate limiting
- ✅ Configurer CORS restrictifs
- ✅ Surveiller les logs
- ✅ Backup réguliers de la DB
- ✅ Tests de pénétration

**Ne jamais** :
- ❌ Stocker de vraies données sensibles sans audit
- ❌ Utiliser en production sans HTTPS
- ❌ Partager les clés de chiffrement
- ❌ Logger les messages déchiffrés

---

**Fait avec ❤️ et chiffré avec 🔐**
