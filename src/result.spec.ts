import { describe, expect, it } from "@jest/globals";
import { inspect } from "util";
import { crash } from "./crash";
import { None, Some } from "./option";
import { AsyncErr, AsyncOk, AsyncResult, Err, Ok, Result, Task } from "./result";

describe("result.ts", () => {
    describe("map", () => {
        it("map no async", () => {
            const start = Ok(12);
            const result = start.map((x) => x + 1);

            expect(result.value).toBe(13);
            expect(result.error).toBeUndefined();
        });

        it("map to async", async () => {
            const start = Ok(12);
            const result = start.map((x) => {
                return Promise.resolve(x + 1);
            });

            expect(await result.value).toEqual(Some(13));
            expect((await result).value).toBe(13);
            expect(await result.error).toEqual(None);
            expect((await result).error).toBeUndefined();
        });

        it("map to async and not async", async () => {
            const start = Ok(12);
            const result1 = start.map((x): Promise<number> => {
                return new Promise((resolve) => resolve(x + 1));
            });
            const result = result1.map((x) => x + 1);

            expect(await result.value).toEqual(Some(14));
            expect((await result).value).toBe(14);
            expect(await result.error).toEqual(None);
            expect((await result).error).toBeUndefined();
        });

        it("promise to map", async () => {
            const start = AsyncOk(Promise.resolve(12));
            const result = start.map((x) => x + 1);

            expect(await result.value).toEqual(Some(13));
            expect((await result).value).toBe(13);
            expect(await result.error).toEqual(None);
            expect((await result).error).toBeUndefined();
        });

        it("promise to async map to map", async () => {
            const start = AsyncOk(Promise.resolve(12));
            const result1 = start.map((x) => {
                return Promise.resolve(x + 1);
            });
            const result = result1.map((x) => x + 1);

            expect(await result.value).toEqual(Some(14));
            expect((await result).value).toBe(14);
            expect(await result.error).toEqual(None);
            expect((await result).error).toBeUndefined();
        });
    });

    describe("mapError", () => {
        it("er map", () => {
            const start = Err(12);
            const result = start.map((x) => x + 1);

            expect(result.value).toBeUndefined();
            expect(result.error).toBe(12);
        });

        it("mapError no async", () => {
            const start = Err(12);
            const result = start.mapError((x) => x + 1);

            expect(result.value).toBeUndefined();
            expect(result.error).toBe(13);
        });

        it("mapError to async", async () => {
            const start = Err(12);
            const result = start.mapError((x) => {
                return Promise.resolve(x + 1);
            });

            expect(await result.value).toEqual(None);
            expect((await result).value).toBeUndefined();
            expect(await result.error).toEqual(Some(13));
            expect((await result).error).toEqual(13);
        });

        it("mapError to async and not async", async () => {
            const start = Err(12);
            const result1 = start.mapError((x): Promise<number> => {
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
            const result = start.mapError((x) => x + 1);

            expect(await result.value).toEqual(None);
            expect((await result).value).toBeUndefined();
            expect(await result.error).toEqual(Some(13));
            expect((await result).error).toEqual(13);
        });

        it("err promise to async map to map", async () => {
            const start = AsyncErr(Promise.resolve(12));
            const result1 = start.mapError((x) => {
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
            const result = start.flatMap((x) => Ok(x + 1));

            expect(result.value).toBe(13);
            expect(result.error).toBeUndefined();
        });

        it("async ok flatMap ok", async () => {
            const start = AsyncOk(Promise.resolve(12));
            const result = start.flatMap((x) => Promise.resolve(Ok(x + 1)));

            expect(await result.value).toEqual(Some(13));
            expect(await result.error).toEqual(None);

            const awaitedResult = await result;

            expect(awaitedResult.value).toBe(13);
            expect(awaitedResult.error).toBeUndefined();
        });

        it("sync ok async flatMap ok", async () => {
            const start = Ok(12);
            const result = start.flatMap(async (x) => Promise.resolve(Ok(x + 1)));

            const resultResolved = await result;

            expect(resultResolved.value).toBe(13);
            expect(resultResolved.error).toBeUndefined();
        });
    });
    describe("Task", () => {
        it("task and function throws", () => {
            const division = ({
                numerator,
                denominator,
            }: {
                numerator: bigint;
                denominator: bigint;
            }) => numerator / denominator;

            const start = Ok({ numerator: 2n, denominator: 0n });

            const task = Task(division, (err: unknown) =>
                err instanceof RangeError
                    ? Err("Division by zero!")
                    : crash<Result<never, string>>(err),
            );

            const result = start.flatMap(task);

            expect(result.error).toBe("Division by zero!");
        });
        it("async task and function throws", async () => {
            const division = ({
                numerator,
                denominator,
            }: {
                numerator: bigint;
                denominator: bigint;
            }) => numerator / denominator;

            const start = AsyncOk(Promise.resolve({ numerator: 2n, denominator: 0n }));

            const task = Task(division, (err: unknown) =>
                err instanceof RangeError
                    ? Err("Division by zero!")
                    : crash<Result<never, string>>(err),
            );

            const result = start.flatMap(task);

            const awaited = await result;

            expect(awaited.error).toBe("Division by zero!");
        });
        it("task and function returns", async () => {
            const division = ({
                numerator,
                denominator,
            }: {
                numerator: bigint;
                denominator: bigint;
            }) => numerator / denominator;

            const start = Ok({ numerator: 2n, denominator: 2n });

            const task = Task(division, (err: unknown) => Err("Division by zero!"));

            const result = start.flatMap(task);

            expect(result.value).toBe(1n);
            expect(result.error).toBeUndefined();
        });
        it("task and function returns when async function", async () => {
            const asyncDivision = async ({
                numerator,
                denominator,
            }: {
                numerator: bigint;
                denominator: bigint;
            }) => Promise.resolve(numerator / denominator);

            const start = Ok({ numerator: 2n, denominator: 2n });

            const task = Task(asyncDivision, (err: unknown) => Err("Division by zero!"));

            const result = await start.flatMap(task);

            expect(result.value).toBe(1n);
            expect(result.error).toBeUndefined();
        });
        it("task and function throws", async () => {
            const asyncDivision = async ({
                numerator,
                denominator,
            }: {
                numerator: bigint;
                denominator: bigint;
            }) => Promise.resolve(numerator / denominator);

            const start = Ok({ numerator: 2n, denominator: 0n });

            const task = Task(asyncDivision, (err: unknown) => Err("Division by zero!"));

            const result = await start.flatMap(task);

            expect(result.error).toBe("Division by zero!");
        });
    });

    describe("other tests", () => {
        it("runs readme code", async () => {
            const firstOne: Result<number, Error> = Ok(1);

            {
                const randomPicAsyncResult: AsyncResult<string, Error> = firstOne
                    .map((x) => Math.floor(x * 100)) // -> Sync
                    .attemptMap((x) => (x === 200 ? crash("One is not allowed.") : x)) // -> Sync
                    .mapError(async (error_) => {
                        const error = new Error(
                            `Failed to fetch: ${inspect(error_, { depth: null })}`,
                        );
                        await fetch("https://example.com/error", {
                            method: "POST",
                            body: inspect(error, { depth: null }),
                        });
                        return error;
                    }) // -> Async
                    .map((x) => x + " loco"); // -> Sync

                // Use it
                const randomPicResult = await randomPicAsyncResult;
                expect(randomPicResult.ok).toEqual(true);
                expect(randomPicResult.value).toEqual("100 loco");
            }
        });
        it("runs readme code on error", async () => {
            const firstOne: Result<number, Error> = Ok(1);
            const secondOne: AsyncResult<number, Error> = AsyncOk(Promise.resolve(2));

            {
                const randomPicAsyncResult: AsyncResult<string, Error> = firstOne
                    .map((x) => Math.floor(x * 100)) // -> Sync
                    .attemptMap((x) => (x === 200 ? crash("One is not allowed.") : x)) // -> Sync
                    .mapError(async (error_) => {
                        const error = new Error(
                            `Failed to fetch: ${inspect(error_, { depth: null })}`,
                        );
                        await fetch("https://example.com/error", {
                            method: "POST",
                            body: inspect(error, { depth: null }),
                        });
                        return error;
                    }) // -> Async
                    .map((x) => x + " loco"); // -> Sync

                // Use it
                const randomPicResult = await randomPicAsyncResult;
                expect(randomPicResult.ok).toEqual(true);
                expect(randomPicResult.value).toEqual("100 loco");
            }
            {
                const randomPicAsyncResult: AsyncResult<string, Error> = secondOne
                    .map((x) => Math.floor(x * 100)) // -> Sync
                    .attemptMap((x) => (x === 200 ? crash("One is not allowed.") : x)) // -> Sync
                    .mapError(async (error_) => {
                        const error = new Error(`Failed to fetch: ${(error_ as Error)?.message}`);
                        await fetch("https://example.com/error", {
                            method: "POST",
                            body: inspect(error, { depth: null }),
                        });
                        return error;
                    }) // -> Async
                    .map((x) => x + " loco"); // -> Sync

                // Use it
                const randomPicResult = await randomPicAsyncResult;
                expect(randomPicResult.ok).toEqual(false);
                expect(inspect(randomPicResult.error.message)).toEqual(
                    "'Failed to fetch: One is not allowed.'",
                );
            }
            {
                const randomPicAsyncResult: AsyncResult<string, Error> = secondOne
                    .map((x) => Math.floor(x * 100)) // -> Sync
                    .attemptMap(() => Promise.reject("failing promise")) // -> Sync
                    .mapError(async (error_) => {
                        const error = new Error(`Failed to fetch: ${error_}`);
                        await fetch("https://example.com/error", {
                            method: "POST",
                            body: inspect(error, { depth: null }),
                        });
                        return error;
                    }) // -> Async
                    .map((x) => x + " loco"); // -> Sync

                // Use it
                const randomPicResult = await randomPicAsyncResult;
                expect(randomPicResult.ok).toEqual(false);
                expect(inspect(randomPicResult.error.message)).toEqual(
                    "'Failed to fetch: failing promise'",
                );
            }
        });
    });
});
