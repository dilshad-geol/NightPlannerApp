
"use client";

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Use the initialized auth instance
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUpWithEmail: typeof createUserWithEmailAndPassword;
  signInWithEmail: typeof signInWithEmailAndPassword;
  signOutUser: typeof signOut;
  sendUserEmailVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const sendUserEmailVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        toast({
          title: "Verification Email Sent",
          description: "Please check your inbox to verify your email address.",
          variant: "default",
        });
      } catch (error: any) {
        console.error("Error sending verification email:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to send verification email.",
          variant: "destructive",
        });
      }
    } else {
       toast({
          title: "Error",
          description: "No user is currently signed in to send a verification email.",
          variant: "destructive",
        });
    }
  };


  const value = {
    currentUser,
    loading,
    signUpWithEmail: (email, password) => createUserWithEmailAndPassword(auth, email, password),
    signInWithEmail: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signOutUser: () => signOut(auth),
    sendUserEmailVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
