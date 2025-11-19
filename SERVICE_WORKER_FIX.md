# Fix du Service Worker - Cache des API

## 🐛 Problème Identifié

Le **Service Worker** (`public/sw.js`) était la cause principale des messages qui apparaissaient et disparaissaient aléatoirement.

### Comportement Problématique (v2)

```javascript
// Ancien code (PROBLÉMATIQUE)
event.respondWith(
  caches.match(event.request).then((response) => {
    // ⚠️ Retournait le CACHE en premier pour TOUTES les requêtes GET
    if (response) {
      return response; // Données anciennes/stale
    }
    return fetch(event.request);
  })
);
```

### Impact

1. **API `/api/messages?roomId=xxx`** → Retournait les **anciens messages du cache**
2. **API `/api/rooms`** → Retournait les **anciennes listes de salons**
3. Les messages nouveaux n'apparaissaient pas car le SW servait le cache
4. Les messages supprimés réapparaissaient depuis le cache
5. La synchronisation DB était ignorée

### Pourquoi c'était pire que prévu ?

Le cache du Service Worker a priorité sur :
- ✗ Les headers `Cache-Control: no-store` dans `next.config.ts`
- ✗ Les headers `no-cache` dans les fetch
- ✗ Le cache-busting avec `?_t=${timestamp}`

**Le Service Worker intercepte AVANT que ces protections ne s'appliquent !**

## ✅ Solution Implémentée (v3)

### 1. Exclusion des Routes API

```javascript
// ⚠️ CRITICAL: NEVER cache API routes - they must always be fresh
if (event.request.url.includes('/api/')) {
  console.log('[SW] Bypassing cache for API route:', event.request.url);
  event.respondWith(fetch(event.request));
  return; // Skip cache completely
}
```

### 2. Exclusion des Routes Auth (Clerk)

```javascript
// ⚠️ NEVER cache Clerk auth routes
if (event.request.url.includes('/sign-in') || 
    event.request.url.includes('/sign-up') ||
    event.request.url.includes('clerk')) {
  event.respondWith(fetch(event.request));
  return;
}
```

### 3. Cache Sélectif (Seulement Statiques)

```javascript
// Cache UNIQUEMENT les assets statiques
if (event.request.url.match(/\.(html|css|js|png|jpg|jpeg|svg|ico|json)$/)) {
  caches.open(CACHE_NAME).then((cache) => {
    cache.put(event.request, responseToCache);
  });
}
```

### 4. Bump de Version du Cache

```javascript
const CACHE_NAME = 'taskflow-v3'; // v2 → v3
// Invalide automatiquement l'ancien cache
```

## 🔍 Comment Vérifier le Fix

### 1. Ouvrir DevTools (F12)

**Application → Service Workers**
- Vérifier que `taskflow-v3` est actif
- "Update on reload" coché
- Cliquer "Unregister" pour forcer refresh

**Application → Cache Storage**
- Supprimer `taskflow-v2` si présent
- Vérifier qu'aucune route `/api/` n'est cachée

### 2. Tester dans Console

```javascript
// Vérifier que les API ne sont PAS en cache
caches.open('taskflow-v3').then(cache => {
  cache.keys().then(keys => {
    console.log('Cached URLs:', keys.map(k => k.url));
    // ✅ Devrait montrer seulement /, /manifest.json, et assets statiques
    // ✗ NE devrait PAS montrer /api/messages, /api/rooms, etc.
  });
});
```

### 3. Vérifier les Logs du SW

Dans DevTools Console, filtrer par `[SW]` :

```
[SW] Cache opened: taskflow-v3
[SW] Bypassing cache for API route: https://...app/api/messages?roomId=xxx
[SW] Bypassing cache for API route: https://...app/api/rooms
[SW] Serving from cache: https://...app/icon-192x192.png ✅
```

## 🚀 Déploiement

### Production (Vercel)

Lors du déploiement sur Vercel :

1. Le nouveau `sw.js` (v3) sera automatiquement servi
2. Les clients existants recevront la mise à jour au prochain chargement
3. L'ancien cache (v2) sera automatiquement supprimé

### Force Refresh pour les Utilisateurs

Si des utilisateurs ont toujours des problèmes après déploiement :

**Méthode 1 : Hard Refresh**
- Windows/Linux : `Ctrl + Shift + R` ou `Ctrl + F5`
- Mac : `Cmd + Shift + R`

**Méthode 2 : Clear Service Worker**
- F12 → Application → Service Workers
- Cliquer "Unregister"
- Recharger la page

