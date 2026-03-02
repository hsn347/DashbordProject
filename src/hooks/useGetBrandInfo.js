import { useQuery } from "@tanstack/react-query";
import { supabase111 } from "../lib/supabaseq";

export function useGetBrandInfo() {
    return useQuery({
        queryKey: ["brand_info"],
        queryFn: async () => {
            const { data: { user }, error: userError } = await supabase111.auth.getUser();
            if (userError || !user) throw new Error("يجب تسجيل الدخول أولاً");

            const { data, error } = await supabase111
                .from("brand_info")
                .select("*")
                .eq("created_by", user.id)
                .maybeSingle();

            if (error) throw error;
            return data;
        },
    });
}
