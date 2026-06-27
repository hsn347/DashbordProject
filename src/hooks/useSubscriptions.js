import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { toast } from "sonner";
import { detectDomain } from "../Context/DomainContext";

export function useGetSubscriptions() {
    const currentDomain = detectDomain();
    return useQuery({
        queryKey: ["subscriptions", currentDomain],
        queryFn: async () => {
            const { data, error } = await supabaseAdmin
                .from("subscriptions")
                .select(`*, Accounts(id, user_id, index_server, Is_OK, Email, domain)`)
                .order("emulator_id", { ascending: true });

            if (error) {
                console.warn("تجاهل خطأ جدول الاشتراكات (الجدول غير موجود):", error);
                return [];
            }

            // Filter to current domain only
            const filtered = (data || []).filter(sub =>
                !sub.Accounts?.domain || sub.Accounts?.domain === currentDomain
            );

            return filtered.map(sub => ({
                ...sub,
                account_id: sub.emulator_id
            }));
        },
    });
}

export function useToggleSubscription() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, accountId, month, currentPaid }) => {
            const currentDomain = detectDomain();
            if (currentPaid === null || currentPaid === undefined) {
                // Fetch user_id from Accounts table
                const { data: acc, error: accErr } = await supabaseAdmin
                    .from("Accounts")
                    .select("user_id")
                    .eq("id", accountId)
                    .single();
                if (accErr) throw accErr;

                const { error } = await supabaseAdmin.from("subscriptions").insert({
                    user_id: acc.user_id,
                    emulator_id: accountId,
                    month,
                    is_paid: true,
                    paid_at: new Date().toISOString(),
                    domain: currentDomain,
                });
                if (error) throw error;
            } else if (!currentPaid) {
                const { error } = await supabaseAdmin
                    .from("subscriptions")
                    .update({ is_paid: true, paid_at: new Date().toISOString() })
                    .eq("emulator_id", accountId)
                    .eq("month", month);
                if (error) throw error;
            } else {
                const { error } = await supabaseAdmin
                    .from("subscriptions")
                    .update({ is_paid: false, paid_at: null })
                    .eq("emulator_id", accountId)
                    .eq("month", month);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
        },
        onError: (err) => toast.error(err.message || "فشل تحديث الاشتراك (تأكد من تعديل جدول الاشتراكات)"),
    });
}
