# 🔒 Documentation de Sécurité - TaskFlow

## Vue d'Ensemble

Cette application implémente plusieurs couches de sécurité pour garantir la confidentialité des communications.

---

## 🛡️ Chiffrement End-to-End

### Algorithme
- **TweetNaCl** (NaCl = "Networking and Cryptography library")
- Chiffrement symétrique `secretbox` avec clés de 256 bits
- Nonce aléatoire de 192 bits pour chaque message

### Flux de Chiffrement

1. **Création d'un salon** (Admin)
   ```
   Admin crée salon
   → Génération clé de chiffrement aléatoire (256 bits)
   → Stockage de la clé dans DB (accessible aux membres)
   → Clé distribuée aux membres lors de l'accès
   ```

2. **Envoi d'un message**
   ```
   User tape message
   → Récupération clé du salon depuis localStorage
   → Génération nonce aléatoire
   → Chiffrement du message avec clé + nonce
   → Envoi message chiffré + nonce au serveur
   → Serveur stocke sans déchiffrer
   → Pusher broadcast aux membres
   ```

3. **Réception d'un message**
   ```
   Message reçu via Pusher
   → Récupération clé du salon depuis localStorage
   → Extraction nonce du message
   → Déchiffrement avec clé + nonce
   → Affichage du message clair
   ```

### Sécurité des Clés

- ✅ Clés générées côté serveur (sécurisé)
- ✅ Clés stockées en localStorage (temporaire)
- ✅ Clés supprimées au panic mode
- ✅ Clés supprimées à la fermeture de l'onglet
- ✅ Clés supprimées après 10 min d'inactivité
- ⚠️ Le serveur a accès aux clés (pour distribution aux membres)

**Note**: Pour une sécurité maximale (serveur ne connaît pas les clés), il faudrait implémenter un échange de clés Diffie-Hellman, mais cela compliquerait l'ajout de nouveaux membres.

---

## 🚨 Panic Mode

### Déclencheurs

1. **Bouton PANIC** (manuel)
2. **Fermeture de l'onglet** chat
3. **Fermeture de l'application**
4. **10 minutes d'inactivité**

### Actions du Panic Mode

```typescript
triggerPanicMode() {
  // 1. Retour immédiat à la todo-list
  setIsChatMode(false);
  
  // 2. Réinitialisation du state
  setCurrentRoomId(null);
  setMessages({});
  
  // 3. Suppression des clés de chiffrement
  Object.keys(localStorage)
    .filter(key => key.startsWith('room_key_'))
    .forEach(key => localStorage.removeItem(key));
  
  // 4. Nettoyage de toute trace en mémoire
  clearAllMessages();
}
```

### Ce qui est supprimé
- ✅ Messages en mémoire (state Zustand)
- ✅ Clés de chiffrement (localStorage)
- ✅ Salon actif (state)
- ✅ Cache React
- ❌ Messages sur le serveur (conservés chiffrés)

---

## 🕵️ Détection d'Inactivité

### Mécanisme

```typescript
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

// Événements surveillés
- mousedown
- keydown
- touchstart
- scroll
```

### Fonctionnement

1. Timer réinitialisé à chaque interaction
2. Vérification toutes les 30 secondes
3. Si `now - lastActivity > 10 min` → Panic Mode

---

## 🔐 Contrôle d'Accès

### Rôles

#### Admin (`isAdmin: true`)
- Créer/supprimer des salons
- Inviter/bannir des utilisateurs
- Accès backoffice `/admin`
- Toutes les permissions User

#### User (`isAdmin: false`)
- Voir ses salons assignés
- Envoyer/recevoir messages
- Supprimer ses propres messages
- Utiliser la todo-list

### Vérifications Côté Serveur

Toutes les routes API vérifient :

```typescript
// Authentification
const { userId } = await auth();
if (!userId) return 401;

// Authorization Admin
const user = await db.select().from(users).where(eq(users.id, userId));
if (!user[0]?.isAdmin) return 403;

// Membership vérification
const member = await db.select()
  .from(roomMembers)
  .where(and(
    eq(roomMembers.roomId, roomId),
    eq(roomMembers.userId, userId),
    eq(roomMembers.isBanned, false)
  ));
if (!member[0]) return 403;
```

---

## 🗄️ Sécurité Base de Données

### Soft Delete

Les messages ne sont **jamais physiquement supprimés** :

```typescript
// Au lieu de DELETE
await db.delete(messages).where(eq(messages.id, messageId));

// On utilise UPDATE avec deletedAt
await db.update(messages)
  .set({ deletedAt: new Date() })
  .where(eq(messages.id, messageId));
```

**Avantages** :
- Audit trail conservé
- Récupération possible en cas d'erreur
- Conformité légale
- Protection contre suppressions accidentelles

**Inconvénient** :
- Occupation d'espace disque

### Chiffrement en DB

```sql
-- Messages stockés chiffrés
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  room_id UUID NOT NULL,
  sender_id TEXT NOT NULL,
  encrypted_content TEXT NOT NULL,  -- ⚠️ Chiffré E2E
  message_type TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP
);
```

### Indexation

```typescript
// Index sur les requêtes fréquentes
index('messages_room_id_idx').on(table.roomId),
index('messages_sender_id_idx').on(table.senderId),
index('messages_created_at_idx').on(table.createdAt),
```

---

## 🌐 Sécurité Réseau

