import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { toast } from "sonner";

export function useGetSubscriptions() {
    return useQuery({
        queryKey: ["subscriptions"],
        queryFn: async () => {
            const { data, error } = await supabaseAdmin
                .from("subscriptions")
                .select(`*, Accounts(id, user_id, index_server, Is_OK, Email)`)
                .order("account_id", { ascending: true });

            if (error) {
                console.error("Subscription query error (did you rename emulator_id to account_id in subscriptions table?):", error);
                throw error;
            }
            return data;
        },
    });
}

export function useToggleSubscription() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, accountId, month, currentPaid }) => {
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
                    account_id: accountId,
                    month,
                    is_paid: true,
                    paid_at: new Date().toISOString(),
                });
                if (error) throw error;
            } else if (!currentPaid) {
                // Update to paid
                const { error } = await supabaseAdmin
                    .from("subscriptions")
                    .update({ is_paid: true, paid_at: new Date().toISOString() })
                    .eq("account_id", accountId)
                    .eq("month", month);
                if (error) throw error;
            } else {
                // Toggle back to unpaid
                const { error } = await supabaseAdmin
                    .from("subscriptions")
                    .update({ is_paid: false, paid_at: null })
                    .eq("account_id", accountId)
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
