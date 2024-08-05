import { None, Option, Some } from "./option";
import { Any, AsyncMapFn, MapFn } from "./types";
import { Task } from "./task";

export type FlatMapFn<T, E, T2, E2> = (
    value: T,
) => Result<T2, E | E2> | Promise<Result<T2, E | E2>>;

export type Result<T, E> = {
    ok: boolean;
    value: T;
    error: E;
    map<R>(f: MapFn<T, R>): R extends Promise<infer R2> ? AsyncResult<R2, E> : Result<R, E>;
    mapError<R>(f: MapFn<E, R>): R extends Promise<infer R2> ? AsyncResult<T, R2> : Result<T, R>;
    flatMap<T2, E2>(f: FlatMapFn<T, E, T2, E2>): AsyncResult<T2, E2>;
    flatMap<Q extends FlatMapFn<T, E, Any, Any> | Task<T, E, Any>>(f: Q): ReturnType<Q>;
    attemptMap<R>(
        f: MapFn<T, R>,
    ): R extends Promise<infer R2> ? AsyncResult<R2, E | unknown> : Result<R, E | unknown>;
};

export type AsyncResult<T, E> = {
    value: Promise<Option<T>>;
    error: Promise<Option<E>>;
    map<R>(f: MapFn<T, R>): R extends Promise<infer R2> ? AsyncResult<R2, E> : AsyncResult<R, E>;
    mapError<R>(
        f: MapFn<E, R>,
    ): R extends Promise<infer R2> ? AsyncResult<T, R2> : AsyncResult<T, R>;
    flatMap<T2, E2>(f: FlatMapFn<T, E, T2, E2>): AsyncResult<T2, E2>;
    attemptMap<R>(
        f: MapFn<T, R>,
    ): R extends Promise<infer R2> ? AsyncResult<R2, E | unknown> : AsyncResult<R, E | unknown>;
} & Omit<Result<T, E>, "value" | "error" | "map" | "mapError" | "flatMap"> &
    Promise<Result<T, E>>;

export type Ok<T> = {
    ok: true;
    value: T;
} & Omit<Result<T, never>, "value">;

export type Err<E> = {
    ok: false;
    error: E;
} & Omit<Result<never, E>, "error">;

export type AsyncOk<T> = {
    ok: true;
    value: Promise<Option<T>>;
} & Omit<AsyncResult<T, never>, "value">;

export type AsyncErr<E> = {
    ok: false;
    error: Promise<Option<E>>;
} & Omit<AsyncResult<never, E>, "error">;

export const promiseOfResultToAsyncResult = <T, E>(
    promise: Promise<Result<T, E>>,
): AsyncResult<T, E> => {
    // @ts-ignore
    promise.ok = // Constrain the @ts-ignore to the bare minimum with this comment.
        promise.then((resolved) => resolved.ok);

    // @ts-ignore
    promise.value = // Constrain the @ts-ignore to the bare minimum with this comment.
        promise.then((resolved) => (resolved.ok ? Some(resolved.value) : None));

    // @ts-ignore
    promise.error = // Constrain the @ts-ignore to the bare minimum with this comment.
        promise.then((resolved) => (!resolved.ok ? Some(resolved.error) : None));

    // @ts-ignore
    promise.map = // Constrain the @ts-ignore to the bare minimum with this comment.
        <R>(f: MapFn<T, R>): AsyncResult<R, E> => {
            const mapped = promise.then((resolved) => {
                const mapped = resolved.map(f);
                return Promise.resolve(mapped);
            });
            return promiseOfResultToAsyncResult(mapped) as AsyncResult<R, E>;
        };

    // @ts-ignore
    promise.mapError = // Constrain the @ts-ignore to the bare minimum with this comment.
        <R>(f: MapFn<E, R>): AsyncResult<T, R> => {
            const mapped = promise.then((resolved) => {
                return resolved.mapError(f);
            });
            // @ts-ignore
            return promiseOfResultToAsyncResult(mapped) as AsyncResult<T, R>;
        };

    // @ts-ignore
    promise.flatMap = // Constrain the @ts-ignore to the bare minimum with this comment.
        <T2, E2>(f: FlatMapFn<T, E, T2, E2>): AsyncResult<T2, E | E2> => {
            const mapped = promise.then((resolved) => {
                const chained = resolved.flatMap(f);
                return promiseOfResultToAsyncResult(Promise.resolve(chained));
            });
            return promiseOfResultToAsyncResult(mapped);
        };

    // @ts-ignore
    promise.attemptMap = // Constrain the @ts-ignore to the bare minimum with this comment.
        <R>(f: MapFn<T, R>): AsyncResult<R, E | unknown> => {
            const mapped = promise.then((resolved) => {
                const mapped = resolved.attemptMap(f);
                return Promise.resolve(mapped);
            });
            return promiseOfResultToAsyncResult(mapped) as AsyncResult<R, E | unknown>;
        };

    return promise as AsyncResult<T, E>;
};

