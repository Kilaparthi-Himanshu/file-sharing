export type DeveloperProfileType = {
    user_id: string;
    created_at: string;
    email: string;
    full_name: string;
    username: string;
    subscription_status: string;
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