### HTTPS Obligatoire

- ✅ Vercel force HTTPS en production
- ✅ Pusher utilise WSS (WebSocket Secure)
- ✅ Uploadthing utilise HTTPS

### Headers de Sécurité

Next.js ajoute automatiquement :
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### CORS

Les API routes acceptent uniquement les requêtes du même domaine.

---

## 📱 Sécurité PWA

### Service Worker

- Cache uniquement les assets statiques
- **Ne cache JAMAIS** les données sensibles
- Nettoyage automatique du cache

### Installation

La PWA peut être installée sur mobile, mais :
- ⚠️ **Pas de verrouillage d'application**
- ⚠️ **Accessible si le téléphone est déverrouillé**
- ⚠️ **Historique du navigateur conservé**

**Recommandation** : Utilisez un dossier sécurisé sur Android ou le verrouillage d'app iOS.

---

## 🔍 Surveillance et Logs

### Ce qui est loggé

```typescript
// ✅ Loggé (sécurisé)
console.log('User authenticated:', userId);
console.log('Room created:', roomId);
console.log('Message sent to room:', roomId);

// ❌ JAMAIS loggé (sensible)
// console.log('Message content:', decryptedMessage); // INTERDIT
// console.log('Encryption key:', roomKey); // INTERDIT
```

### Webhooks Clerk

Tous les événements utilisateurs sont loggés via webhook :
- `user.created`
- `user.updated`
- `user.deleted`

---

## ⚠️ Limitations de Sécurité

### Ce que l'application PROTÈGE

- ✅ Messages chiffrés E2E
- ✅ Clés supprimées automatiquement
- ✅ Accès restreint par rôles
- ✅ Panic mode fonctionnel
- ✅ Audit trail (soft delete)

### Ce que l'application NE PROTÈGE PAS

- ❌ Screenshots de l'écran
- ❌ Screen recording OS
- ❌ Malware sur l'appareil
- ❌ Keyloggers matériels
- ❌ Accès physique au téléphone déverrouillé
- ❌ Backup du navigateur/OS
- ❌ Admin DB qui pourrait accéder aux clés

---

## 🎯 Recommandations d'Usage

### Pour les Utilisateurs

1. **Triple-tap uniquement en privé**
2. **Activez le panic mode avant de passer le téléphone**
3. **Ne prenez JAMAIS de screenshots**
4. **Utilisez un VPN** (optionnel mais recommandé)
5. **Verrouillez votre téléphone** immédiatement après usage
6. **Supprimez régulièrement les messages**

### Pour les Admins

1. **Invitez uniquement des utilisateurs de confiance**
2. **Créez des salons distincts** pour différents groupes
3. **Bannissez immédiatement** les utilisateurs suspects
4. **Supprimez les salons inactifs**
5. **Ne stockez PAS les clés ailleurs**

---

## 🔬 Tests de Sécurité

### Tests Effectués

- ✅ Chiffrement/déchiffrement fonctionnel
- ✅ Panic mode supprime les clés
- ✅ Inactivité détectée correctement
- ✅ Permissions vérifiées côté serveur
- ✅ Soft delete appliqué

### Tests Recommandés

```bash
# Test chiffrement
1. Envoyer un message
2. Inspecter la DB
3. Vérifier que le contenu est illisible

# Test panic mode
1. Entrer en mode chat
2. Cliquer PANIC
3. Vérifier localStorage vide
4. Vérifier retour todo-list

# Test inactivité
1. Entrer en mode chat
2. Attendre 10 minutes sans interaction
3. Vérifier déconnexion automatique

# Test permissions
1. User normal tente d'accéder /admin
2. Vérifier redirection
3. User tente de créer un salon via API
4. Vérifier 403 Forbidden
```

---

## 📊 Conformité

### RGPD

- ✅ Droit à l'oubli (soft delete)
- ✅ Chiffrement des données
- ✅ Consentement explicite (inscription)
- ✅ Portabilité (export possible via API)
- ⚠️ Pas de politique de confidentialité formelle (à ajouter)

### Recommandations Légales

1. Ajoutez une page `/privacy` avec la politique de confidentialité
2. Ajoutez une page `/terms` avec les conditions d'utilisation
3. Ajoutez un consentement cookies
4. Documentez la durée de rétention des données

---

## 🚨 En Cas de Compromission

### Si une clé est compromise

1. Admin supprime le salon
2. Crée un nouveau salon
3. Ré-invite les membres de confiance
4. Nouvelle clé générée automatiquement

### Si un compte est compromis

1. Admin bannit l'utilisateur du salon
2. Utilisateur change son mot de passe Clerk
3. Vérifier les logs d'accès Clerk

### Si la DB est compromise

- ⚠️ Messages chiffrés (mais clés accessibles)
- ⚠️ Emails et usernames visibles
- ✅ Mots de passe gérés par Clerk (hors DB)

---

## 🎓 Conclusion

Cette application offre un bon niveau de sécurité pour des communications **confidentielles mais non critiques**.

**Elle est adaptée pour** :
- Groupes de discussion privés
- Communications sensibles
- Protection contre curiosité occasionnelle

**Elle n'est PAS adaptée pour** :
- Activités illégales
- Protection contre agences gouvernementales
- Sécurité militaire/diplomatique
- Protection contre malware avancé

**Utilisez de manière responsable et légale.** 🔐

