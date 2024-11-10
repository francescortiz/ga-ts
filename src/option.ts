import { Any, MapFn } from "./types";
import { Err, OkBase, Result } from "./result";

export class NoValueError extends Error {
    kind: string = "NoValueError";
    constructor() {
        super("Attempted to convert None into a Result");
    }
}

export type FlatMapFn<T, T2> = (value: T) => Option<T2>;

export type Option<T> = Some<T> | None<T>;

export type Some<T> = {
    some: true;
    value: T;
    map<R>(f: MapFn<T, R>): Some<R>;
    flatMap<T2>(f: FlatMapFn<T, T2>): Option<T2>;
    toResult: () => Result<T, never>;
    resultMap: OkBase<T>["map"];
    attemptMap: OkBase<T>["attemptMap"];
};

export type None<T = never> = {
    some: false;
    value: never;
    map: (f: MapFn<Any, Any>) => None<T>;
    flatMap: (f: FlatMapFn<Any, Any>) => None<T>;
    toResult: () => Result<never, NoValueError>;
    resultMap: Err<NoValueError>["map"];
    attemptMap: Err<NoValueError>["attemptMap"];
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
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    resultMap: (fn) => Err(new NoValueError()).map(fn),
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    attemptMap: (fn) => Err(new NoValueError()).attemptMap(fn),
} satisfies Omit<None, "some" | "value">);
