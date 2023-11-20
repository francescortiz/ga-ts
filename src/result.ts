import { None, Option, Some } from "./option";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export type MapFn<A, B> = (a: A) => B;
export type AsyncMapFn<A, B> = (a: A) => Promise<B>;
export type FlatMapFnOrTask<T, E, T2, E2> = (
    value: T,
) => Result<T2, E | E2> | Promise<Result<T2, E | E2>> | AsyncResult<T2, E | E2>;

type BaseResult<T, E> = {
    ok: boolean;
    value: T;
    error: E;
    map<R>(f: MapFn<T, R>): R extends Promise<infer R2> ? AsyncResult<R2, E> : Result<R, E>;
    mapError<R>(f: MapFn<E, R>): R extends Promise<infer R2> ? AsyncResult<T, R2> : Result<T, R>;
    flatMap<T2, E2, Q extends FlatMapFnOrTask<T, E, T2, E2>>(
        f: Q,
    ): ReturnType<Q> extends Promise<Result<infer T3, infer E3>>
        ? AsyncResult<T3, E3>
        : ReturnType<Q> extends AsyncResult<T2, E2>
        ? AsyncResult<T2, E2>
        : Result<T2, E2>;
    attemptMap<R>(
        f: MapFn<T, R>,
    ): R extends Promise<infer R2> ? AsyncResult<R2, E | unknown> : Result<R, E | unknown>;
};

export type Result<T, E> = BaseResult<T, E>;

export type AsyncResult<T, E> = {
    value: Promise<Option<T>>;
    error: Promise<Option<E>>;
    map<R>(f: MapFn<T, R>): R extends Promise<infer R2> ? AsyncResult<R2, E> : AsyncResult<R, E>;
    mapError<R>(
        f: MapFn<E, R>,
    ): R extends Promise<infer R2> ? AsyncResult<T, R2> : AsyncResult<T, R>;
    flatMap<T2, E2>(f: FlatMapFnOrTask<T, E, T2, E2>): AsyncResult<T2, E2>;
    attemptMap<R>(
        f: MapFn<T, R>,
    ): R extends Promise<infer R2> ? AsyncResult<R2, E | unknown> : AsyncResult<R, E | unknown>;
} & Omit<BaseResult<T, E>, "value" | "error" | "map" | "mapError" | "flatMap"> &
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

const promiseOfResultToAsyncResult = <T, E>(promise: Promise<Result<T, E>>): AsyncResult<T, E> => {
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
        <T2, E2>(f: FlatMapFnOrTask<T, E, T2, E2>): AsyncResult<T2, E | E2> => {
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

export const Ok = <T>(value: T): Result<T, never> => ({
    ok: true,
    value,
    error: undefined as never,
    map<R>(
        f: MapFn<T, R>,
    ): R extends Promise<infer R2> ? AsyncResult<R2, never> : Result<R, never> {
        const newValue = f(value);

        return (
            newValue instanceof Promise //
                ? AsyncOk(newValue)
                : Ok(newValue)
        ) as Any;
    },
    mapError: () => Ok(value) as Any,
    flatMap(f) {
        const result = f(value);
        return (result instanceof Promise ? promiseOfResultToAsyncResult(result) : result) as Any;
    },
    attemptMap(f) {
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

export const Err = <E>(error: E): Result<never, E> => ({
    ok: false,
    value: undefined as never,
    error,
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
