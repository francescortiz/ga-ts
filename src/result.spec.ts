import { describe, expect, it } from "@jest/globals";
import { None, Some } from "./option";
import { AsyncErr, AsyncOk, AsyncResult, Err, Ok } from "./result";

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

        it("map to err should be err", async () => {
            const start = Err(new Error("Error"));

            const result: Err<Error> = start.map((x) => (x as number) + 1);

            expect(result.value).toBeUndefined();
            expect(result.error).toEqual(new Error("Error"));
        });
    });

    describe("mapError", () => {
        it("er map", () => {
            const start = Err(12);
            const result: Err<number> = start.map((x) => (x as number) + 1);

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
            const f = async (x: number) => Promise.resolve(Err(error));

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
});
