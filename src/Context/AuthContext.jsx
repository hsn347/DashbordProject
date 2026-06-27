import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { DOMAIN_CONFIGS, detectDomain } from "./DomainContext";

// Detect domain admin credentials using the shared detectDomain logic
function getAdminCredentials() {
    const domain = detectDomain();
    return DOMAIN_CONFIGS[domain] ?? DOMAIN_CONFIGS["ibraabot.online"];
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const domainCfg = getAdminCredentials();
    const ADMIN_EMAIL = domainCfg.adminEmail;

    useEffect(() => {
        // Check if admin session stored
        const adminSession = sessionStorage.getItem("admin_session");
        const storedAdminEmail = sessionStorage.getItem("admin_email");
        // Validate session belongs to this domain's admin
        if (adminSession === "true" && storedAdminEmail === ADMIN_EMAIL) {
            setIsAdmin(true);
            setUser({ email: ADMIN_EMAIL, id: "admin" });
            setIsLoading(false);
            return;
        } else if (adminSession === "true" && storedAdminEmail !== ADMIN_EMAIL) {
            // Wrong domain admin session, clear it
            sessionStorage.removeItem("admin_session");
            sessionStorage.removeItem("admin_email");
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
    }, [ADMIN_EMAIL]);

    const loginAsAdmin = () => {
        sessionStorage.setItem("admin_session", "true");
        sessionStorage.setItem("admin_email", ADMIN_EMAIL);
        setIsAdmin(true);
        setUser({ email: ADMIN_EMAIL, id: "admin" });
    };

    const logout = async () => {
        sessionStorage.removeItem("admin_session");
        sessionStorage.removeItem("admin_email");
        setIsAdmin(false);
        await supabase.auth.signOut();
        setUser(null);
    };

    const displayName = user?.user_metadata?.display_name ?? user?.email ?? "";

    return (
        <AuthContext.Provider value={{ user, isAdmin, isLoading, loginAsAdmin, logout, displayName, domainAdminEmail: ADMIN_EMAIL, domainAdminPassword: domainCfg.adminPassword }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
    return ctx;
}

// Keep for legacy imports
export const ADMIN_EMAIL = DOMAIN_CONFIGS["ibraabot.online"].adminEmail;
