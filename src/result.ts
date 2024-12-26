/* eslint-disable @typescript-eslint/ban-ts-comment */
import { None, Some } from "./option";
import { Any, MapFn } from "./types";

export type FlatMapFn<T, E, T2, E2> = (
    value: T,
) => Result<T2, E | E2> | Promise<Result<T2, E | E2>>;

type MakeResultAsync<R extends Result<Any, Any>> =
    R extends Ok<infer T> ? AsyncOk<T> : R extends Err<infer E> ? AsyncErr<E> : never;

export type Ok<T> = {
    ok: true;
    value: T;
    error: never;
    map<R>(f: MapFn<T, R>): R extends Promise<infer R2> ? AsyncOk<R2> : Ok<R>;
    mapError<R>(f: MapFn<never, R>): R extends Promise<Any> ? AsyncOk<T> : Ok<T>;
    flatMap<R extends Result<Any, Any> | Promise<Result<Any, Any>>>(
        f: MapFn<T, R>,
    ): R extends Promise<infer F1>
        ? F1 extends Result<Any, Any>
            ? MakeResultAsync<F1>
            : never
        : R;
    attemptMap<R>(
        f: MapFn<T, R>,
    ): R extends Promise<infer R2> ? AsyncResult<R2, unknown> : Result<R, unknown>;
};

export type Err<E> = {
    ok: false;
    value: never;
    error: E;
    map<R>(f: MapFn<never, R>): Err<E>;
    mapError<R>(f: MapFn<E, R>): R extends Promise<infer R2> ? AsyncErr<R2> : Err<R>;
    flatMap: never;
    attemptMap<R>(f: MapFn<never, R>): Err<E>;
};

export type Result<T, E> = Ok<T> | Err<E>;

export type AsyncOk<T> = {
    value: Promise<T>;
    error: Promise<never>;
    map<R>(f: MapFn<T, R>): R extends Promise<infer R2> ? AsyncOk<R2> : AsyncOk<R>;
    mapError<R>(f: MapFn<never, R>): AsyncOk<T>;
    flatMap<R extends Result<Any, Any> | Promise<Result<Any, Any>>>(
        f: MapFn<T, R>,
    ): R extends Promise<infer F1>
        ? F1 extends Result<Any, Any>
            ? MakeResultAsync<F1>
            : never
        : R extends Result<Any, Any>
          ? MakeResultAsync<R>
          : never;
    attemptMap<R>(
        f: MapFn<T, R>,
    ): R extends Promise<infer R2> ? AsyncResult<R2, unknown> : AsyncResult<R, unknown>;
} & Promise<Ok<T>>;

export type AsyncErr<E> = {
    value: Promise<never>;
    error: Promise<E>;
    map<R>(f: MapFn<never, R>): AsyncErr<E>;
    mapError<R>(f: MapFn<E, R>): R extends Promise<infer R2> ? AsyncErr<R2> : AsyncErr<R>;
    flatMap: never;
    attemptMap<R>(f: MapFn<never, R>): AsyncErr<E>;
} & Promise<Err<E>>;

export type AsyncResult<T, E> = AsyncOk<T> | AsyncErr<E>;

export const promiseOfResultToAsyncResult = <T, E>(
    promise: Promise<Result<T, E>>,
): AsyncResult<T, E> => {
    if (!("ok" in promise))
        void Object.defineProperty(promise, "ok", {
            get: () => promise.then((resolved) => resolved.ok),
        });

    if (!("value" in promise))
        void Object.defineProperty(promise, "value", {
            get: () => promise.then((resolved) => (resolved.ok ? Some(resolved.value) : None)),
        });

    if (!("error" in promise))
        void Object.defineProperty(promise, "error", {
            get: () => promise.then((resolved) => (!resolved.ok ? Some(resolved.error) : None)),
        });

    // @ts-ignore
    promise.map = // Constrain the @ts-ignore to the bare minimum with this comment.
        <R>(f: MapFn<T, R>): AsyncResult<R, E> => {
            const mapped = promise.then((resolved) => {
                const mapped = resolved.map(f as Any);
                return Promise.resolve(mapped);
            });
            return promiseOfResultToAsyncResult(mapped as Any);
        };

    // @ts-ignore
    promise.mapError = // Constrain the @ts-ignore to the bare minimum with this comment.
        <R>(f: MapFn<E, R>): AsyncResult<T, R> => {
            const mapped = promise.then((resolved) => {
                return resolved.mapError(f as Any);
            });

            return promiseOfResultToAsyncResult(mapped as Any);
        };

    // @ts-ignore
    promise.flatMap = // Constrain the @ts-ignore to the bare minimum with this comment.
        <F extends FlatMapFn<T, unknown, Any, Any>>(f: F): Any => {
            const mapped = promise.then((resolved) => {
                const chained = resolved.flatMap(f as Any);
                return Promise.resolve(chained) as Any;
            });
            return promiseOfResultToAsyncResult(mapped as Any);
        };

    // @ts-ignore
    promise.attemptMap = // Constrain the @ts-ignore to the bare minimum with this comment.
        <R>(f: MapFn<T, R>): AsyncResult<R, E | unknown> => {
            const mapped = promise.then((resolved) => {
                const mapped = resolved.attemptMap(f as Any);
                return Promise.resolve(mapped);
            });
            return promiseOfResultToAsyncResult(mapped as Any);
        };

    return promise as AsyncResult<T, E>;
};

export const Ok = <T>(value: T): Ok<T> => {
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
    return result as Ok<T>;
};

export const Err = <E>(error: E): Err<E> => {
    const err = {
        ok: false as const,
        value: undefined as never,
        error,
    };

    // We don't want functions to be members of the Err instance.
    Object.setPrototypeOf(err, {
        map: () => Err(error),
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        mapError: <R>(f: MapFn<E, R>) => {
            const newValue = f(error);

            const err =
                newValue instanceof Promise //
                    ? AsyncErr(newValue)
                    : Err(newValue);
            err.mapError = (): Any => err;
            return err as Any;
        },
        flatMap: () => Err(error) as Any,
        attemptMap: () => Err(error) as Any,
    });

    return err as Err<E>;
};

export const AsyncOk = <T>(value: T | Promise<T>): AsyncOk<T> => {
    const resultPromise = Promise.resolve(value).then((resolvedValue) => {
        const result: Result<T, never> = Ok(resolvedValue);
        return result;
    });

    return promiseOfResultToAsyncResult(resultPromise) as AsyncOk<T>;
};

export const AsyncErr = <E>(error: E | Promise<E>): AsyncErr<E> => {
    const resultPromise = Promise.resolve(error).then((resolvedError) => {
        const result: Result<never, E> = Err(resolvedError);
        return result;
    });

    return promiseOfResultToAsyncResult(resultPromise) as AsyncErr<E>;
};
