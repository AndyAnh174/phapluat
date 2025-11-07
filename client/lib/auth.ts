export type UserType = 'admin' | 'student' | null;

export const authUtils = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  setToken: (token: string, userType: UserType): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
    localStorage.setItem('userType', userType || '');
  },

  clearToken: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
  },

  getUserType: (): UserType => {
    if (typeof window === 'undefined') return null;
    return (localStorage.getItem('userType') as UserType) || null;
  },

  isAuthenticated: (): boolean => {
    return !!authUtils.getToken();
  },

  isAdmin: (): boolean => {
    return authUtils.getUserType() === 'admin';
  },

  isStudent: (): boolean => {
    return authUtils.getUserType() === 'student';
  },
};

// Google OAuth redirect
export const redirectToGoogleAuth = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  window.location.href = `${API_URL}/auth/google`;
};

