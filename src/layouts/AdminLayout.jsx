import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import AdminSidebar from "../components/AdminSidebar";
import { useLanguage } from "../Context/LanguageContext";

export default function AdminLayout() {
    const { t } = useLanguage();
    const isMobile = () => window.innerWidth <= 900;
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile());

    // إغلاق السايدبار تلقائياً عند تصغير الشاشة
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 900) setSidebarOpen(false);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
            <Header onMenuClick={() => setSidebarOpen((p) => !p)} isAdmin={true} />
            <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main
                className="main-content"
                style={{
                    [t("dir") === "ltr" ? "marginLeft" : "marginRight"]: sidebarOpen ? 240 : 0,
                    transition: "all 0.3s ease",
                    minHeight: "100vh",
                    padding: "calc(60px + 1.5rem) 1.5rem 2rem",
                }}
            >
                <div style={{ maxWidth: 1300, margin: "0 auto" }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
