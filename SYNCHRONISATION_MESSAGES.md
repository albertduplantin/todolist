# Améliorations de la Synchronisation des Messages

## Problème Initial

Les messages apparaissaient et disparaissaient de manière aléatoire dans le chat. Ce problème était dû à plusieurs facteurs :

1. **Architecture actuelle** :
   - Messages stockés temporairement dans le store Zustand (mémoire RAM)
   - Sauvegarde permanente dans PostgreSQL via l'API
   - Synchronisation temps réel via Pusher

2. **Sources du problème** :
   - Désynchronisation entre le store local et la base de données
   - Messages ajoutés localement mais pas encore sauvegardés en DB
   - Doublons possibles via Pusher
   - Cache navigateur
   - Erreurs réseau non gérées
   - Panic mode qui efface tout le store local

## Solutions Implémentées

### 1. Synchronisation Forcée à l'Ouverture de Chaque Salon ✅

**Fichier** : `components/chat-interface.tsx`

- Cache-busting systématique avec timestamp : `?_t=${Date.now()}`
- Headers HTTP pour désactiver le cache :
  ```typescript
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  }
  ```
- Fetch automatique à chaque ouverture de salon
- Logging détaillé : `[Sync]` pour tracer la synchronisation

### 2. Synchronisation Périodique Automatique ✅

**Fonctionnalité** : Vérification automatique toutes les 30 secondes

```typescript
syncIntervalRef.current = setInterval(() => {
  console.log(`[Sync] Periodic sync - checking DB for room ${currentRoomId}`);
  fetchMessages(currentRoomId);
}, 30000); // 30 secondes
```

**Avantages** :
- Garantit que les messages sont toujours à jour
- Détecte automatiquement les messages manquants
- Récupère les messages supprimés par d'autres utilisateurs
- Cleanup automatique lors du changement de salon

### 3. Gestion Améliorée des Erreurs ✅

**Envoi de messages** :
- Vérification du succès de l'API avant ajout local
- Restauration du message dans l'input en cas d'erreur
- Alertes utilisateur pour les erreurs réseau/serveur
- Logging détaillé : `[Send]`

**Suppression de messages** :
- Vérification du succès de la suppression
- Alertes en cas d'erreur
- Logging détaillé : `[Delete]`

**Suppression en masse** :
- Re-synchronisation automatique après suppression
- Récupération des messages des autres utilisateurs
- Logging détaillé : `[Clear]`

### 4. Prévention des Doublons ✅

**Via Pusher** :
```typescript
// Check if message already exists in store (avoid duplicates)
const currentMessages = messages[roomId] || [];
const exists = currentMessages.some(msg => msg.id === data.id);

if (exists) {
  console.log(`[Pusher] Message ${data.id} already exists, skipping`);
  return;
}
```

**Lors de l'envoi** :
- Vérification si le message existe déjà (ajouté via Pusher)
- Évite les doublons pour l'utilisateur qui envoie
- Messages ajoutés une seule fois dans le store

### 5. Logging Complet pour le Débogage ✅

**Tags de logging** :
- `[Sync]` : Synchronisation avec la DB
- `[Send]` : Envoi de messages
- `[Delete]` : Suppression de messages
- `[Clear]` : Suppression en masse
- `[Pusher]` : Événements temps réel

**Informations tracées** :
- ID des messages
- ID des salons
- Succès/échecs des opérations
- Nombre de messages récupérés
- Détection des doublons
- Erreurs de chiffrement/déchiffrement

## Flux de Synchronisation

### Ouverture d'un Salon

```
1. Utilisateur ouvre le salon
2. [Sync] Log d'ouverture
3. [Sync] Fetch messages depuis DB (cache-busting)
4. [Sync] Déchiffrement des messages
5. [Sync] Messages ajoutés au store local
6. Subscription Pusher pour temps réel
7. Démarrage du timer de sync périodique (30s)
```

### Envoi d'un Message

```
1. Utilisateur écrit et envoie
2. [Send] Log d'envoi
3. Chiffrement du message
4. POST /api/messages (sauvegarde DB)
5. [Send] Vérification succès API
6. [Send] Vérification si message existe (Pusher)
7. [Send] Ajout au store local si nouveau
8. Pusher broadcast aux autres utilisateurs
```

### Réception d'un Message (Pusher)

```
1. [Pusher] Événement reçu
2. [Pusher] Vérification clé de chiffrement
3. [Pusher] Déchiffrement
4. [Pusher] Vérification doublon
5. [Pusher] Ajout au store si nouveau
6. [Pusher] Notification si pas de soi-même
```

### Suppression d'un Message

```
1. Utilisateur clique sur "Supprimer"
2. [Delete] Log de suppression
3. DELETE /api/messages (soft delete en DB)
4. [Delete] Vérification succès
5. Suppression du store local
6. Pusher broadcast aux autres utilisateurs
```

### Sync Périodique (Toutes les 30s)

```
1. Timer déclenché
2. [Sync] Log de sync périodique
3. [Sync] Fetch messages depuis DB
4. [Sync] Remplacement complet du store
5. Garantie de cohérence avec la DB
```

## Tests Recommandés

### Test 1 : Messages Persistants
1. Envoyer un message dans un salon
2. Vérifier qu'il apparaît immédiatement
3. Fermer l'application (panic mode)
4. Rouvrir et entrer dans le salon
5. ✅ Le message doit toujours être là

