/* eslint-disable no-constant-condition */
import { describe, expect, it } from "@jest/globals";
import { inspect } from "util";
import { crash } from "./crash";
import { AsyncOk, AsyncResult, Err, Ok } from "./result";

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
    it.skip("runs readme code on error", async () => {
        const firstOne = Ok(1);
        const secondOne = AsyncOk(Promise.resolve(2));

        {
            const randomPicAsyncResult = firstOne
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
            const randomPicAsyncResult = secondOne
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
            const randomPicAsyncResult = secondOne
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

    describe("Advanced type tests", () => {
        it("Map with async callback", async () => {
            const start = -1 > 0 ? Ok(2) : Err("whatever");
            const result = await start // Ok<number> | Err<number>
                .map((x) => x) // Ok<number> | Err<string>
                .mapError((_e) => "custom error string") // Ok<number> | Err<string>
                .map((x) => Promise.resolve(x)) // Err<string> | AsyncOk<number>
                .mapError((_x) => 4); // AsyncOk<number> | Err<number>

            expect(result.ok).toEqual(false);
            expect(result.error).toEqual(4);
        });

        it("Attemptmap with async callback", async () => {
            const start = 1 > 0 ? Ok(2) : Err("whatever");
            const result = await start // Ok<number> | Err<number>
                .map((x) => x) // Ok<number> | Err<string>
                .mapError((_e) => "custom error string") // Ok<number> | Err<string>
                .attemptMap((x) => Promise.resolve(x)) // Err<string> | AsyncResult<number, unknown>
                .mapError((_x) => 4); // AsyncOk<number> | Err<number>

            expect(result.ok).toEqual(true);
            expect(result.value).toEqual(2);
        });
    });
});
