import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../Context/AuthContext";
import { ADMIN_EMAIL } from "../Context/AuthContext";
import { Eye, EyeOff, LogIn, Shield, Sword } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../Context/LanguageContext";

const ADMIN_PASSWORD = "zxcvbnmwwee5#";

export default function Login() {
  const navigate = useNavigate();
  const { loginAsAdmin } = useAuthContext();
  const { t, dir } = useLanguage();
  const [mode, setMode] = useState("login");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        loginAsAdmin();
        return { isAdmin: true };
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.isAdmin) navigate("/admin");
      else navigate("/emulators");
    },
    onError: (err) => toast.error(err.message || t("loginError")),
  });

  const signupMutation = useMutation({
    mutationFn: async ({ email, password, name }) => {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { display_name: name } },
      });
      if (error) throw error;
      const { data: d, error: error2 } = await supabase.from("profiles").update({
        username: email,
        full_name: name
      }).eq("id", data.user.id)
      if (error2) throw error;
      return data;
    },
    onSuccess: () => { toast.success(t("signupSuccess")); setMode("login"); },
    onError: (err) => toast.error(err.message || t("signupError")),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "login") {
      loginMutation.mutate({ email: form.email, password: form.password });
    } else {
      if (!form.name.trim()) return toast.error(t("nameRequired"));
      signupMutation.mutate({ email: form.email, password: form.password, name: form.name });
    }
  };

  const isPending = loginMutation.isPending || signupMutation.isPending;

  return (
    <div dir={dir} style={{
      minHeight: "100vh", background: "var(--bg-base)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1.5rem", position: "relative", overflow: "hidden",
    }}>
      {/* Background orbs */}
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,99,255,0.18) 0%, transparent 70%)", top: "-100px", left: "-100px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)", bottom: "-80px", right: "-80px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)", top: "40%", right: "-60px", pointerEvents: "none" }} />

      <div className="animate-fade-in card-glass" style={{ width: "100%", maxWidth: 440, padding: "2.5rem" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 64, height: 64, background: "var(--accent-soft)", border: "2px solid var(--accent)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", animation: "pulse-glow 2s infinite" }}>
            <Sword size={28} color="var(--accent)" />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, background: "linear-gradient(135deg, var(--accent), var(--gold))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "0.25rem" }}>
            {t("appName")}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {mode === "login" ? t("login") : t("newAccount")}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {mode === "signup" && (
            <div>
              <label className="form-label">{t("fullName")}</label>
              <input className="form-input" type="text" placeholder={t("namePlaceholder")} value={form.name} onChange={(e) => set("name", e.target.value)} required dir={dir} />
            </div>
          )}

          <div>
            <label className="form-label">{t("email")}</label>
            <input className="form-input" type="email" placeholder="example@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} required dir="ltr" />
          </div>

          <div>
            <label className="form-label">{t("password")}</label>
            <div style={{ position: "relative" }}>
              <input className="form-input" type={showPass ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={(e) => set("password", e.target.value)} required dir="ltr" style={{ paddingRight: "2.75rem" }} />
              <button type="button" onClick={() => setShowPass((p) => !p)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isPending} style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem", marginTop: "0.25rem" }}>
            {isPending ? (
              <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: "white" }} /> {t("processing")}</>
            ) : mode === "login" ? (
              <><LogIn size={18} /> {t("login")}</>
            ) : (
              <><Shield size={18} /> {t("signup")}</>
            )}
          </button>
        </form>

        {/* Toggle mode */}
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {mode === "login" ? t("noAccount") + " " : t("hasAccount") + " "}
          </span>
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, cursor: "pointer", fontSize: "0.875rem" }}>
            {mode === "login" ? t("signup") : t("login")}
          </button>
        </div>
      </div>
    </div>
  );
}
