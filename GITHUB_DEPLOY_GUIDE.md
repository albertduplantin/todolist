# 🚀 GUIDE DÉPLOIEMENT GITHUB + VERCEL

## ✅ CE QUI A ÉTÉ FAIT

### 1. Bugs corrigés ✅
- ✅ Messages en double (on évite d'ajouter 2 fois via Pusher)
- ✅ Messages supprimés qui réapparaissent (soft delete avec deletedAt)

### 2. Git commit créé ✅
- ✅ Commit "TaskFlow v1.0" avec 68 fichiers
- ✅ Prêt à être poussé sur GitHub

### 3. Déployé sur Vercel ✅
- ✅ **URL actuelle** : https://todolist-iebq5lh4s-albertduplantins-projects.vercel.app

---

## 📝 ÉTAPES SUIVANTES

### 1. 🐙 POUSSER SUR GITHUB

#### Option A : Créer un nouveau repo sur GitHub.com
1. Aller sur https://github.com/new
2. Nom du repo : `taskflow` (ou `todolist`)
3. Description : "Application de todo-list avec chat chiffré E2E"
4. **NE PAS** initialiser avec README (on en a déjà un)
5. Cliquer "Create repository"

#### Option B : Utiliser un repo existant
Si vous avez déjà un repo, récupérez l'URL.

#### Ensuite, dans le terminal :
```bash
# Ajouter le remote GitHub (remplacez par VOTRE URL)
git remote add origin https://github.com/VOTRE-USERNAME/taskflow.git

# Pousser le code
git push -u origin main
```

---

### 2. 🌐 DOMAINE VERCEL

#### Problème actuel :
`todolist.vercel.app` est **déjà pris** par quelqu'un d'autre (domaine global Vercel).

#### Solutions :

**Option A : Utiliser le domaine auto-généré**
- URL : `todolist-iebq5lh4s-albertduplantins-projects.vercel.app`
- ✅ Fonctionne immédiatement
- ❌ URL longue

**Option B : Choisir un autre alias Vercel**
```bash
# Essayer d'autres noms disponibles
vercel alias todolist-iebq5lh4s-albertduplantins-projects.vercel.app taskflow-app.vercel.app
vercel alias todolist-iebq5lh4s-albertduplantins-projects.vercel.app mon-taskflow.vercel.app
vercel alias todolist-iebq5lh4s-albertduplantins-projects.vercel.app taskflow-chat.vercel.app
```

**Option C : Utiliser un domaine personnalisé (recommandé)**
1. Acheter un domaine (ex: taskflow.fr, mon-app.com)
2. Sur Vercel Dashboard → Settings → Domains
3. Ajouter votre domaine personnalisé
4. Configurer les DNS

**Option D : Configurer vercel.json pour un alias automatique**
```bash
# Dans le projet, créer vercel.json
echo '{"alias": ["taskflow-chat.vercel.app"]}' > vercel.json
git add vercel.json
git commit -m "Add Vercel alias"
git push
vercel --prod
```

---

### 3. 🔗 LIER GITHUB À VERCEL (Auto-deploy)

Pour des déploiements automatiques à chaque push :

1. **Aller sur Vercel Dashboard** : https://vercel.com/dashboard
2. **Projet** : `todolist`
3. **Settings** → **Git**
4. **Connect Git Repository**
5. Sélectionner votre repo GitHub
6. ✅ Maintenant chaque push sur `main` = déploiement auto !

---

## 🐛 BUGS CORRIGÉS - DÉTAILS TECHNIQUES

### Bug 1 : Messages en double

**Cause** :
- Message ajouté localement après envoi
- Puis Pusher broadcast → ajouté à nouveau

**Solution** :
```typescript
// Avant : on ajoutait toujours
channel.bind('new-message', (data) => {
  addMessage(roomId, data);
});

// Après : on ajoute seulement si pas de nous
channel.bind('new-message', (data) => {
  if (data.senderId !== user?.id) {
    addMessage(roomId, data);
  }
});
```

### Bug 2 : Messages supprimés réapparaissent

**Cause** :
- Suppression pas propagée correctement
- Re-fetch des messages incluait les supprimés

**Solution** :
```typescript
// API : filtre les messages avec deletedAt
.where(and(
  eq(messages.roomId, roomId), 
  isNull(messages.deletedAt)  // ← soft delete
))

// Client : suppression immédiate du state
if (response.ok) {
  removeMessage(currentRoomId, messageId);
}
```

---

## 📊 RÉSUMÉ DES URLs

| Type | URL | Status |
|------|-----|--------|
| **Production actuelle** | todolist-iebq5lh4s-albertduplantins-projects.vercel.app | ✅ En ligne |
| **Alias souhaité** | todolist.vercel.app | ❌ Déjà pris |
| **Alternative** | taskflow-app.vercel.app | ⏳ À tester |
| **Domaine custom** | À configurer | ⏳ Optionnel |

---

## 🧪 TESTER LES CORRECTIONS

### Test 1 : Messages en double
1. Ouvrir 2 onglets avec 2 utilisateurs différents
2. Envoyer un message depuis User 1
3. ✅ Vérifier qu'il apparaît **1 seule fois** pour User 1
4. ✅ Vérifier qu'il apparaît **1 seule fois** pour User 2

### Test 2 : Messages supprimés
1. Envoyer plusieurs messages
2. Supprimer un message
3. ✅ Vérifier qu'il disparaît
4. Quitter le salon
5. Revenir dans le salon
6. ✅ Vérifier que le message supprimé n'est **pas réapparu**

---

## 🚀 COMMANDES RAPIDES

```bash
# Vérifier le status Git
git status

# Créer un nouveau commit
git add .
git commit -m "Fix: messages bugs"

# Pousser sur GitHub (après avoir ajouté le remote)
git push origin main

# Redéployer sur Vercel
vercel --prod

# Voir les logs
vercel logs --follow

# Lister les déploiements
vercel ls

# Ouvrir le dashboard Vercel
vercel open
```

---

## 📧 SUPPORT

Si vous avez besoin d'aide :
1. Vérifier les logs Vercel : `vercel logs`
2. Vérifier la console browser (F12)
3. Vérifier les variables d'environnement : `vercel env ls`

---

**🎉 Votre application est prête ! Il ne reste plus qu'à pousser sur GitHub et configurer un alias si souhaité ! 🎉**

