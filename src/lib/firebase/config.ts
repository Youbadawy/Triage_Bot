import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
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
let auth: Auth;
let db: Firestore;
// let functions: Functions;
// let storage: FirebaseStorage;

if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  // functions = getFunctions(app);
  // storage = getStorage(app);
} else if (typeof window !== 'undefined') {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  // functions = getFunctions(app);
  // storage = getStorage(app);
} else {
  // For server-side rendering or server actions, Firebase Admin SDK would be typically used.
  // This client-side setup won't run on the server.
  // If getApps() is empty on server, it means Admin SDK is not initialized or not used for this specific file.
  // To avoid errors during build/SSR when this file might be imported, provide placeholders or handle differently.
  // However, given its client-side nature, this part might not be hit server-side unless imported wrongly.
}

// Ensure db is exported, even if potentially undefined on server if not handled by Admin SDK
// This is primarily for client-side use.
export { app, auth, db /*, functions, storage */ };
