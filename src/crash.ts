export const crash = <T>(message: string): T => {
    throw new Error(message);
};
