import { describe, expect, it } from "@jest/globals";
import { inspect } from "util";
import { crash } from "./crash";
import { AsyncOk, AsyncResult, Ok, Result } from "./result";

describe("other tests", () => {
    it("runs readme code", async () => {
        const firstOne = Ok(1);

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
        const firstOne: Result<number, never> = Ok(1);
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
