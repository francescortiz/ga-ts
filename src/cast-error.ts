import { AsyncErr, AsyncOk, AsyncResult, Err, Ok, Result } from "./result";
import { Any } from "./types";

export const castErr: <T, R extends AsyncResult<Any, Any> | Result<Any, Any>, E2>(
    f: (t: T) => R,
    q: (e: R extends AsyncErr<infer E> ? E : R extends Err<infer E> ? E : never) => E2,
) => (
    t: T,
) => R extends AsyncOk<infer V>
    ? AsyncResult<V, E2>
    : R extends Ok<infer V>
    ? Result<V, E2>
    : never = {} as Any;
