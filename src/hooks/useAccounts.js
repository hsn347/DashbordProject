import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../Context/AuthContext";
import { toast } from "sonner";

export function useGetAccounts(emulatorId) {
    return useQuery({
        queryKey: ["accounts", emulatorId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("Accounts")
                .select("*")
                .eq("Id_Emulators", String(emulatorId))
                .order("created_at", { ascending: true });
            if (error) throw error;
            return data;
        },
        enabled: !!emulatorId,
    });
}

export function useAddAccount() {
    const { user } = useAuthContext();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ emulatorId, email, password, collect_resources, attack_resources, protection, troops, not_store }) => {
            // Check 10-account limit
            const { count, error: countErr } = await supabase
                .from("Accounts")
                .select("id", { count: "exact", head: true })
                .eq("Id_Emulators", String(emulatorId));
            if (countErr) throw countErr;
            if (count >= 10) throw new Error("الحد الأقصى هو 10 حسابات لكل محاكي.");

            const { data, error } = await supabase
                .from("Accounts")
                .insert({
                    Email: email,
                    password,
                    Collect_resources: collect_resources,
                    "Attack resources": attack_resources,
                    Protection: protection,
                    Troops: troops,
                    Not_store: not_store,
                    Is_OK: false,
                    user_id: String(user.id),
                    Id_Emulators: String(emulatorId),
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_data, vars) => {
            queryClient.invalidateQueries({ queryKey: ["accounts", vars.emulatorId] });
            toast.success("تم إضافة الحساب بنجاح.");
        },
        onError: (err) => toast.error(err.message || "فشل إضافة الحساب"),
    });
}

export function useUpdateAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, emulatorId, ...fields }) => {
            const { error } = await supabase
                .from("Accounts")
                .update({
                    Email: fields.email,
                    password: fields.password,
                    Collect_resources: fields.collect_resources,
                    "Attack resources": fields.attack_resources,
                    Protection: fields.protection,
                    Troops: fields.troops,
                    Not_store: fields.not_store,
                })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: (_data, vars) => {
            queryClient.invalidateQueries({ queryKey: ["accounts", vars.emulatorId] });
            toast.success("تم تحديث الحساب.");
        },
        onError: (err) => toast.error(err.message || "فشل التحديث"),
    });
}

export function useDeleteAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, emulatorId }) => {
            const { error } = await supabase
                .from("Accounts")
                .delete()
                .eq("id", id);
            if (error) throw error;
            return emulatorId;
        },
        onSuccess: (_data, vars) => {
            queryClient.invalidateQueries({ queryKey: ["accounts", vars.emulatorId] });
            toast.success("تم حذف الحساب.");
        },
        onError: (err) => toast.error(err.message || "فشل الحذف"),
    });
}
