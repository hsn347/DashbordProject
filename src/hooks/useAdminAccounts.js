import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseAdmin } from "../lib/supabase";
import { toast } from "sonner";

export function useGetAllAccounts() {
    return useQuery({
        queryKey: ["admin-accounts"],
        queryFn: async () => {
            const { data: accounts, error: accErr } = await supabaseAdmin
                .from("Accounts")
                .select("*")
                .order("id", { ascending: true });
            if (accErr) throw accErr;

            let userMap = {};
            let profilesMap = {};
            try {
                const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
                userMap = Object.fromEntries(
                    (users || []).map(u => [
                        u.id,
                        u.user_metadata?.display_name || u.email || u.id.slice(0, 8)
                    ])
                );

                const { data: profiles } = await supabaseAdmin.from("profiles").select("id, allowed_accounts, Is_COMP");
                profilesMap = Object.fromEntries(
                    (profiles || []).map(p => [p.id, { quota: p.allowed_accounts || 0, isComp: !!p.Is_COMP }])
                );

            } catch (_) { /* gracefully handle if admin access error */ }

            return (accounts || []).map((acc) => {
                const prof = profilesMap[acc.user_id] || { quota: 0, isComp: false };
                return {
                    ...acc,
                    ownerName: userMap[acc.user_id] ?? acc.user_id?.slice(0, 8) ?? "—",
                    allowedAccounts: prof.quota,
                    userApproved: prof.isComp,
                };
            });
        },
    });
}

async function callReindex() {
    try {
        const { error } = await supabaseAdmin.rpc("reindex_accounts_v2");
        if (error) console.warn("reindex_accounts_v2 error:", error);
    } catch (err) {
        console.warn("Failed to call indexer", err);
    }
}

async function callAutoApproveUser(userId) {
    try {
        const { error } = await supabaseAdmin.rpc("auto_approve_user_accounts", {
            p_user_id: String(userId)
        });
        if (error) {
            console.error("DEBUG: auto_approve_user_accounts error:", error);
            throw error;
        }
    } catch (err) {
        console.error("DEBUG: Failed to auto approve user:", userId, err);
        throw err;
    }
}

export function useApproveAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabaseAdmin
                .from("Accounts")
                .update({ Is_OK: true, Date_OK: new Date().toISOString().split("T")[0] })
                .eq("id", id);
            if (error) throw error;
            await callReindex();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
            toast.success("تم اعتماد الحساب وتعيين الفهارس.");
        },
        onError: (err) => toast.error(err.message || "فشل الاعتماد"),
    });
}

export function useRevokeAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabaseAdmin
                .from("Accounts")
                .update({ Is_OK: false, index_server: null, Date_OK: new Date().toISOString().split("T")[0] })
                .eq("id", id);
            if (error) throw error;
            await callReindex();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
            toast.success("تم إلغاء اعتماد الحساب وإعادة الفهرسة.");
        },
        onError: (err) => toast.error(err.message || "فشل الإلغاء"),
    });
}

export function useDeleteAccountAdmin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { data: user_id_A } = await supabaseAdmin.from("Accounts").select("user_id").eq("id", id).single();
            const { data: Is_COMP1, error: error1 } = await supabaseAdmin
                .from("profiles")
                .select("Is_COMP")
                .eq("id", user_id_A)
                .single();

            const { error } = await supabaseAdmin.from("Accounts").delete().eq("id", id);
            if (error) throw error;
            if (Is_COMP1 == true) {
                if (data?.user_id) await callAutoApproveUser(data.user_id);
                else await callReindex();
            }

        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
            toast.success("تم حذف الحساب وإعادة ترقيم الباقي.");
        },
        onError: (err) => toast.error(err.message || "فشل الحذف"),
    });
}

/* quota */
export function useUpdateUserAllowedAccounts() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, allowedAccounts }) => {
            const { error } = await supabaseAdmin
                .from("profiles")
                .update({ allowed_accounts: parseInt(allowedAccounts || 0) })
                .eq("id", userId);

            const { data: Is_COMP2, error: error2 } = await supabaseAdmin
                .from("profiles")
                .select("Is_COMP")
                .eq("id", userId)
                .single();

            if (error) throw error;

            if (Is_COMP2.Is_COMP == true) {
                await callAutoApproveUser(userId);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
            toast.success("تم تحديث الكوتا بنجاح، وجاري تطبيق الاعتماد التلقائي.");
        },
        onError: (err) => toast.error(err.message || "فشل التحديث"),
    });
}

export function useUpdateUserExpiryDate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, dateExpire }) => {
            const { error } = await supabaseAdmin
                .from("profiles")
                .update({ Date_expier: dateExpire || null })
                .eq("id", userId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users-profiles"] });
            toast.success("تم تحديث تاريخ انتهاء الاشتراك بنجاح.");
        },
        onError: (err) => toast.error(err.message || "فشل تحديث تاريخ الانتهاء"),
    });
}



/* حاليا لم يستخدم */
export function useForceAutoApprove() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId) => {
            console.log("DEBUG: Invoking useForceAutoApprove with userId:", userId);
            const { error } = await supabaseAdmin.rpc("auto_approve_user_accounts", {
                p_user_id: String(userId)
            });
            if (error) {
                console.error("DEBUG: useForceAutoApprove RPC error:", error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
            toast.success("تم إجراء الاعتماد التلقائي وإعادة الهيكلة لهذا المستخدم.");
        },
        onError: (err) => {
            console.error("DEBUG: useForceAutoApprove mutation error:", err);
            toast.error(`فشل تزامن الكوتا: ${err.message || "خطأ غير معروف"}`);
        },
    });
}