### Test 2 : Multi-Utilisateurs
1. Utilisateur A et B dans le même salon
2. A envoie un message
3. ✅ B doit le voir apparaître en temps réel (Pusher)
4. B ferme et rouvre l'app
5. ✅ B doit toujours voir le message de A

### Test 3 : Erreurs Réseau
1. Activer le mode "Offline" dans DevTools
2. Essayer d'envoyer un message
3. ✅ Message doit rester dans l'input
4. ✅ Alerte d'erreur doit apparaître
5. Réactiver le réseau
6. Renvoyer le message
7. ✅ Message doit être envoyé et visible

### Test 4 : Suppression
1. Envoyer 5 messages
2. Supprimer le 3ème message
3. ✅ Message doit disparaître immédiatement
4. Quitter et revenir au salon
5. ✅ Message supprimé ne doit pas réapparaître

### Test 5 : Synchronisation Périodique
1. Envoyer un message via Utilisateur A
2. Sur Utilisateur B, attendre 30 secondes sans activité
3. ✅ Le message de A doit apparaître automatiquement
4. Vérifier les logs : `[Sync] Periodic sync`

## Monitoring en Production

### Console Browser (F12)

Pour suivre la synchronisation en temps réel :

```javascript
// Filtrer les logs de synchronisation
localStorage.setItem('debug', 'sync');

// Voir tous les logs
[Sync] Opening room xxx - force fetching messages from DB
[Sync] Fetching messages for room xxx from database...
[Sync] Received 15 messages from DB for room xxx
[Sync] Successfully decrypted 15 messages for room xxx
[Sync] Starting periodic sync for room xxx
[Sync] Periodic sync - checking DB for room xxx
```

### Indicateurs de Problèmes

⚠️ Messages qui disparaissent :
- Vérifier logs `[Sync]` : Sont-ils récupérés depuis la DB ?
- Vérifier logs `[Send]` : Sont-ils sauvegardés en DB ?

⚠️ Doublons :
- Vérifier logs `[Pusher]` : Y a-t-il des "already exists" ?
- Vérifier logs `[Send]` : Y a-t-il des "already in store" ?

⚠️ Erreurs de chiffrement :
- Vérifier logs `[Sync]` : "Error decrypting message"
- Vérifier que la clé de chiffrement est bien stockée

## Architecture Technique

### Base de Données (PostgreSQL)

**Table `messages`** :
```sql
- id (UUID, primary key)
- roomId (référence à rooms)
- senderId (référence à users)
- encryptedContent (texte chiffré)
- messageType (text | image)
- imageUrl (nullable)
- createdAt (timestamp)
- deletedAt (timestamp, nullable) -- Soft delete
```

### Store Zustand (Mémoire)

```typescript
messages: Record<string, Message[]>
// { "room-123": [...], "room-456": [...] }
```

### Pusher (Temps Réel)

**Channels** :
- `room-{roomId}` : Canal par salon

**Events** :
- `new-message` : Nouveau message
- `message-deleted` : Message supprimé
- `user-typing` : Utilisateur en train d'écrire

## Sécurité

Les améliorations maintiennent le même niveau de sécurité :

✅ **Chiffrement E2E** : Messages toujours chiffrés en DB
✅ **Soft Delete** : Messages supprimés marqués `deletedAt` (pas de suppression physique)
✅ **Panic Mode** : Efface toujours le store local et les clés
✅ **Session Storage** : Clés de chiffrement en sessionStorage (cleared on tab close)
✅ **Permissions** : Vérification des droits côté serveur

## Performances

### Optimisations

1. **Fetch sélectif** : Seulement le salon actif
2. **Limite de messages** : 100 derniers messages par salon
3. **Déchiffrement asynchrone** : Ne bloque pas l'UI
4. **Sync périodique** : 30s (équilibre entre temps réel et charge)

### Impact Réseau

- **Ouverture salon** : 1 requête GET
- **Sync périodique** : 1 requête GET / 30s
- **Envoi message** : 1 requête POST + broadcast Pusher
- **Suppression** : 1 requête DELETE + broadcast Pusher

## Prochaines Améliorations Possibles

### Court Terme
- [ ] Indicateur visuel de synchronisation (spinner)
- [ ] Toast notifications pour les erreurs (moins intrusif qu'alert)
- [ ] Retry automatique en cas d'échec réseau
- [ ] Queue de messages en attente d'envoi

### Moyen Terme
- [ ] Compression des messages avant chiffrement
- [ ] Pagination des messages (load more)
- [ ] Cache intelligent (service worker)
- [ ] Synchronisation différentielle (seulement les nouveaux)

### Long Terme
- [ ] Offline-first avec IndexedDB
- [ ] Réconciliation des conflits
- [ ] Synchronisation WebSocket (remplacer Pusher)
- [ ] Chiffrement des images

## Conclusion

Les messages sont maintenant **toujours synchronisés** avec la base de données :

✅ À l'ouverture de chaque salon (cache-busting)
✅ Périodiquement toutes les 30 secondes
✅ En temps réel via Pusher
✅ Avec gestion d'erreurs robuste
✅ Sans doublons
✅ Avec logging complet pour le débogage

Les messages ne peuvent plus disparaître de manière aléatoire car ils sont **toujours récupérés depuis la DB** et **sauvegardés avant d'être affichés**.

