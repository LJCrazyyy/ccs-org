import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'student' | 'faculty';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    const credentials = {
      'admin@example.com': { password: 'admin123', name: 'Admin User', role: 'admin' as UserRole },
      'student@example.com': { password: 'student123', name: 'John Student', role: 'student' as UserRole },
      'faculty@example.com': { password: 'faculty123', name: 'Dr. Faculty', role: 'faculty' as UserRole },
    };

    const cred = credentials[email as keyof typeof credentials];
    if (cred && cred.password === password) {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: cred.name,
        email,
        role: cred.role,
      };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
