import { Any, MapFn } from "./types";
import { AsyncResult, Err, Ok, promiseOfResultToAsyncResult, Result } from "./result";

export type Task<T, E, R> = (
    v: T,
) => R extends Promise<infer R2> ? AsyncResult<R2, E> : Result<R, E>;

export const Task = <Params, Error, OutputType>(
    f: MapFn<Params, OutputType>,
    errorHandler: MapFn<unknown, Error>,
): Task<Params, Error, OutputType> => {
    return (value: Params) => {
        try {
            const newValue = f(value);

            return newValue instanceof Promise //
                ? promiseOfResultToAsyncResult(
                      newValue.then((resolved) => Ok(resolved)).catch((e) => Err(errorHandler(e))),
                  )
                : (Ok(newValue) as Any);
        } catch (e) {
            return Err(errorHandler(e));
        }
    };
};
