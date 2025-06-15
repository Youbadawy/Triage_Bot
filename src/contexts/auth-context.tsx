'use client';

import type { UserProfile } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config'; 
import { LoadingSpinner } from '@/components/shared/loading-spinner';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Potentially fetch additional user profile data from Firestore here
        const userProfile: UserProfile = {
          ...firebaseUser,
          // displayName: firebaseUser.displayName, // ensure these are mapped
          // email: firebaseUser.email,
          // photoURL: firebaseUser.photoURL,
          // uid: firebaseUser.uid,
        };
        setUser(userProfile);

        // Check for admin role (placeholder - use custom claims in production)
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
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      await auth.signOut();
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Error signing out: ", error);
      // Handle error appropriately, maybe with a toast
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }


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
