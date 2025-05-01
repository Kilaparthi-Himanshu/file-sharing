export function assertNotNull<T>(value: T | null | undefined, message = 'Expected defined value') {
    if (value == null) {
        throw new Error(message);
    } // checks both null and undefined
    return value;
}