/** Session de la personne connectée (patron SAGA AuthContext.tsx, session en cookie côté serveur). */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setCsrfToken } from '../api';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_role: 'agent' | 'admin';
  preferred_lang: 'fr' | 'nl';
  ui_mode: 'simple' | 'complet';
  theme: 'clair' | 'sombre';
  must_change_password: number;
  entity_roles: EntityRole[];
}

export interface EntityRole { entity_id: number; entity_code: string; role: 'agent' | 'chef_service' | 'secretariat' | 'gestionnaire' | 'auditeur' }

/** Entités dont la personne tient le registre. Confort d'affichage : le serveur recontrôle chaque appel. */
export function registerRoles(user: User | null): EntityRole[] {
  return (user?.entity_roles || []).filter((r) => r.role === 'secretariat' || r.role === 'gestionnaire');
}

/** Entités dont la personne est auditeur (journal des consultations). Confort d'affichage : le serveur recontrôle. */
export function auditRoles(user: User | null): EntityRole[] {
  return (user?.entity_roles || []).filter((r) => r.role === 'auditeur');
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  savePreferences: (p: Partial<Pick<User, 'preferred_lang' | 'ui_mode' | 'theme'>>) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try { setUser(await api.get<User>('/auth/me')); } catch { setUser(null); }
  }, []);

  useEffect(() => { refresh().finally(() => setLoading(false)); }, [refresh]);
  useEffect(() => {
    const h = () => setUser(null);
    window.addEventListener('app-unauthorized', h);
    return () => window.removeEventListener('app-unauthorized', h);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api.post<{ user: User }>('/auth/login', { email, password });
    setUser(r.user);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout', {}); } finally { setCsrfToken(null); setUser(null); }
  }, []);

  const savePreferences = useCallback(async (p: Partial<Pick<User, 'preferred_lang' | 'ui_mode' | 'theme'>>) => {
    setUser((u) => (u ? { ...u, ...p } : u));
    try { setUser(await api.put<User>('/auth/preferences', p)); } catch { /* le choix reste appliqué à l'écran */ }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh, savePreferences, isAdmin: user?.user_role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
