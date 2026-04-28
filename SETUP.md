# Rep Counter — Guide de déploiement

## Structure du projet

```
rep-counter/
├── public/
│   ├── index.html          ← App principale
│   ├── manifest.json       ← Config PWA
│   ├── sw.js               ← Service Worker (offline)
│   └── stats/
│       └── index.html      ← Page de profil publique
└── .github/
    └── workflows/
        └── deploy.yml      ← Auto-deploy GitHub Pages
```

---

## ÉTAPE 1 — GitHub Pages (hébergement gratuit)

### 1.1 Créer le repo

```bash
cd rep-counter
git init
git add .
git commit -m "Initial commit"
```

Sur github.com → New repository → nom: `rep-counter` → Public → Create

```bash
git remote add origin https://github.com/TON-PSEUDO/rep-counter.git
git branch -M main
git push -u origin main
```

### 1.2 Activer GitHub Pages

Settings → Pages → Source: **GitHub Actions**

Après le push, l'action se déclenche automatiquement.
Ton app sera disponible sur : `https://TON-PSEUDO.github.io/rep-counter/`

### 1.3 Mettre à jour l'URL de partage dans index.html

Dans `public/index.html`, ligne ~410, remplace :
```js
return `${location.origin}/stats/${uid}`;
```
par :
```js
return `https://TON-PSEUDO.github.io/rep-counter/stats/?u=${uid}`;
```

Et dans `public/stats/index.html`, ligne ~95, remplace :
```js
const userId = pathParts[pathParts.length - 1];
```
par :
```js
const userId = new URLSearchParams(location.search).get('u');
```

---

## ÉTAPE 2 — Firebase (sauvegarde cloud + sync)

### 2.1 Créer un projet Firebase

1. Va sur https://console.firebase.google.com
2. **Create a project** → nom: `rep-counter` → Continue
3. Désactive Google Analytics si tu veux → Create project

### 2.2 Configurer Firestore

1. Dans le menu gauche : **Firestore Database**
2. **Create database** → Start in **test mode** → Next → choisir une région (ex: `europe-west1`) → Enable

### 2.3 Récupérer la config web

1. Project Overview → icône **</>** (Web)
2. Enregistre l'app (nom au choix)
3. Copie le bloc `firebaseConfig` :

```js
{
  "apiKey": "AIzaSy...",
  "authDomain": "rep-counter-xxx.firebaseapp.com",
  "projectId": "rep-counter-xxx",
  "storageBucket": "rep-counter-xxx.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abc..."
}
```

### 2.4 Sécuriser Firestore (règles)

Dans Firestore → **Rules**, remplace par :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Lecture publique des profils (pour les pages de partage)
    match /users/{userId} {
      allow read: if true;
      // Écriture uniquement si l'ID correspond (pas d'auth = on fait confiance à l'ID)
      allow write: if true;
    }
  }
}
```

> **Note**: Pour une sécurité maximale, tu peux ajouter Firebase Auth (Google Sign-In) plus tard.

### 2.5 Coller la config dans l'app

Dans l'app → onglet **Réglages** → **Configurer Firebase** → colle le JSON → Enregistrer

La sync démarre automatiquement. Le point vert indique que tout est OK.

---

## ÉTAPE 3 — Installer comme app Android

1. Ouvre Chrome sur Android
2. Va sur ton URL GitHub Pages
3. Menu ⋮ → **Ajouter à l'écran d'accueil**
4. L'app apparaît comme une app native

---

## Fonctionnement offline

- Le Service Worker met en cache l'app au premier chargement
- En cas de perte de connexion : l'app fonctionne normalement
- Dès que la connexion revient : les données sont synchronisées automatiquement
- Les données sont aussi stockées localement (localStorage) comme backup

---

## Structure des données Firestore

```
users/
  {userId}/
    name: "Thomas"
    updatedAt: 1234567890
    data:
      "2025-01-15":
        pushups: 50
        pullups: 20
        _sessions: [{exId, count, time}, ...]
      "2025-01-16":
        ...
```

---

## Partage

Ton lien de partage : `https://TON-PSEUDO.github.io/rep-counter/stats/?u={userId}`

Ce lien affiche une page publique en lecture seule avec :
- Tes stats aujourd'hui, cette semaine, ce mois, total
- Le graphique des 7 derniers jours
- Le détail par exercice sur 30 jours

---

## Mises à jour

Pour mettre à jour l'app :
```bash
git add .
git commit -m "Update"
git push
```
GitHub Actions redéploie automatiquement en ~1 minute.
