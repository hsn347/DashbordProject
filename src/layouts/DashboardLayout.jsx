import { Outlet } from "react-router-dom";
import Header from "../components/Header";

export default function DashboardLayout() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Header isAdmin={false} />
      <main
        className="main-content"
        style={{
          transition: "all 0.3s ease",
          minHeight: "100vh",
          padding: "calc(60px + 1.5rem) 1.5rem 2rem",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
