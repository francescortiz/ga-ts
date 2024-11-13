/* eslint-disable @typescript-eslint/ban-ts-comment */
import { None, Some } from "./option";
import { Any, MapFn } from "./types";
import { removePromiseType } from "./utils";

export type FlatMapFn<T, E, T2, E2> = (
    value: T,
) => Result<T2, E | E2> | Promise<Result<T2, E | E2>>;

export type OkBase<T> = {
    ok: true;
    value: T;
    error: never;
    map<R>(f: MapFn<T, R>): R extends Promise<infer R2> ? AsyncOk<R2> : OkBase<R>;
    mapError<E, R>(f: MapFn<E, R>): R extends Promise<Any> ? AsyncOk<T> : OkBase<T>;
    flatMap<E, T2, E2>(
        f: FlatMapFn<T, E, T2, E2>,
    ): T2 extends Promise<Any> ? AsyncResult<T2, E2> : Result<T2, E2>;
    attemptMap<R>(
        f: MapFn<T, R>,
    ): R extends Promise<infer R2> ? AsyncResult<R2, unknown> : Result<R, unknown>;
};
export type ErrBase<E> = {
    ok: false;
    value: never;
    error: E;
    map<R>(f: MapFn<Any, R>): R extends Promise<Any> ? AsyncErr<E> : ErrBase<E>;
    mapError<R>(f: MapFn<E, R>): R extends Promise<R> ? AsyncErr<R> : ErrBase<R>;
    flatMap<R>(f: FlatMapFn<Any, E, Any, Any>): R extends Promise<Any> ? AsyncErr<E> : ErrBase<E>;
    attemptMap<R>(f: MapFn<Any, R>): R extends Promise<Any> ? AsyncErr<E> : ErrBase<E>;
};

export type Result<T, E> = OkBase<T> | ErrBase<E>;

export type Ok<T> = OkBase<T>;
export type Err<E> = ErrBase<E>;

export type AsyncOk<T> = {
    value: Promise<T>;
    error: Promise<never>;
    map<R>(f: MapFn<T, R>): R extends Promise<infer R2> ? AsyncOk<R2> : AsyncOk<R>;
    mapError<R>(f: MapFn<Any, R>): AsyncOk<T>;
    flatMap<F extends FlatMapFn<T, Any, Any, Any>>(
        f: F,
    ): F extends FlatMapFn<T, Any, infer T2, infer E2> ? AsyncResult<T2, E2> : never;
    attemptMap<R>(
        f: MapFn<T, R>,
    ): R extends Promise<infer R2> ? AsyncResult<R2, unknown> : AsyncResult<R, unknown>;
} & Promise<OkBase<T>>;

export type AsyncErr<E> = {
    value: Promise<never>;
    error: Promise<E>;
    map(f: MapFn<Any, Any>): AsyncErr<E>;
    mapError<R>(f: MapFn<E, R>): R extends Promise<infer R2> ? AsyncErr<R2> : AsyncErr<R>;
    flatMap(f: FlatMapFn<Any, E, Any, Any>): AsyncErr<E>;
    attemptMap(f: MapFn<Any, Any>): AsyncErr<E>;
} & Promise<ErrBase<E>>;

export type AsyncResult<T, E> = AsyncOk<T> | AsyncErr<E>;

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

            return promiseOfResultToAsyncResult(removePromiseType(mapped));
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
            return promiseOfResultToAsyncResult(removePromiseType(mapped));
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
        mapError: (f) => {
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
    } satisfies Err<E>);

    return err as Err<E>;
};

export const AsyncOk = <T>(value: T | Promise<T>): AsyncOk<T, never> => {
    const resultPromise = Promise.resolve(value).then((resolvedValue) => {
        const result: Result<T, never> = Ok(resolvedValue);
        return result;
    });

    return promiseOfResultToAsyncResult(resultPromise);
};

export const AsyncErr = <E>(error: E | Promise<E>): AsyncErr<never, E> => {
    const resultPromise = Promise.resolve(error).then((resolvedError) => {
        const result: Result<never, E> = Err(resolvedError);
        return result;
    });

    return promiseOfResultToAsyncResult(resultPromise) as AsyncErr<never, E>;
};
