import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isReady: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isReady: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const useAuthReady = () => {
  const { user, isReady } = useAuth();
  return { user, isReady };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const hasRestoredSession = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!isMounted) return;

        // Intercept password recovery — redirect before dashboard renders
        if (event === "PASSWORD_RECOVERY") {
          window.location.assign(`${import.meta.env.BASE_URL}#/reset-password`);
          return;
        }

        setSession(nextSession);

        if (hasRestoredSession.current) {
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession()
      .then(({ data: { session: restoredSession } }) => {
        if (!isMounted) return;

        setSession(restoredSession);
        hasRestoredSession.current = true;
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;

        hasRestoredSession.current = true;
        setLoading(false);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        isReady: !loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
