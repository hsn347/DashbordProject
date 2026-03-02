import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase111 } from "../lib/supabaseq";

export const useManageProfile = () => {
    const queryClient = useQueryClient();

    // Create or Update Profile (Upsert)
    // Note: 'id' is required and must match auth.users.id
    return useMutation({
        mutationFn: async ({ id, profileData }) => {
            const { data, error } = await supabase111
                .from("profiles")
                .upsert({ id, ...profileData })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["profiles"]);
        },
    });
};
