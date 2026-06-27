import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../Context/AuthContext";
import { toast } from "sonner";
import { detectDomain } from "../Context/DomainContext";

export function useGetAccounts() {
    const { user } = useAuthContext();
    return useQuery({
        queryKey: ["accounts"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("Accounts")
                .select("*")
                .eq("user_id", String(user.id))
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });
}

export function useAddAccount() {
    const { user } = useAuthContext();

    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ email, password, collect_resources, attack_resources, protection, troops, not_store, animal }) => {
            const currentDomain = detectDomain();
            const { count, error2 } = await supabase.from("Accounts").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("Is_OK", true);
            const { data: profile, error3 } = await supabase
                .from("profiles")
                .select("allowed_accounts, Is_COMP")
                .eq("id", user.id)
                .single();

            const aaa = profile.Is_COMP == true && profile.allowed_accounts > count ? true : false;
            const bbb = profile.Is_COMP == true && profile.allowed_accounts > count ? new Date().toISOString() : null;
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
                    animal: animal,
                    Is_OK: aaa,
                    user_id: String(user.id),
                    Date_OK: bbb,
                    Id_Emulators: null,
                    domain: currentDomain,
                })
                .select()
                .single();
            if (error) throw error;

            // Trigger auto-approval logic for this user
            if (profile.Is_COMP == true && profile.allowed_accounts > count) {
                try {
                    await supabase.rpc("reindex_accounts_v2");
                } catch (_) {
                    // Silent fail - non-critical
                }
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            toast.success("تم إضافة الحساب بنجاح. وجاري فحصه تلقائياً للقبول.");
        },
        onError: (err) => toast.error(err.message || "فشل إضافة الحساب"),
    });
}

export function useUpdateAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...fields }) => {
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
                    animal: fields.animal,
                })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            toast.success("تم تحديث الحساب بنجاح.");
        },
        onError: (err) => toast.error(err.message || "فشل تحديث الحساب"),
    });
}

export function useDeleteAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id }) => {
            const { error } = await supabase
                .from("Accounts")
                .delete()
                .eq("id", id);
            if (error) throw error;

            // Re-run auto approval to potentially accept the next pending account
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user?.id) {
                try {
                    await supabase.rpc("auto_approve_user_accounts", { p_user_id: userData.user.id });
                } catch (rpcErr) {
                    console.warn("Auto-approve RPC failed:", rpcErr);
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            toast.success("تم حذف الحساب بنجاح.");
        },
        onError: (err) => toast.error(err.message || "فشل حذف الحساب"),
    });
}
