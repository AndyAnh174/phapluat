'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authUtils, UserType } from '@/lib/auth';
import { authAPI, StudentProfile } from '@/lib/api';

interface AuthContextType {
  userType: UserType;
  studentProfile: StudentProfile | null;
  isAuthenticated: boolean;
  setUserType: (type: UserType) => void;
  setStudentProfile: (profile: StudentProfile | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userType, setUserTypeState] = useState<UserType>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize from localStorage
    const storedUserType = authUtils.getUserType();
    const authenticated = authUtils.isAuthenticated();
    setUserTypeState(storedUserType);
    setIsAuthenticated(authenticated);

    // Fetch student profile if student is logged in
    // Only fetch if we're not on the homepage (to avoid unnecessary redirects)
    if (storedUserType === 'student' && authenticated) {
      // Silently try to fetch profile, but don't clear token on homepage
      authAPI
        .getStudentProfile()
        .then(setStudentProfile)
        .catch((err) => {
          // If profile fetch fails, only clear auth if we're on a protected route
          // On homepage, just silently fail
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
          const isProtectedRoute = currentPath.startsWith('/student/exam') || currentPath.startsWith('/login');
          
          if (isProtectedRoute) {
            authUtils.clearToken();
            setUserTypeState(null);
            setIsAuthenticated(false);
          } else {
            // On homepage, just clear the state but don't redirect
            setUserTypeState(null);
            setIsAuthenticated(false);
          }
        });
    }
  }, []);

  const setUserType = (type: UserType) => {
    setUserTypeState(type);
    // Update isAuthenticated based on token existence
    const hasToken = !!authUtils.getToken();
    setIsAuthenticated(hasToken);
  };

  const logout = () => {
    authUtils.clearToken();
    setUserTypeState(null);
    setStudentProfile(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        userType,
        studentProfile,
        isAuthenticated,
        setUserType,
        setStudentProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

