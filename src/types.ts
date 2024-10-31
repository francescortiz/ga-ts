// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Any = any;

export type MapFn<A, B> = (a: A) => B;
export type AsyncMapFn<A, B> = (a: A) => Promise<B>;
