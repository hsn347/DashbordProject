import { useQuery } from "@tanstack/react-query";
import { supabase111 } from "../lib/supabaseq";


export function useStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // هجمات متزامنة لجلب عدد الصفوف
      const [all, active] = await Promise.all([
        supabase111.from("users").select("*", { count: 'exact', head: true }),
        supabase.from("users").select("*", { count: 'exact', head: true }).eq("status", "active")
      ]);
      
      return {
        totalUsers: all.count || 0,
        activeUsers: active.count || 0,
        pendingUsers: (all.count - active.count) || 0,
      };
    }
  });
}