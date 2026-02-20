import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, UserRole, AuthState } from "@/types/auth";

interface AuthContextType extends AuthState {
  session: Session | null;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: any; needsVerification?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  primaryRole: UserRole;
  isEmailVerified: boolean;
  isCEO: boolean;
  isSupervisor: boolean;
  isWorker: boolean;
  isPayrollOfficer: boolean;
  isFinance: boolean;
  isClerk: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

      if (profile) {
        setUser(profile as unknown as UserProfile);
      }
      if (userRoles) {
        // Map DB enum roles to app roles
        const roleMap: Record<string, UserRole> = {
          ceo: 'ceo',
          manager: 'ceo',
          admin: 'ceo',
          supervisor: 'supervisor',
          payroll_officer: 'payroll_officer',
          accountant: 'finance',
          clerk: 'clerk',
          hr: 'supervisor',
          worker: 'worker',
          employee: 'worker',
        };
        setRoles(
          (userRoles as any[]).map(r => roleMap[r.role] || 'worker')
        );
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setIsEmailVerified(!!session?.user?.email_confirmed_at);
        
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setUser(null);
          setRoles([]);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsEmailVerified(!!session?.user?.email_confirmed_at);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
      },
    });
    return { error, needsVerification: false };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRoles([]);
    setSession(null);
    setIsEmailVerified(false);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  // Determine primary role (highest privilege)
  const rolePriority: UserRole[] = ['ceo', 'payroll_officer', 'finance', 'clerk', 'supervisor', 'worker'];
  const primaryRole = rolePriority.find(r => roles.includes(r)) || 'worker';

  const isApproved = user?.account_status === 'approved';

  const isCEO = roles.includes('ceo');
  const isSupervisor = roles.includes('supervisor');
  const isWorker = roles.includes('worker');
  const isPayrollOfficer = roles.includes('payroll_officer');
  const isFinance = roles.includes('finance') || roles.includes('payroll_officer');
  const isClerk = roles.includes('clerk');

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        roles,
        isAuthenticated: !!session,
        isLoading,
        isApproved,
        isEmailVerified,
        primaryRole,
        isCEO,
        isSupervisor,
        isWorker,
        isPayrollOfficer,
        isFinance,
        isClerk,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
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
