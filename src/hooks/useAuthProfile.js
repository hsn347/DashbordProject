import { useQuery } from "@tanstack/react-query";
import { supabase111 } from "../lib/supabaseq";

/**
 * Hook to get the profile of the currently authenticated user.
 */
export function useAuthProfile() {
    return useQuery({
        queryKey: ["auth-profile"],
        queryFn: async () => {
            // 1. Get current user
            const { data: { user }, error: userError } = await supabase111.auth.getUser();
            if (userError || !user) return null;

            // 2. Get profile for this user
            const { data, error } = await supabase111
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // No profile found
                throw error;
            }

            return data;
        },
    });
}
