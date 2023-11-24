export const crash = <T>(e: unknown | string): T => {
    if (e instanceof Error) {
        throw e;
    }
    throw new Error(String(e));
};
