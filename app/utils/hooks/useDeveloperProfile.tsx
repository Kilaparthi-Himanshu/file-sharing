import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { DeveloperProfileType } from "@/types/supabase_database.types";

export function useDeveloperProfile(userId?: string) {
    return useQuery<DeveloperProfileType | null>({
        queryKey: ['developer_profile', userId],
        queryFn: async () => {
            if (!userId) return null;

            const { data, error } = await supabase
                .from('developer_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) throw error;

            return data;
        },
        enabled: !!userId, // only fetch if signed in
        staleTime: 1000 * 60 * 10, // 10 minutes cache
    });
}
