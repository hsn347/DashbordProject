import { useMutation } from "@tanstack/react-query";

import { useNavigate } from "react-router-dom";
import { supabase111 } from "../lib/supabaseq";

export function useAuth() {
  const navigate = useNavigate();

  // تسجيل دخول
  const login = useMutation({
    mutationFn: async ({ email, password, keepLoggedIn = true }) => {
      // Set session persistence based on keepLoggedIn flag
      // 'local' = persistent (survives browser restart)
      // 'session' = temporary (cleared when browser closes)
      const persistSession = keepLoggedIn ? 'local' : 'session';

      const { data, error } = await supabase111.auth.signInWithPassword({
        email,
        password,
        options: {
          persistSession: persistSession === 'local'
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => navigate("/"), // التوجه للداشبورد بعد النجاح
  });

  // إنشاء حساب
  const signup = useMutation({
    mutationFn: async ({ email, password, name }) => {
      // 1. إنشاء المستخدم في Auth
      const { data, error } = await supabase111.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      if (data?.user) {
        // 2. إنشاء أو تحديث ملف التعريف في جدول profiles
        // استخدام upsert لتجنب خطأ 409 Conflict في حالة وجود profile مسبقاً
        const { error: profileError } = await supabase111
          .from("profiles")
          .upsert({
            id: data.user.id,
            full_name: name,
          }, {
            onConflict: 'id'
          });

        if (profileError) throw profileError;
      }

      return data;
    },
    onSuccess: () => navigate("/"),
  });

  return { login, signup };
}
