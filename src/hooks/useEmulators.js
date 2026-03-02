import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../Context/AuthContext";
import { toast } from "sonner";

export function useGetEmulators() {
    const { user } = useAuthContext();
    return useQuery({
        queryKey: ["emulators", user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("Emulators")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });
}

export function useAddEmulator() {
    const { user } = useAuthContext();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase
                .from("Emulators")
                .insert({ user_id: user.id, Is_OK: "false", index_server: null, index_emulators: null })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["emulators"] });
            toast.success("تم إضافة المحاكي بنجاح! في انتظار موافقة المسؤول.");
        },
        onError: (err) => toast.error(err.message || "فشل إضافة المحاكي"),
    });
}

export function useDeleteEmulator() {
    const { user } = useAuthContext();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from("Emulators")
                .delete()
                .eq("id", id)
                .eq("user_id", user.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["emulators"] });
            toast.success("تم حذف المحاكي.");
        },
        onError: (err) => toast.error(err.message || "فشل الحذف"),
    });
}
