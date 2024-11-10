import { Any, MapFn } from "./types";
import { AsyncResult, Err, Ok, Result } from "./result";

export class NoValueError extends Error {
    kind: string = "NoValueError";
    constructor() {
        super("Attempted to convert None into a Result");
    }
}

export type FlatMapFn<T, T2> = (value: T) => Option<T2>;

export type Option<T> = Some<T> | None;

export type Some<T> = {
    some: true;
    value: T;
    map<R>(f: MapFn<T, R>): Some<R>;
    flatMap<T2>(f: FlatMapFn<T, T2>): Option<T2>;
    toResult: () => Result<T, never>;
    resultMap: Result<T, never>["map"];
    attemptMap: Result<T, unknown>["attemptMap"];
};

export type None = {
    some: false;
    value: never;
    map: (f: MapFn<Any, Any>) => None;
    flatMap: (f: FlatMapFn<Any, Any>) => None;
    toResult: () => Result<never, NoValueError>;
    resultMap<T, R>(
        f: MapFn<T, R>,
    ): R extends Promise<Any> ? AsyncResult<never, NoValueError> : Result<never, NoValueError>;
    attemptMap<T, R>(
        f: MapFn<T, R>,
    ): R extends Promise<Any> ? AsyncResult<never, NoValueError> : Result<never, NoValueError>;
};

export const Some = <T>(value: T): Some<T> => {
    const some = {
        some: true,
        value,
    };

    const toResult = (): Result<T, never> => {
        return Ok(some.value);
    };

    // We don't want functions to be members of the Some instance.
    Object.setPrototypeOf(some, {
        map<R>(f: MapFn<T, R>): Some<R> {
            const newValue = f(value);

            return Some(newValue);
        },
        flatMap: (f): Option<Any> => {
            const result = f(value);
            return result;
        },
        toResult,
        resultMap: (f) => Ok(value).map(f),
        attemptMap: (f) => Ok(value).attemptMap(f),
    } satisfies Omit<Some<T>, "some" | "value">);
    return some as Some<T>;
};

// @ts-ignore It is missing the functions but we assign them afterwards.
export const None: None = {
    some: false,
    value: undefined as never,
};

// We don't want functions to be members of the None instance.
Object.setPrototypeOf(None, {
    map: (): None => None,
    flatMap(): None {
        return None;
    },
    toResult: (): Result<never, NoValueError> => {
        return Err(new NoValueError());
    },
    resultMap: (fn) => Err(new NoValueError()).map(fn),
    attemptMap: (fn) => Err(new NoValueError()).attemptMap(fn),
} satisfies Omit<None, "some" | "value">);
