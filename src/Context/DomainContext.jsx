import { createContext, useContext, useEffect } from "react";

const DomainContext = createContext(null);

// Domain configurations
export const DOMAIN_CONFIGS = {
    "ibraabot.online": {
        key: "ibraabot",
        name: "IBRA~♕",
        adminEmail: "hsnibrastor@gmail.com",
        adminPassword: "zxcvbnmwwee5#",
        showSettings: true,
        showDomainsStats: true,
        accentColor: "#6c63ff",
        accentHover: "#7d75ff",
        accentSoft: "rgba(108, 99, 255, 0.15)",
        accentGlow: "rgba(108, 99, 255, 0.3)",
        goldColor: "#f59e0b",
        goldSoft: "rgba(245, 158, 11, 0.15)",
        logo: null, // use icon
        logoType: "icon", // 'icon' | 'image'
    },
    "sharkgo.online": {
        key: "sharkgo",
        name: "SharkBot",
        adminEmail: "Sharkfdsa123@gmail.com",
        adminPassword: "sharkadmin2025#",
        showSettings: false,
        showDomainsStats: false,
        accentColor: "#00bcd4",
        accentHover: "#00e5ff",
        accentSoft: "rgba(0, 188, 212, 0.15)",
        accentGlow: "rgba(0, 188, 212, 0.35)",
        goldColor: "#00acc1",
        goldSoft: "rgba(0, 172, 193, 0.15)",
        logo: "/sharkbot-logo.png",
        logoType: "image",
    },
};

// Detect current domain (exported so other contexts can reuse)
export function detectDomain() {
    if (typeof window === "undefined") return "ibraabot.online";
    const hostname = window.location.hostname;
    for (const domain of Object.keys(DOMAIN_CONFIGS)) {
        if (hostname === domain || hostname.endsWith("." + domain)) {
            return domain;
        }
    }
    // Default to ibraabot for localhost/dev
    return "ibraabot.online";
}

export function DomainProvider({ children }) {
    const domain = detectDomain();
    const config = DOMAIN_CONFIGS[domain] ?? DOMAIN_CONFIGS["ibraabot.online"];

    // Apply domain CSS vars on mount
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty("--accent", config.accentColor);
        root.style.setProperty("--accent-hover", config.accentHover);
        root.style.setProperty("--accent-soft", config.accentSoft);
        root.style.setProperty("--accent-glow", config.accentGlow);
        root.style.setProperty("--gold", config.goldColor);
        root.style.setProperty("--gold-soft", config.goldSoft);
        root.style.setProperty("--glow", `0 0 20px ${config.accentGlow}`);
        root.setAttribute("data-domain", config.key);

        // Update Document Title
        document.title = config.name;

        // Update Favicon
        if (config.logo) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = config.logo;
        }
    }, [config]);

    return (
        <DomainContext.Provider value={{ domain, config }}>
            {children}
        </DomainContext.Provider>
    );
}

export function useDomain() {
    const ctx = useContext(DomainContext);
    if (!ctx) throw new Error("useDomain must be inside DomainProvider");
    return ctx;
}
