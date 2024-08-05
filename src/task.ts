import { Any, MapFn } from "./types";
import { AsyncResult, Ok, promiseOfResultToAsyncResult, Result } from "./result";

export type Task<T, E, R> = (
    v: T,
) => R extends Promise<infer R2> ? AsyncResult<R2, E> : Result<R, E>;

export const Task = <T, E, R>(
    f: MapFn<T, R>,
    errorHandler: MapFn<unknown, Result<never, E>>,
): Task<T, E, R> => {
    return (value: T) => {
        try {
            const newValue = f(value);

            return newValue instanceof Promise //
                ? promiseOfResultToAsyncResult(
                      newValue.then((resolved) => Ok(resolved)).catch((e) => errorHandler(e)),
                  )
                : (Ok(newValue) as Any);
        } catch (e) {
            return errorHandler(e);
        }
    };
};
