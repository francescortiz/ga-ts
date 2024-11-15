/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { describe, expect, it } from "@jest/globals";
import { inspect } from "util";
import { crash } from "./crash";
import { AsyncOk, AsyncResult, Err, Ok, Result } from "./result";
import { Task } from "./task";

describe("Task", () => {
    it("task and function throws", () => {
        const division = ({ numerator, denominator }: { numerator: bigint; denominator: bigint }) =>
            numerator / denominator;

        const start = Ok({ numerator: 2n, denominator: 0n });

        const task = Task(division, (err: unknown) =>
            err instanceof RangeError ? Err("Division by zero!") : crash(err),
        );

        const result = start.flatMap(task);

        expect(result.error).toBe("Division by zero!");
    });
    it("async task and function throws", async () => {
        const division = ({ numerator, denominator }: { numerator: bigint; denominator: bigint }) =>
            numerator / denominator;

        const start = AsyncOk(Promise.resolve({ numerator: 2n, denominator: 0n }));

        const task = Task(division, (err: unknown) =>
            err instanceof RangeError ? Err("Division by zero!") : crash(err),
        );

        const result = start.flatMap(task);

        const awaited = await result;

        expect(awaited.error).toBe("Division by zero!");
    });
    it("task and function returns", () => {
        const division = ({ numerator, denominator }: { numerator: bigint; denominator: bigint }) =>
            numerator / denominator;

        const start = Ok({ numerator: 2n, denominator: 2n });

        const task = Task(division, (err: unknown) =>
            err instanceof RangeError ? Err("Division by zero!") : crash(err),
        );

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

        const task = Task(asyncDivision, (err: unknown) =>
            err instanceof RangeError ? Err("Division by zero!") : crash(err),
        );

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

        const task = Task(asyncDivision, (err: unknown) =>
            err instanceof RangeError ? Err("Division by zero!") : crash(err),
        );

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
                    const error = new Error(`Failed to fetch: ${inspect(error_, { depth: null })}`);
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
                    const error = new Error(`Failed to fetch: ${inspect(error_, { depth: null })}`);
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
