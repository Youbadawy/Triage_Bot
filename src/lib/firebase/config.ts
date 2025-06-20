import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { validateEnv, getEnv } from '@/lib/config/env-validation';
// import { getFunctions, Functions } from 'firebase/functions'; // If needed for client-side function calls
// import { getStorage, FirebaseStorage } from 'firebase/storage'; // If using Firebase Storage

// Validate environment variables at startup
const env = validateEnv();

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
// let functions: Functions;
// let storage: FirebaseStorage;

if (typeof window !== 'undefined') {
  // functions = getFunctions(app); // Uncomment if needed
  // storage = getStorage(app); // Uncomment if needed
} else {
  // Handle server-side or build-time scenarios if necessary,
  // though client-side Firebase SDK is primarily for the browser.
  // For Firebase Admin SDK usage on the server, you'd have a different setup.
}

// Export the app instance
export default app;
