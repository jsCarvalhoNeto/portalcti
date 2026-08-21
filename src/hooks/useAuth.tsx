import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { login, logout, getCurrentUser, signUp as apiSignUp, type UserProfile as AuthUserProfile, type SignUpCredentials } from '@/services/authService';
import { hasTemporaryPassword } from '@/services/studentService';
import { supabase } from '@/lib/supabaseClient';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  student_registration?: string | null;
  phone?: string | null;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'student' | 'teacher';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, studentRegistration?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isStudent: boolean;
  isTeacher: boolean;
  hasTemporaryPassword: boolean;
  checkTemporaryPassword: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTempPassword, setHasTempPassword] = useState(false);

  // Referência para comparar o usuário atual e evitar re-renders desnecessários
  const currentUserRef = useRef<{ id: string; email: string; role: string | null } | null>(null);

  const setUserData = useCallback((authUser: AuthUserProfile | null) => {
    if (!authUser) {
      if (currentUserRef.current !== null) {
        currentUserRef.current = null;
        setUser(null);
        setProfile(null);
        setUserRole(null);
        setHasTempPassword(false);
      }
      return;
    }

    // Se o usuário e papel continuam exatamente os mesmos, NÃO recria os objetos de estado
    if (
      currentUserRef.current &&
      currentUserRef.current.id === authUser.id &&
      currentUserRef.current.email === authUser.email &&
      currentUserRef.current.role === authUser.role
    ) {
      return;
    }

    currentUserRef.current = {
      id: authUser.id,
      email: authUser.email,
      role: authUser.role || null
    };

    const userData = { id: authUser.id, email: authUser.email };
    const profileData: UserProfile = {
      id: authUser.id,
      user_id: authUser.id,
      full_name: authUser.full_name,
      email: authUser.email,
      student_registration: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Verificar se o usuário tem senha temporária (apenas para estudantes)
    if (authUser.role === 'student') {
      hasTemporaryPassword(authUser.id).then(isTemp => {
        setHasTempPassword(isTemp);
      }).catch(() => {
        setHasTempPassword(false);
      });
    } else {
      setHasTempPassword(false);
    }

    setUser(userData);
    setProfile(profileData);
    setUserRole(authUser.role as UserRole);
  }, []);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser && active) {
          setUserData(currentUser);
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    checkSession();

    // Escutar mudanças de estado de autenticação no Supabase de forma reativa
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignorar recarregamentos destrutivos na renovação de token se o usuário já estiver carregado
      if (event === 'TOKEN_REFRESHED') {
        if (session?.user && currentUserRef.current?.id === session.user.id) {
          return;
        }
      }

      if (session?.user) {
        if (currentUserRef.current?.id === session.user.id) {
          return;
        }
        const currentUser = await getCurrentUser();
        if (currentUser && active) {
          setUserData(currentUser);
        }
      } else {
        if (active) {
          setUserData(null);
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [setUserData]);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    setLoading(true);

    try {
      const result = await login({ email, password });

      if (result.success && result.user) {
        // Salvar ID para fallback de header (caso cookies falhem)
        localStorage.setItem('user_session_header', result.user.id);

        setUserData(result.user);
        setLoading(false);
        return { error: null };
      } else {
        setLoading(false);
        return { error: result.error || 'Erro de autenticação. Por favor, verifique suas credenciais.' };
      }
    } catch (error) {
      setLoading(false);
      return { error: 'Erro de conexão com o servidor.' };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, studentRegistration?: string): Promise<{ error: string | null }> => {
    setLoading(true);

    try {
      const credentials: SignUpCredentials = {
        email,
        password,
        fullName,
        studentRegistration
      };

      const result = await apiSignUp(credentials);

      if (result.success && result.user) {
        // Salvar ID para fallback de header (caso cookies falhem)
        localStorage.setItem('user_session_header', result.user.id);

        setUserData(result.user);
        setLoading(false);
        return { error: null };
      } else {
        setLoading(false);
        return { error: result.error || 'Erro ao criar conta.' };
      }
    } catch (error) {
      setLoading(false);
      return { error: 'Erro de conexão com o servidor.' };
    }
  };

  const signOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
    localStorage.removeItem('user_session_header');
    setUserData(null);
    setHasTempPassword(false);
  };

  const checkTemporaryPassword = async (userId: string): Promise<boolean> => {
    return await hasTemporaryPassword(userId);
  };

  const value = useMemo(() => ({
    user,
    profile,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: userRole === 'admin',
    isStudent: userRole === 'student',
    isTeacher: userRole === 'teacher',
    hasTemporaryPassword: hasTempPassword,
    checkTemporaryPassword,
  }), [user, profile, userRole, loading, hasTempPassword]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
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
