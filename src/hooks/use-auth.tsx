import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { lovable, isLovableConfigured } from "@/lib/lovable";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!isLovableConfigured) {
      setIsLoading(false);
      return;
    }

    lovable.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      startTransition(() => {
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
        setIsLoading(false);
      });
    });

    const { data: listener } = lovable.auth.onAuthStateChange((_event, nextSession) => {
      startTransition(() => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setIsLoading(false);
      });
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isAuthenticated: Boolean(session),
      isLoading,
      async signIn(email, password) {
        if (!isLovableConfigured) {
          throw new Error(
            "Configure VITE_LOVABLE_URL e VITE_LOVABLE_ANON_KEY para habilitar autenticação.",
          );
        }
        const { error } = await lovable.auth.signInWithPassword({ email, password });
        if (error) {
          throw error;
        }
      },
      async signUp(email, password) {
        if (!isLovableConfigured) {
          throw new Error(
            "Configure VITE_LOVABLE_URL e VITE_LOVABLE_ANON_KEY para habilitar autenticação.",
          );
        }
        const { error } = await lovable.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          throw error;
        }
      },
      async signInWithGoogle() {
        if (!isLovableConfigured) {
          throw new Error(
            "Configure VITE_LOVABLE_URL e VITE_LOVABLE_ANON_KEY para habilitar autenticação.",
          );
        }
        const { error } = await lovable.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          throw error;
        }
      },
      async signOut() {
        if (!isLovableConfigured) {
          throw new Error(
            "Configure VITE_LOVABLE_URL e VITE_LOVABLE_ANON_KEY para habilitar autenticação.",
          );
        }
        const { error } = await lovable.auth.signOut();
        if (error) {
          throw error;
        }
      },
    }),
    [isLoading, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return context;
}
