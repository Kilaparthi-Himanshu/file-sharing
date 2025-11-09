import { useMemo } from "react";

export function useFormattedDate(timestamp: string | undefined) {
    return useMemo(() => {
        if (!timestamp) return null;

        const date = new Date(timestamp);
        return date.toLocaleString(undefined, {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            timeZoneName: "short",
        });
    }, [timestamp]);
}
