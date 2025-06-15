'use client';

import type { UserProfile } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config'; 
// LoadingSpinner import removed as AuthProvider itself will no longer render it directly.
// UI based on loading state is handled by consumers like AppLayout.

interface AuthContextType {
  user: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true); // True until auth state is resolved

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // UserProfile extends FirebaseUser, so spreading firebaseUser is appropriate
        const userProfile: UserProfile = { 
          ...firebaseUser 
        };
        setUser(userProfile);

        try {
          const adminDocRef = doc(db, 'admins', firebaseUser.uid);
          const adminDocSnap = await getDoc(adminDocRef);
          setIsAdmin(adminDocSnap.exists());
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }

      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false); // Auth state has been determined
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    // setLoading(true); // Optionally set loading true if logout is slow
    try {
      await auth.signOut();
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Error signing out: ", error);
      // Handle error appropriately
    } finally {
      // setLoading(false); // If setLoading(true) was used above
    }
  };
  
  // AuthProvider will now always render the Provider and its children.
  // The conditional rendering of a loading spinner that caused hydration issues has been removed.
  // Consumers of the context (e.g., AppLayout, HomePage) are responsible for UI based on the 'loading' state.

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
