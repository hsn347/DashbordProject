import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { toast } from "sonner";

export function useGetSubscriptions() {
    return useQuery({
        queryKey: ["subscriptions"],
        queryFn: async () => {
            const { data, error } = await supabaseAdmin
                .from("subscriptions")
                .select(`*, Emulators(id, user_id, index_server, index_emulators, Is_OK)`)
                .order("emulator_id", { ascending: true });
            if (error) throw error;
            return data;
        },
    });
}

export function useToggleSubscription() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, emulatorId, month, currentPaid }) => {
            if (currentPaid === null || currentPaid === undefined) {
                // جلب user_id من جدول Emulators تلقائياً
                const { data: em, error: emErr } = await supabaseAdmin
                    .from("Emulators")
                    .select("user_id")
                    .eq("id", emulatorId)
                    .single();
                if (emErr) throw emErr;

                const { error } = await supabaseAdmin.from("subscriptions").insert({
                    user_id: em.user_id,
                    emulator_id: emulatorId,
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
                    .eq("emulator_id", emulatorId)
                    .eq("month", month);
                if (error) throw error;
            } else {
                // Toggle back to unpaid
                const { error } = await supabaseAdmin
                    .from("subscriptions")
                    .update({ is_paid: false, paid_at: null })
                    .eq("emulator_id", emulatorId)
                    .eq("month", month);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
        },
        onError: (err) => toast.error(err.message || "فشل تحديث الاشتراك"),
    });
}
