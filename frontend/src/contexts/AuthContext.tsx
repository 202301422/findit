import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth as firebaseAuth } from '../firebase';
import api from '../utils/api';
import { disconnectSocket, setSocketAuthToken } from '../utils/socketClient';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  username?: string;
  avatar?: string;
  bio?: string;
  college?: string;
  city?: string;
  state?: string;
  country?: string;
  isVerified: boolean;
  authProvider: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<any>;
  signup: (data: any) => Promise<any>;
  googleLogin: () => Promise<any>;
  logout: () => Promise<void>;
  verifyEmail: (data: any) => Promise<any>;
  forgotPassword: (data: any) => Promise<any>;
  resetPassword: (data: any) => Promise<any>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const clearSession = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setSocketAuthToken(null);
    disconnectSocket();
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');

      if (response.data.success) {
        return response.data.data.user as User;
      }
    } catch (error) {
       console.error('Session validation failed', error);
    }
    return null;
  };

  useEffect(() => {
    const validateSession = async () => {
      const currentUser = await fetchCurrentUser();
      if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(currentUser));
      } else {
          clearSession();
      }
      setIsLoading(false);
    };

    void validateSession();
  }, []);

  const refreshUser = async () => {
    const currentUser = await fetchCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      localStorage.setItem('user', JSON.stringify(currentUser));
    }
  };

  const handleLoginSuccess = (userData: User, accessToken: string) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', accessToken);
    setSocketAuthToken(accessToken);
  };

  const login = async (data: any) => {
    try {
      const res = await api.post('/auth/login', data);
      if (res.data.success) {
        const { user, accessToken } = res.data.data;
        handleLoginSuccess(user, accessToken);
      }
      return res.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  };

  const signup = async (data: any) => {
    try {
      const res = await api.post('/auth/signup', data);
      return res.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  };

  const googleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
        hd: 'dau.ac.in', // Hint for dau.ac.in domains
      });
      
      const result = await signInWithPopup(firebaseAuth, provider);
      const idToken = await result.user.getIdToken();
      
      const res = await api.post('/auth/google', { idToken });
      
      if (res.data.success) {
        const { user, accessToken } = res.data.data;
        handleLoginSuccess(user, accessToken);
      }
      return res.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  };

  const logout = async () => {
    try {
      if (isAuthenticated) {
        await api.post('/auth/logout');
      }
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      clearSession();
    }
  };

  const verifyEmail = async (data: any) => {
    try {
      const res = await api.post('/auth/verify-otp', data);
      return res.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  };

  const forgotPassword = async (data: any) => {
    try {
      const res = await api.post('/auth/forgot-password', data);
      return res.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  };

  const resetPassword = async (data: any) => {
    try {
      const res = await api.post('/auth/reset-password', data);
      return res.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        googleLogin,
        logout,
        verifyEmail,
        forgotPassword,
        resetPassword,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
