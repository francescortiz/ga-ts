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
            err instanceof RangeError ? "Division by zero!" : crash(err),
        );

        const result = start.flatMap(task);

        expect(result.error).toBe("Division by zero!");
    });
    it("async task and function throws", async () => {
        const division = ({ numerator, denominator }: { numerator: bigint; denominator: bigint }) =>
            numerator / denominator;

        const start = AsyncOk(Promise.resolve({ numerator: 2n, denominator: 0n }));

        const task = Task(division, (err: unknown) =>
            err instanceof RangeError ? "Division by zero!" : crash(err),
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
            err instanceof RangeError ? "Division by zero!" : crash(err),
        );

        const result = await start.flatMap(task);

        expect(result.value).toBe(1n);
        expect(result.error).toBeUndefined();
    });
    it("task and async function throws", async () => {
        const asyncDivision = async ({
            numerator,
            denominator,
        }: {
            numerator: bigint;
            denominator: bigint;
        }) => Promise.resolve(numerator / denominator);

        const start = Ok({ numerator: 2n, denominator: 0n });

        const task = Task(asyncDivision, (err: unknown) =>
            err instanceof RangeError ? "Division by zero!" : crash(err),
        );

        const result = await start.flatMap(task);

        expect(result.error).toBe("Division by zero!");
    });
});
