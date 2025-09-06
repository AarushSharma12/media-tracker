import { useState, useEffect, createContext, useContext } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../services/firebaseConfig";

// Create Auth Context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sign up with email and password
  const signup = async (email, password) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Sign in with email and password
  const login = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    error,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
