import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { toast } from "sonner";

// Fetch all emulators with account counts (admin view)
export function useGetAllEmulators() {
    return useQuery({
        queryKey: ["admin-emulators"],
        queryFn: async () => {
            // Step 1: fetch all emulators
            const { data: emulators, error: emErr } = await supabaseAdmin
                .from("Emulators")
                .select("*")
                .order("id", { ascending: true });
            if (emErr) throw emErr;

            // Step 2: fetch all accounts
            const { data: accounts, error: accErr } = await supabaseAdmin
                .from("Accounts")
                .select("*");
            if (accErr) throw accErr;

            // Step 3: fetch user display names from Auth
            let userMap = {};
            try {
                const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
                userMap = Object.fromEntries(
                    (users || []).map(u => [
                        u.id,
                        u.user_metadata?.display_name || u.email || u.id.slice(0, 8)
                    ])
                );
            } catch (_) { /* silently ignore if no admin access */ }

            // Step 4: merge
            return (emulators || []).map((em) => ({
                ...em,
                ownerName: userMap[em.user_id] ?? em.user_id?.slice(0, 8) ?? "—",
                Accounts: (accounts || []).filter((acc) => Number(acc.Id_Emulators) === em.id),
            }));
        },
    });
}

// Helper: get server limits from settings
async function getServerLimits() {
    const { data } = await supabaseAdmin
        .from("admin_settings")
        .select("key, value")
        .in("key", ["max_per_server", "server_limits", "total_servers"]);

    const map = Object.fromEntries((data || []).map(r => [r.key, r.value]));
    const defaultMax = parseInt(map.max_per_server || "8", 10);
    const totalServers = parseInt(map.total_servers || "3", 10);

    // Parse per-server limits JSON, fill missing servers with defaultMax
    let perServer = {};
    try { perServer = JSON.parse(map.server_limits || "{}"); } catch (_) { }

    const limits = {};
    for (let i = 1; i <= totalServers; i++) {
        limits[String(i)] = parseInt(perServer[String(i)] || defaultMax, 10);
    }
    return { limits, defaultMax, totalServers };
}

// Helper: call the reindex RPC (v2) with per-server limits
async function callReindex() {
    const { limits } = await getServerLimits();
    // Convert to JSONB-compatible object with string keys
    const jsonbLimits = Object.fromEntries(
        Object.entries(limits).map(([k, v]) => [k, Number(v)])
    );
    const { error } = await supabaseAdmin.rpc("reindex_emulators_v2", {
        p_server_limits: jsonbLimits,
    });
    if (error) throw error;
}

export function useApproveEmulator() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabaseAdmin
                .from("Emulators")
                .update({ Is_OK: "true", Date_OK: new Date().toISOString() })
                .eq("id", id);
            if (error) throw error;
            await callReindex();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-emulators"] });
            toast.success("تم اعتماد المحاكي وتعيين الفهارس.");
        },
        onError: (err) => toast.error(err.message || "فشل الاعتماد"),
    });
}

export function useRevokeEmulator() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabaseAdmin
                .from("Emulators")
                .update({ Is_OK: "false", index_server: null, index_emulators: null, Date_OK: new Date().toISOString() })
                .eq("id", id);
            if (error) throw error;
            await callReindex();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-emulators"] });
            toast.success("تم إلغاء اعتماد المحاكي وإعادة الفهرسة.");
        },
        onError: (err) => toast.error(err.message || "فشل الإلغاء"),
    });
}

export function useDeleteEmulatorAdmin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabaseAdmin
                .from("Emulators")
                .delete()
                .eq("id", id);
            if (error) throw error;
            await callReindex();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-emulators"] });
            toast.success("تم حذف المحاكي وإعادة ترقيم الباقي.");
        },
        onError: (err) => toast.error(err.message || "فشل الحذف"),
    });
}
