import { Any, MapFn } from "./types";
import { AsyncResult, Err, Ok, Result } from "./result";

export class AttemptMapOnNoneError extends Error {
    kind: string = "AttemptMapOnNoneError";
    constructor() {
        super("Attempted to map over None");
    }
}

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
    flatMap<F extends FlatMapFn<T, Any>>(f: F): ReturnType<F>;
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
    ): R extends Promise<Any>
        ? AsyncResult<never, AttemptMapOnNoneError>
        : Result<never, AttemptMapOnNoneError>;
    attemptMap<T, R>(
        f: MapFn<T, R>,
    ): R extends Promise<Any>
        ? AsyncResult<never, AttemptMapOnNoneError>
        : Result<never, AttemptMapOnNoneError>;
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
        flatMap<T2>(f: FlatMapFn<T, T2>) {
            const result = f(value);
            return result;
        },
        toResult,
        resultMap: toResult().map,
        attemptMap: toResult().attemptMap,
    });
    return some as Some<T>;
};

// @ts-ignore It is missing the functions but we assign them afterwards.
export const None: None = {
    some: false,
    value: undefined as never,
};

const resultMap = () => {
    return Err(new AttemptMapOnNoneError());
};

// We don't want functions to be members of the None instance.
Object.setPrototypeOf(None, {
    map: () => None,
    flatMap(_: FlatMapFn<Any, Any>) {
        return None;
    },
    toResult: () => {
        return Err(new NoValueError());
    },
    resultMap,
    attemptMap: resultMap,
});