**Méthode 3 : Page de Désinstallation**
- Aller sur `/unregister-sw.html`
- Cliquer "Unregister Service Worker"
- Retourner sur l'app

## 📊 Résultat Attendu

### Avant (v2 - PROBLÉMATIQUE)

```
Utilisateur A envoie message
  ↓
POST /api/messages ✅ Sauvegardé en DB
  ↓
Utilisateur B recharge salon
  ↓
GET /api/messages → Service Worker → CACHE (anciens messages) ✗
  ↓
Nouveaux messages N'APPARAISSENT PAS ❌
```

### Après (v3 - CORRIGÉ)

```
Utilisateur A envoie message
  ↓
POST /api/messages ✅ Sauvegardé en DB
  ↓
Utilisateur B recharge salon
  ↓
GET /api/messages → Service Worker BYPASS → DB directe ✅
  ↓
Nouveaux messages APPARAISSENT ✓
```

## 🎯 Fonctionnalités Préservées

Le PWA fonctionne toujours correctement :

✅ **Installation** : Bouton "Installer l'app" fonctionne
✅ **Icônes** : 192x192 et 512x512 affichées
✅ **Manifest** : Mode standalone
✅ **Cache Statique** : HTML/CSS/JS/Images en cache
✅ **Offline Partiel** : Page principale accessible offline
✅ **Mode Offline API** : Désormais impossible de voir d'anciennes données API

## ⚠️ Limitations du Mode Offline

Avec le fix, le comportement offline change :

### Avant (v2)
- Offline → API retourne anciennes données du cache
- **Problème** : Données incorrectes/stale

### Après (v3)
- Offline → API échoue (fetch error)
- **Avantage** : Pas de fausses données
- **Inconvénient** : Nécessite connexion pour le chat

### Pourquoi ce Choix ?

Pour une **application de chat chiffré sécurisé**, il est **CRITIQUE** que :
1. Les messages soient toujours à jour
2. Pas de risque de voir d'anciens messages supprimés
3. Synchronisation garantie avec la DB
4. Pas de fuite de données via le cache

Le mode **entièrement offline** n'est pas compatible avec un chat temps réel sécurisé.

## 🔐 Impact Sécurité

### Avant (v2) - Risques
- ✗ Messages supprimés pouvaient réapparaître (cache)
- ✗ Panic mode ne supprimait pas le cache du SW
- ✗ Messages pouvaient persister après déconnexion

### Après (v3) - Sécurisé
- ✅ Aucune API en cache
- ✅ Panic mode efficace (pas de résidus API)
- ✅ Messages uniquement en mémoire (store Zustand)
- ✅ Fermeture de l'onglet = tout est effacé

## 📝 Recommandations Futures

### Court Terme
- [ ] Ajouter un message "Mode offline" dans l'UI
- [ ] Désactiver les actions chat si offline
- [ ] Toast notification si fetch API échoue

### Moyen Terme
- [ ] Implémenter IndexedDB pour vraie persistance offline
- [ ] Queue de messages en attente (offline-first)
- [ ] Synchronisation différentielle au retour online

### Long Terme
- [ ] Migration vers Workbox (Google)
- [ ] Stratégies de cache sophistiquées
- [ ] Background sync pour messages

## 🎓 Leçons Apprises

1. **Service Workers ont priorité absolue** sur tous les headers HTTP
2. **Cache-first est dangereux** pour les API dynamiques
3. **PWA ≠ Offline-first automatique** pour tous les use cases
4. **Sécurité > Disponibilité offline** pour chat chiffré
5. **Version bumping** du cache est essentiel lors de changements

## 🔗 Références

- [Service Worker API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Cache Storage API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage)
- [Workbox (Google) - Stratégies de cache](https://developers.google.com/web/tools/workbox)
- [PWA Best Practices](https://web.dev/pwa-checklist/)

---

## ✅ Checklist de Déploiement

Avant de déployer en production :

- [x] Service Worker mis à jour vers v3
- [x] Routes API exclues du cache
- [x] Routes Auth exclues du cache
- [x] Cache sélectif pour assets statiques uniquement
- [x] Logging ajouté pour débogage
- [ ] Testé en local (npm run build && npm start)
- [ ] Vérifié dans DevTools (Cache Storage)
- [ ] Testé multi-utilisateurs
- [ ] Testé après hard refresh
- [ ] Documenté pour l'équipe

---

**Date de Fix** : 19/11/2024
**Version** : taskflow-v3
**Impact** : CRITIQUE - Résout le problème principal de synchronisation

