import { Any, MapFn } from "./types";
import { AsyncResult, Err, Ok, promiseOfResultToAsyncResult, Result } from "./result";

export type FlatMapFn<T, T2> = (value: T) => Option<T2> | Promise<Option<T2>>;

export type Option<T> = Some<T> | None;

export type AsyncOption<T> = {
    value: Promise<Option<T>>;
    map<R>(f: MapFn<T, R>): R extends Promise<infer R2> ? AsyncOption<R2> : AsyncOption<R>;
} & Omit<Option<T>, "value" | "map" | "mapError" | "flatMap"> &
    Promise<Option<T>>;

export type Some<T> = {
    some: true;
    value: T;
    map<R>(f: MapFn<T, R>): R extends Promise<infer R2> ? AsyncSome<R2> : Some<R>;
    flatMap<T2>(
        f: FlatMapFn<T, T2>,
    ): ReturnType<typeof f> extends Promise<T2> ? AsyncOption<T2> : Option<T2>;
    attemptMap<R>(
        f: MapFn<T, R>,
    ): R extends Promise<infer R2> ? AsyncResult<R2, unknown> : Result<R, unknown>;
};

export type None = {
    some: false;
    value: never;
    map: <R>(f: MapFn<never, R>) => None;
    flatMap: <T2>(f: FlatMapFn<never, T2>) => None;
    attemptMap: <T2>(f: MapFn<never, T2>) => Result<None, never>;
};

export type AsyncSome<T> = {
    value: Promise<Option<T>>;
    map<R>(f: MapFn<T, R>): R extends Promise<infer R2> ? AsyncSome<R2> : AsyncSome<R>;
    flatMap<T2>(f: FlatMapFn<T, T2>): AsyncOption<T2>;
    attemptMap<R>(
        f: MapFn<T, R>,
    ): R extends Promise<infer R2> ? AsyncResult<R2, unknown> : AsyncResult<R, unknown>;
} & Omit<Some<T>, "value" | "map" | "mapError" | "flatMap"> &
    Promise<Some<T>>;

export const Some = <T>(value: T): Some<T> => ({
    some: true,
    value,
    map<R>(f: MapFn<T, R>): R extends Promise<infer R2> ? AsyncSome<R2> : Some<R> {
        const newValue = f(value);

        return (
            newValue instanceof Promise //
                ? AsyncSome(newValue)
                : Some(newValue)
        ) as Any;
    },
    flatMap<T2>(f: FlatMapFn<T, T2>) {
        const result = f(value);
        return (result instanceof Promise ? promiseOfOptionToAsyncOption(result) : result) as Any;
    },
    attemptMap<R>(
        f: MapFn<T, R>,
    ): R extends Promise<infer R2> ? AsyncResult<R2, never> : Result<R, unknown> {
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

export const None: None = {
    some: false,
    value: undefined as never,
    map: () => None,
    flatMap: () => None,
    attemptMap: () => Ok(None),
};

export const AsyncSome = <T>(value: T | Promise<T>): AsyncOption<T> => {
    const resultPromise = Promise.resolve(value).then((resolvedValue) => {
        const result: Option<T> = Some(resolvedValue);
        return result;
    });

    return promiseOfOptionToAsyncOption(resultPromise) as AsyncSome<T>;
};

const promiseOfOptionToAsyncOption = <T>(promise: Promise<Option<T>>): AsyncOption<T> => {
    // @ts-ignore
    promise.some = // Constrain the @ts-ignore to the bare minimum with this comment.
        promise.then((resolved) => resolved.some);

    // @ts-ignore
    promise.value = // Constrain the @ts-ignore to the bare minimum with this comment.
        promise.then((resolved) => (resolved.some ? Some(resolved.value) : None));

    // @ts-ignore
    promise.map = // Constrain the @ts-ignore to the bare minimum with this comment.
        <R>(f: MapFn<T, R>): AsyncOption<R> => {
            const mapped = promise.then((resolved) => {
                const mapped = resolved.map(f);
                return Promise.resolve(mapped);
            });
            return promiseOfOptionToAsyncOption(mapped) as AsyncOption<R>;
        };

    // @ts-ignore
    promise.flatMap = // Constrain the @ts-ignore to the bare minimum with this comment.
        <T2>(f: FlatMapFn<T, T2>): AsyncOption<T2> => {
            const mapped = promise.then((resolved) => {
                const chained = resolved.flatMap(f);
                return promiseOfOptionToAsyncOption(Promise.resolve(chained));
            });
            return promiseOfOptionToAsyncOption(mapped);
        };

    // @ts-ignore
    promise.attemptMap = // Constrain the @ts-ignore to the bare minimum with this comment.
        <R>(f: MapFn<T, R>): AsyncResult<R, unknown> => {
            const mapped = promise.then((resolved) => {
                const mapped = resolved.attemptMap(f);
                return Promise.resolve(mapped);
            });
            return promiseOfResultToAsyncResult(mapped) as AsyncResult<R, unknown>;
        };

    return promise as AsyncOption<T>;
};
