# Règles Firestore
# Firebase Console → Firestore Database → Rules → Publish

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}

---

# Règles Firebase Storage (pour les avatars)
# Firebase Console → Storage → Rules → Publish

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 2 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}

---

# ÉTAPES POUR ACTIVER FIREBASE STORAGE :
# 1. Firebase Console → Build → Storage → Get started
# 2. Start in production mode → Next → choisir europe-west1 → Done
# 3. Aller dans Rules → coller les règles Storage ci-dessus → Publish
