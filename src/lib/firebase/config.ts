import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
// import { getFunctions, Functions } from 'firebase/functions'; // If needed for client-side function calls
// import { getStorage, FirebaseStorage } from 'firebase/storage'; // If using Firebase Storage

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let authInstance: Auth; // Renamed to avoid conflict if 'auth' is used elsewhere as a generic term
let db: Firestore;
// let functions: Functions;
// let storage: FirebaseStorage;

if (typeof window !== 'undefined') {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  authInstance = getAuth(app);
  db = getFirestore(app);
  // functions = getFunctions(app); // Uncomment if needed
  // storage = getStorage(app); // Uncomment if needed
} else {
  // Handle server-side or build-time scenarios if necessary,
  // though client-side Firebase SDK is primarily for the browser.
  // For Firebase Admin SDK usage on the server, you'd have a different setup.
}

// Exporting the initialized instances for use in other parts of the app.
// Note: `authInstance` is exported as `auth` for conventional use.
export { app, authInstance as auth, db /*, functions, storage */ };
