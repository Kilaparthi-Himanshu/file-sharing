export type DeveloperProfileType = {
    user_id: string;
    created_at: string;
    email: string;
    full_name: string;
    username: string;
    plan: string;
}

export type ApiKeyDataType = {
    id: string;
    created_at: string;
    user_id: string;
    last_used: string;
    usage_count: number;
    is_active: boolean;
    api_key: string;
}

export type ApiUsageDataType = {
    date: string;
    usage_count: number;
    user_id: string;
    first_used: string;
    last_used: string;
}[]
