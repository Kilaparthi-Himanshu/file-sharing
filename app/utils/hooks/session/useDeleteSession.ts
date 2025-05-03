import { useMutation } from "@tanstack/react-query";
import { createClient } from "../../supabase/client";

export const useDeleteSession = (sessionId: string) => {
    const supabase = createClient();

    return useMutation({
        mutationFn: async () => {
        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', sessionId)

            if (error) throw error;
        }
    });
}