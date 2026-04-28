# Règles Firestore à coller dans Firebase Console
# Firestore Database → Rules → Publish

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Lecture publique pour le classement
      allow read: if true;
      // Écriture uniquement par l'utilisateur lui-même
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
