import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

const fetchProfile = async (userId) => {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    // If no profile found (error code PGRST116), returns null data often or error.
    // We handle it gracefully to allow UI to show "setup profile" or similar if needed,
    // though user restriction "no create" implies we expect one or just show empty form to edit.

    if (error) {
        // Ignore "row not found" error if we want to handle it in UI as "no profile data yet"
        if (error.code === 'PGRST116') return null;
        throw new Error(error.message);
    }
    return data;
};

export const useProfile = (userId) => {
    return useQuery({
        queryKey: ["profile", userId],
        queryFn: () => fetchProfile(userId),
        enabled: !!userId, // Only fetch if userId is present
    });
};
