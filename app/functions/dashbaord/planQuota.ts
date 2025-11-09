// GET QUOTA PER PLAN
export function getQuota(plan: string): number {
    switch(plan) {
        case "pro":
            return 10000;
        case "starter":
            return 1000;
        default:
            return 100; // free
    }
}