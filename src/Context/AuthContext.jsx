import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const ADMIN_EMAIL = "hsnibrastor@gmail.com";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // Check if admin session stored
        const adminSession = sessionStorage.getItem("admin_session");
        if (adminSession === "true") {
            setIsAdmin(true);
            setUser({ email: ADMIN_EMAIL, id: "admin" });
            setIsLoading(false);
            return;
        }

        // Get Supabase session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setIsAdmin(false);
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // Only update if no admin session
            const adminSess = sessionStorage.getItem("admin_session");
            if (!adminSess) {
                setUser(session?.user ?? null);
                setIsAdmin(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loginAsAdmin = () => {
        sessionStorage.setItem("admin_session", "true");
        setIsAdmin(true);
        setUser({ email: ADMIN_EMAIL, id: "admin" });
    };

    const logout = async () => {
        sessionStorage.removeItem("admin_session");
        setIsAdmin(false);
        await supabase.auth.signOut();
        setUser(null);
    };

    const displayName = user?.user_metadata?.display_name ?? user?.email ?? "";

    return (
        <AuthContext.Provider value={{ user, isAdmin, isLoading, loginAsAdmin, logout, displayName }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
    return ctx;
}

export { ADMIN_EMAIL };
