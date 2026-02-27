# Firebase Setup Instructions

To fix the "invalid-credential" and "Missing or insufficient permissions" errors, you need to configure your Firebase project in the Google Cloud/Firebase Console.

## 1. Fix "auth/invalid-credential"
This error usually means the **Email/Password** sign-in method is not enabled.

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project (**katara-1**).
3. Go to **Authentication** -> **Sign-in method**.
4. Click on **Email/Password**.
5. Turn on **Enable**.
6. Click **Save**.

## 2. Fix "Missing or insufficient permissions"
This error means your Firestore Database Security Rules are blocking the app from saving data.

1. Go to **Firestore Database** -> **Rules**.
2. Replace the existing rules with the following code to allow authenticated users to access their own data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write only their own documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow access to subcollections (like crops)
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

3. Click **Publish**.

After completing these steps, refresh your application and try again.
