import { Any } from "./types";

type NotPromise<T> = T extends Promise<Any> ? never : T;

/*
 * This function removes the promise of a
 * use with caution.
 * It is very useful for double promises, since typescript
 * doesn't understand that Promise<Promise<Promise<T>>> === Promise<T>
 * */
export function removePromiseType<T>(value: T): NotPromise<T> {
    return value as Any;
}
