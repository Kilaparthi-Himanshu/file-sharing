import { getQuota } from "@/app/functions/dashbaord/planQuota";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ApiKeyDataType, ApiUsageDataType } from "@/types/supabase_database.types";

function formatToLocalTime(timestamp: string | null) {
    if (!timestamp) return "—";

    const date = new Date(timestamp);
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

export function ApiUsageTable({ 
    plan,
    apiKeyData, 
    apiUsageData 
}: { 
    plan?: string;
    apiKeyData?: ApiKeyDataType;
    apiUsageData?: ApiUsageDataType;
}) {
    const totalUsage = apiUsageData?.reduce(
        (sum, usage) => sum + (usage.usage_count || 0), 0
    ) ?? 0;
    const quota = getQuota(plan ?? 'free');

    return (
        <Table>
            <TableCaption>API Usage Metrics per day.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="font-semibold text-white">
                            Date
                        </TableHead>

                        <TableHead className="font-semibold text-white">
                            First Used
                        </TableHead>

                        <TableHead className="font-semibold text-white">
                            Last Used
                        </TableHead>

                        <TableHead className="font-semibold text-white">
                            Usage Count
                        </TableHead>
                    </TableRow>
                </TableHeader>
            <TableBody>
                {apiUsageData?.map((usage) => (
                    <TableRow key={`${usage.user_id}_${usage.date}`}>
                        <TableCell className="font-medium text-neutral-300">
                            {usage.date}
                        </TableCell>

                        <TableCell className="text-neutral-300">
                            {formatToLocalTime(usage.first_used)}
                        </TableCell>

                        <TableCell className="text-neutral-300">
                            {formatToLocalTime(usage.last_used)}
                        </TableCell>

                        <TableCell className={`text-green-400 ${usage.usage_count >= quota && 'text-red-400'}`}>
                            {usage.usage_count}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <TableFooter>
                <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-blue-400 font-semibold">{totalUsage}</TableCell>
                </TableRow>
            </TableFooter>
        </Table>
    )
}
