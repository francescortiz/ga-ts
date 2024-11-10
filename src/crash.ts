export const crash = (e: unknown | string): never => {
    if (e instanceof Error) {
        throw e;
    }
    throw new Error(String(e));
};
