import {
  AuthProvider as CoreAuthProvider,
  useAuth as useCoreAuth,
} from "@/contexts/AuthContext";

export const AuthProvider = CoreAuthProvider;

export function useAuth() {
  const auth = useCoreAuth();

  return {
    ...auth,
    profile: auth.user
      ? {
          full_name: auth.user.full_name ?? "",
          avatar_url: auth.user.avatar_url ?? null,
        }
      : null,
    isStaff: auth.roles.some((role) => role === "ceo" || role === "supervisor" || role === "payroll_officer" || role === "finance"),
  };
}
