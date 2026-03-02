import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase111 } from "../lib/supabaseq";


const ProtectedRoute = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. فحص الجلسة عند التحميل
    supabase111.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. الاستماع لأي تغيير في حالة تسجيل الدخول (Logout/Login)
    const { data: { subscription } } = supabase111.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div>جاري التحقق...</div>;

  return session ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;