export function useForceGlobalApply() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const { error } = await supabaseAdmin.rpc("reindex_accounts_v2");
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
            toast.success("تم إعادة ترتيب الحسابات المقبولة في السيرفرات بنجاح.");
        },
        onError: (err) => toast.error("فشل في تطبيق الهيكلة الجديدة"),
    });
}

export function useGetAllAdminUsers() {
    return useQuery({
        queryKey: ["admin-users-profiles"],
        queryFn: async () => {
            let users = [];
            let profilesMap = {};

            try {
                // Fetch Auth Users
                const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
                if (authErr) throw authErr;
                users = authData.users || [];

                // Fetch Profiles (for allowed_accounts)
                const { data: profiles, error: profErr } = await supabaseAdmin
                    .from("profiles")
                    .select("id, allowed_accounts, Is_COMP, Date_expier, Date_OK");
                if (profErr) throw profErr;

                profilesMap = Object.fromEntries(
                    (profiles || []).map(p => [p.id, {
                        quota: p.allowed_accounts || 0,
                        isComp: !!p.Is_COMP,
                        dateExpire: p.Date_expier,
                        dateOk: p.Date_OK
                    }])
                );
            } catch (err) {
                console.error("Error fetching admin users:", err);
                throw err;
            }

            // Map into standardized array
            return users.map(u => ({
                id: u.id,
                email: u.email,
                displayName: u.user_metadata?.display_name || u.email || u.id.slice(0, 8),
                allowedAccounts: profilesMap[u.id] ? profilesMap[u.id].quota : 0,
                isApprovedComp: profilesMap[u.id] ? profilesMap[u.id].isComp : false,
                dateExpire: profilesMap[u.id] ? profilesMap[u.id].dateExpire : null,
                dateOkProfile: profilesMap[u.id] ? profilesMap[u.id].dateOk : null,
                createdAt: u.created_at,
            })).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        },
    });
}

export function useDeleteUserAdmin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId) => {
            // 2. Delete all accounts for this user
            const { error: accErr } = await supabaseAdmin.from("Accounts").delete().eq("user_id", userId);
            if (accErr) console.error("Delete accounts error:", accErr);

            // 3. Delete profile
            const { error: profErr } = await supabaseAdmin.from("profiles").delete().eq("id", userId);
            if (profErr) console.warn("Delete profile error (may be empty):", profErr);

            // 4. Delete the user from Auth (requires service role key)
            const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
            if (authErr) throw authErr;

            // 5. Global apply or reindex if needed? Not strictly required but good for cleanup
            await callReindex();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users-profiles"] });
            queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
            toast.success("تم حذف المستخدم وكافة حساباته بنجاح.");
        },
        onError: (err) => {
            console.error("Delete user error:", err);
            toast.error(err.message || "فشل حذف المستخدم.");
        },
    });
}


/* حق الاعتماد */
export function useUpdateAllAccountsDate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId }) => {

            // 1. Get the allowance quota for this user from profiles
            const { data: profile, error: pErr } = await supabaseAdmin
                .from("profiles")
                .select("allowed_accounts, Is_COMP ,Date_OK")
                .eq("id", userId)
                .single();
            if (pErr) throw pErr;
            const quota = profile.allowed_accounts || 0;
            let date;
            if (profile.Is_COMP == false) {
                date = new Date().toISOString().split("T")[0];
            } else {
                date = profile.Date_OK || new Date().toISOString().split("T")[0];
            }

            // Update user global status
            await supabaseAdmin
                .from("profiles")
                .update({ Is_COMP: true, Date_OK: date })
                .eq("id", userId);

            // 2. Get all accounts for this user sorted by seniority (created_at)
            const { data: accounts, error: aErr } = await supabaseAdmin
                .from("Accounts")
                .select("id")
                .eq("user_id", userId)
                .order("created_at", { ascending: true });
            if (aErr) throw aErr;

            // 3. Batch update accounts: top N get Is_OK: true, the rest Is_OK: false
            const approvedIds = accounts.slice(0, quota).map(a => a.id);
            const rejectedIds = accounts.slice(quota).map(a => a.id);

            if (approvedIds.length > 0) {
                await supabaseAdmin
                    .from("Accounts")
                    .update({ Is_OK: true, Date_OK: date })
                    .in("id", approvedIds);
            }

            if (rejectedIds.length > 0) {
                await supabaseAdmin
                    .from("Accounts")
                    .update({ Is_OK: false, Date_OK: date })
                    .in("id", rejectedIds);
            }
            await callAutoApproveUser(userId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
            queryClient.invalidateQueries({ queryKey: ["admin-users-profiles"] });
            toast.success("تم توزيع الاعتمادات بناءً على الكوتا.");
        },
        onError: (err) => toast.error(`فشل تحديث التاريخ: ${err.message}`),
    });
}

export function useCancelAllAccountsApproval() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId) => {
            const now = new Date().toISOString().split("T")[0];
            // Cancel approval for all accounts of this user, recording the cancellation date
            const { error } = await supabaseAdmin
                .from("Accounts")
                .update({
                    index_server: null,
                    Is_OK: false,
                    Date_OK: null
                })
                .eq("user_id", userId);

            if (error) throw error;

            // Reset user global status
            await supabaseAdmin
                .from("profiles")
                .update({ Is_COMP: false })
                .eq("id", userId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
            queryClient.invalidateQueries({ queryKey: ["admin-users-profiles"] });
            toast.success("تم إلغاء اعتماد كافة الحسابات.");
        },
        onError: (err) => toast.error(`فشل إلغاء الاعتماد: ${err.message}`),
    });
}