export const Ok = <T>(value: T): Result<T, never> => {
    const result = {
        ok: true,
        value,
        error: undefined as never,
    };

    // We don't want functions to be members of the Ok instance.
    Object.setPrototypeOf(result, {
        map: <R>(
            f: MapFn<T, R>,
        ): R extends Promise<infer R2> ? AsyncResult<R2, never> : Result<R, never> => {
            const newValue = f(value);

            return (
                newValue instanceof Promise //
                    ? AsyncOk(newValue)
                    : Ok(newValue)
            ) as Any;
        },
        mapError: <R>(): T extends Promise<infer R2> ? AsyncResult<T, R2> : Result<T, R> =>
            Ok(value) as Any,
        flatMap<T2, E2>(f: FlatMapFn<T, never, T2, E2>): Any {
            const result = f(value);
            return (
                result instanceof Promise ? promiseOfResultToAsyncResult(result) : result
            ) as Any;
        },
        attemptMap<E2>(f: MapFn<T, E2>): Any {
            try {
                const newValue = f(value);

                return (
                    newValue instanceof Promise //
                        ? promiseOfResultToAsyncResult(
                              newValue.then((resolved) => Ok(resolved)).catch((e) => Err(e)),
                          )
                        : Ok(newValue)
                ) as Any;
            } catch (e) {
                return Err(e) as Any;
            }
        },
    });
    return result as Result<T, never>;
};

export const Err = <E>(error: E): Result<never, E> => {
    const err = {
        ok: false,
        value: undefined as never,
        error,
    };

    // We don't want functions to be members of the Err instance.
    Object.setPrototypeOf(err, {
        map: () => Err(error) as Any,
        mapError: <R>(f: MapFn<E, R> | AsyncMapFn<E, R>): Any => {
            const newValue = f(error);

            const err =
                newValue instanceof Promise //
                    ? AsyncErr(newValue)
                    : Err(newValue);
            err.mapError = (): Any => err;
            return err;
        },
        flatMap: () => Err(error) as Any,
        attemptMap: () => Err(error) as Any,
    });

    return err as Result<never, E>;
};

export const AsyncOk = <T>(value: T | Promise<T>): AsyncResult<T, never> => {
    const resultPromise = Promise.resolve(value).then((resolvedValue) => {
        const result: Result<T, never> = Ok(resolvedValue);
        return result;
    });

    return promiseOfResultToAsyncResult(resultPromise) as AsyncOk<T>;
};

export const AsyncErr = <E>(error: E | Promise<E>): AsyncResult<never, E> => {
    const resultPromise = Promise.resolve(error).then((resolvedError) => {
        const result: Result<never, E> = Err(resolvedError);
        return result;
    });

    return promiseOfResultToAsyncResult(resultPromise) as AsyncErr<E>;
};
