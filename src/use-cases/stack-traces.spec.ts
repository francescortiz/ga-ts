import { describe, it, expect } from "@jest/globals";
import { inspect } from "node:util";
import { Ok } from "../result";
import { MapFn } from "../types";

/*
 * It is important to not lose the stack trace while using ga-ts,
 * especially in async operations
 * */
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
            return await Ok(undefined).map(async () => {
                await Promise.resolve();
                return new Error(`With context: ${arg}`);
            });
        };
        const result = await createTransaction(getStack);

        expect(normalizeStackTrace(inspect(result.value, { depth: 20 }))).toMatchSnapshot(
            "The last line should come from createTransaction",
        );
    });
});

function normalizeStackTrace(stackTrace: string): string {
    const baseDir = "ga-ts";

    return stackTrace
        .split("\n")
        .map((line) => line.trim())
        .map((line) => {
            // Match paths both with and without parentheses
            const pathMatch = line.match(/(?:at\s+(?:\w+\s+)?\(?)(\/[^:)]+)|(?:\()(\/[^:)]+)/);
            if (!pathMatch) return line;

            // The path will be in either the first or second capture group
            const fullPath = pathMatch[1] || pathMatch[2];
            if (!fullPath) return line;

            const baseDirIndex = fullPath.indexOf(baseDir);
            if (baseDirIndex === -1) return line;

            // Get the relative path starting from baseDir
            const relativePath = fullPath.slice(baseDirIndex);

            // Replace the full path while preserving the rest of the line
            return line.replace(fullPath, relativePath);
        })
        .join("\n");
}
