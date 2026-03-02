import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

export function useGetSettings() {
    return useQuery({
        queryKey: ["settings"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("admin_settings")
                .select("*");
            if (error) throw error;
            // Return as object { key: value }
            return Object.fromEntries(data.map((s) => [s.key, s.value]));
        },
    });
}

export function useUpdateSetting() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ key, value }) => {
            const { error } = await supabase
                .from("admin_settings")
                .upsert({ key, value: String(value) }, { onConflict: "key" });
            if (error) throw error;
        },
        onSuccess: (_, { key }) => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            toast.success("✅ تم حفظ الإعداد بنجاح.");
        },
        onError: (err) => toast.error("❌ " + (err.message || "فشل الحفظ")),
    });
}
