import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase111 } from "../lib/supabaseq";

export function useAddBrand() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, brandDetails }) => {
            // 1. Get current user
            const { data: { user }, error: userError } = await supabase111.auth.getUser();
            if (userError || !user) throw new Error("يجب تسجيل الدخول أولاً");

            // 2. Get tenant_id for the user
            const { data: tenantUser, error: tenantError } = await supabase111
                .from("tenant_users")
                .select("tenant_id")
                .eq("user_id", user.id)
                .single();

            if (tenantError || !tenantUser) {
                throw new Error("لم يتم العثور على منشأة مرتبطة بهذا المستخدم.");
            }

            // 3. Prepare data
            const finalData = {
                tenant_id: tenantUser.tenant_id,
                created_by: user.id,
                details: brandDetails
            };

            if (id) finalData.id = id;

            // 4. Update or Insert into brand_info (upsert)
            const { data, error } = await supabase111
                .from("brand_info")
                .upsert([finalData])
                .select();

            if (error) {
                console.error("Supabase Insert Error:", error);
                throw error;
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["brand_info"]);
        }
    });
}
