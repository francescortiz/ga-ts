import { describe, it, expect } from "@jest/globals";
import { inspect } from "node:util";
import { Ok } from "../result";
import { MapFn } from "../types";

describe("Stack traces", () => {
    it("Should create correct stack trace in async context", async () => {
        const createContext = async (
            callback: MapFn<string, Promise<Ok<Error>>>,
        ): Promise<Ok<Error>> => {
            return await callback("2");
        };

        const createTransaction = async (
            callback: MapFn<string, Promise<Ok<Error>>>,
        ): Promise<Ok<Error>> => {
            return await createContext((tx) => {
                return callback(tx);
            });
        };
        const getStack = async (arg: string): Promise<Ok<Error>> => {
            await Promise.resolve();
            return Ok(undefined).map(async () => {
                await Promise.resolve();
                return new Error(`With context: ${arg}, Error`);
            });
        };
        const result = await createTransaction(getStack);

        expect(inspect(result.value, { depth: 20 })).toEqual({});
    });
});
