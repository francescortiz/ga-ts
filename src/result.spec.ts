/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-constant-condition */
import { describe, expect, it } from "@jest/globals";
import { None, Some } from "./option";
import { AsyncErr, AsyncOk, AsyncResult, Err, Ok, Result, wrap } from "./result";

describe("Result", () => {
    describe("map", () => {
        it("map no async", () => {
            const start = Ok(12);
            const result: Ok<number> = start.map((x) => x + 1);

            expect(result.value).toBe(13);
            expect(result.error).toBeUndefined();
        });

        it("map to async", async () => {
            const start = Ok(12);
            const result: AsyncOk<number> = start.map((x) => {
                return Promise.resolve(x + 1);
            });

            expect(await result.value).toEqual(Some(13));
            expect((await result).value).toBe(13);
            expect(await result.error).toEqual(None);
            expect((await result).error).toBeUndefined();
        });

        it("map to async and not async", async () => {
            const start = Ok(12);
            const result1: AsyncOk<number> = start.map((x): Promise<number> => {
                return new Promise((resolve) => resolve(x + 1));
            });
            const result: AsyncOk<number> = result1.map((x) => x + 1);

            expect(await result.value).toEqual(Some(14));
            expect((await result).value).toBe(14);
            expect(await result.error).toEqual(None);
            expect((await result).error).toBeUndefined();
        });

        it("promise to map", async () => {
            const start = AsyncOk(Promise.resolve(12));
            const result: AsyncOk<number> = start.map((x) => x + 1);

            expect(await result.value).toEqual(Some(13));
            expect((await result).value).toBe(13);
            expect(await result.error).toEqual(None);
            expect((await result).error).toBeUndefined();
        });

        it("promise to async map to map", async () => {
            const start = AsyncOk(Promise.resolve(12));
            const result1: AsyncOk<number> = start.map((x) => {
                return Promise.resolve(x + 1);
            });
            const result: AsyncOk<number> = result1.map((x) => x + 1);

            expect(await result.value).toEqual(Some(14));
            expect((await result).value).toBe(14);
            expect(await result.error).toEqual(None);
            expect((await result).error).toBeUndefined();
        });

        it("map to err should be err", () => {
            const start = Err(new Error("Error"));

            const result: Err<Error> = start.map((x: number) => x + 1);

            expect(result.value).toBeUndefined();
            expect(result.error).toEqual(new Error("Error"));
        });

        it("Result map should be Result", () => {
            const start = 1 > 0 ? Ok(2) : Err("whatever");

            const result: Result<number, string> = start.map((x) => x + 1);

            expect(result.ok).toBe(true);
            expect(result.value).toEqual(3);
        });

        it("Result map of promise should be AsyncResult", async () => {
            const start = -1 > 0 ? Ok(2) : Err("whatever");

            // Type 'AsyncOk<number> | Err<string>' is not assignable to type 'AsyncResult<number, string>'.
            const result: AsyncResult<number, string> = start.map((x) => Promise.resolve(x + 1));
            const awaitedResult = await result;

            expect(awaitedResult.ok).toBe(false);
            expect(awaitedResult.error).toEqual("whatever");
        });
    });

    describe("mapError", () => {
        it("er map", () => {
            const start = Err(12);
            const result: Err<number> = start.map((x: number) => x + 1);

            expect(result.value).toBeUndefined();
            expect(result.error).toBe(12);
        });

        it("mapError no async", () => {
            const start = Err(12);
            const result: Err<number> = start.mapError((x) => x + 1);

            expect(result.value).toBeUndefined();
            expect(result.error).toBe(13);
        });

        it("mapError to async", async () => {
            const start = Err(12);
            const result: AsyncErr<number> = start.mapError((x) => {
                return Promise.resolve(x + 1);
            });

            expect(await result.value).toEqual(None);
            expect((await result).value).toBeUndefined();
            expect(await result.error).toEqual(Some(13));
            expect((await result).error).toEqual(13);
        });

        it("mapError to async and not async", async () => {
            const start = Err(12);
            const result1: AsyncErr<number> = start.mapError((x): Promise<number> => {
                return new Promise((resolve) => resolve(x + 1));
            });
            const result = result1.mapError((x) => x + 1);

            expect(await result.value).toEqual(None);
            expect((await result).value).toBeUndefined();
            expect(await result.error).toEqual(Some(13));
            expect((await result).error).toEqual(13);
        });

        it("err promise to map", async () => {
            const start = AsyncErr(Promise.resolve(12));
            const result: AsyncErr<number> = start.mapError((x) => x + 1);

            expect(await result.value).toEqual(None);
            expect((await result).value).toBeUndefined();
            expect(await result.error).toEqual(Some(13));
            expect((await result).error).toEqual(13);
        });

        it("err promise to async map to map", async () => {
            const start = AsyncErr(Promise.resolve(12));
            const result1: AsyncErr<number> = start.mapError((x) => {
                return Promise.resolve(x + 1);
            });
            const result = result1.mapError((x) => x + 1);

            expect(await result.value).toEqual(None);
            expect((await result).value).toBeUndefined();
            expect(await result.error).toEqual(Some(14));
            expect((await result).error).toEqual(14);
        });
    });

    describe("flatMap", () => {
        it("ok flatMap sync ok", () => {
            const start = Ok(12);
            const result: Ok<number> = start.flatMap((x) => Ok(x + 1));

            expect(result.value).toBe(13);
            expect(result.error).toBeUndefined();
        });

        it("result flatMap sync result", () => {
            const start = 1 > 0.5 ? Ok(12) : Err("Error");
            const result: Result<number, string> = start.flatMap((x) => Ok(x + 1));

            expect(result.value).toBe(13);
            expect(result.error).toBeUndefined();
        });

        it("async ok flatMap ok", async () => {
            const start = AsyncOk(Promise.resolve(12));

            const result: AsyncOk<number> = start.flatMap((x) => Promise.resolve(Ok(x + 1)));

            expect(await result.value).toEqual(Some(13));
            expect(await result.error).toEqual(None);

            const awaitedResult = await result;

            expect(awaitedResult.value).toBe(13);
            expect(awaitedResult.error).toBeUndefined();
        });

        it("sync ok async flatMap ok", async () => {
            const start = Ok(12);
            const f = async (x: number) => Promise.resolve(Ok(x + 1));
            const result: AsyncOk<number> = start.flatMap(f);

            const resultResolved = await result;

            expect(resultResolved.value).toBe(13);
            expect(resultResolved.error).toBeUndefined();
        });

        it("sync ok async flatMap error", async () => {
            const error = new Error("Error");
            const start = Ok(12);
            const f = async (_x: number) => Promise.resolve(Err(error));

            const result: AsyncErr<Error> = start.flatMap(f);

            const resultResolved = await result;

            expect(resultResolved.ok).toBe(false);
            expect(resultResolved.error).toEqual(error);
            expect(resultResolved.value).toEqual(undefined);
        });

        it("sync ok async flatMap error or ok", async () => {
            const error = new Error("Error");
            const start = Ok(12);
            const f = async (x: number) => {
                if (2 > 3) {
                    return Promise.resolve(Err(error));
                } else {
                    return Promise.resolve(Ok(x + 4));
                }
            };

            const result: AsyncResult<number, Error> = start.flatMap(f);

            const resultResolved = await result;

            expect(resultResolved.ok).toBe(true);
            expect(resultResolved.error).toEqual(undefined);
            expect(resultResolved.value).toEqual(16);
        });
    });

    describe("Wrap", () => {
        it("Should wrap correctly", async () => {
            const asyncSum2 = wrap(async (n: number) => {
                await Promise.resolve();
                return Ok(n + 2);
            });

            const result = await asyncSum2(2).map((x) => x + 2);

            expect(result.value).toEqual(6);
        });
    });
});
