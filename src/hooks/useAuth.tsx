import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { signIn, signOut, getProfile, onAuthChange, type Profile } from "@/services/auth";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isOwner: boolean;
  isDelivery: boolean;
  isPresencial: boolean;
  isMaster: boolean;
  role: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session?.user) {
          setUser(session.user);
          const p = await getProfile(session.user.id).catch(() => null);
          if (!cancelled) setProfile(p);
        }
      } catch {
        // session fetch failed
      }
      if (!cancelled) setLoading(false);
    };
    // safety: force loading false after 8s even if init hangs
    const fallback = setTimeout(() => { if (!cancelled) setLoading(false); }, 8000);
    init().finally(() => clearTimeout(fallback));

    const subscription = onAuthChange(async (event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        // Load profile asynchronously to avoid blocking
        getProfile(session.user.id).then(p => {
          if (!cancelled) setProfile(p);
        }).catch(() => {
          if (!cancelled) setProfile(null);
        });
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
      }
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    await signIn(email, password);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const role = profile?.role ?? null;

  const value: AuthContextType = {
    user,
    profile,
    loading,
    role,
    isOwner: role === "owner",
    isDelivery: role === "delivery",
    isPresencial: role === "presencial",
    isMaster: role === "master",
    signIn: handleSignIn,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useRequireAuth(allowedRoles?: string[]) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/admin/login", { replace: true });
      return;
    }
    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
      navigate("/admin/login", { replace: true });
    }
  }, [user, profile, loading, navigate, allowedRoles]);

  return { user, profile, loading };
}
