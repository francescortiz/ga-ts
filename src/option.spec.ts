import { describe, expect, it } from "@jest/globals";
import { None, Some, Option, NoValueError } from "./option";
import { AsyncResult, Err, Ok, Result } from "./result";

describe("Option", () => {
    it("Some constructor evaluates to a valid Some", () => {
        const option: Some<number> = Some(1);
        expect(option).toEqual({ some: true, value: 1 });
    });

    it("None evaluates to a valid None", () => {
        expect(None).toEqual({ some: false, value: undefined });
    });

    it("Some.map evaluates to a valid Some", () => {
        const option: Some<number> = Some(1).map((value) => value + 1);
        expect(option).toEqual({ some: true, value: 2 });
    });

    it("Some.flatMap evaluates to a valid Some", () => {
        const option: Option<number> = Some(1).flatMap((value) => Some(value + 1));
        expect(option).toEqual({ some: true, value: 2 });
    });

    it("Some.flatMap evaluates to a valid None", () => {
        const option: Option<number> = Some(1).flatMap(() => None);
        expect(option).toEqual({ some: false, value: undefined });
    });

    it("Some.flatMap evaluates to a valid None or Some randomly", () => {
        const randormNumber = 1;

        const option: Option<number> = Some(1).flatMap((n: number) => {
            if (randormNumber > 0.5) {
                return None;
            } else {
                return Some(n);
            }
        });
        expect(option).toEqual({ some: false, value: undefined });
    });

    it("None.map evaluates to a valid None", () => {
        const option: None = None.map(() => 1);
        expect(option).toEqual({ some: false, value: undefined });
    });

    it("None.flatMap evaluates to None", () => {
        const option: None = None.flatMap(() => Some(1));
        expect(option).toEqual({ some: false, value: undefined });
    });

    it("None.toResult evaluates to Err", () => {
        const option = None;
        const result: Result<never, NoValueError> = option.toResult();

        expect(result).toEqual(Err(new NoValueError()));
    });

    it("Some.toResult evaluates to Ok", () => {
        const option = Some(1);
        const result: Result<number, never> = option.toResult();

        expect(result).toEqual(Ok(1));
    });

    it("Some.resultMap evaluates to Ok with the correct value", () => {
        const option = Some(1);
        const result: Result<number, never> = option.resultMap((value: number) => value + 3);

        expect(result).toEqual(Ok(4));
    });

    it("Some.resultMap evaluates to Ok with the correct value with an async callback", async () => {
        const option = Some(1);
        const result: AsyncResult<number, never> = option.resultMap((value: number) =>
            Promise.resolve(value + 3),
        );

        expect(await result).toEqual(Ok(4));
    });

    it("None.resultMap evaluates to Err", () => {
        const option = None;
        const result: Result<never, NoValueError> = option.resultMap((value: number) => value + 2);

        expect(result).toEqual(Err(new NoValueError()));
    });

    it("None.resultMap evaluates to Err with an async callback", async () => {
        const option = None;
        const result: AsyncResult<never, NoValueError> = option.resultMap((value: number) =>
            Promise.resolve(value + 2),
        );

        expect(await result).toEqual(Err(new NoValueError()));
    });

    it("Some.attemptMap evaluates to Ok with the correct value", () => {
        const option = Some(1);
        const result: Result<number, unknown> = option.attemptMap((value: number) => value + 3);

        expect(result).toEqual(Ok(4));
    });

    it("Some.attemptMap evaluates to Ok with the correct value with an async callback", async () => {
        const option = Some(1);
        const result: AsyncResult<number, unknown> = option.attemptMap((value: number) =>
            Promise.resolve(value + 3),
        );

        expect(await result).toEqual(Ok(4));
    });

    it("Some.attemptMap evaluates to Err with a callback that throws", async () => {
        const option = Some(1);

        const errorThrown = new Error("Common Error");

        const result: Result<number, unknown> = option.attemptMap(() => {
            throw errorThrown;
        });

        expect(result).toEqual(Err(errorThrown));
    });

    it("Some.attemptMap evaluates to Err with a promise that rejects", async () => {
        const option = Some(1);

        const errorThrown = new Error("Common Error");

        const result: AsyncResult<number, unknown> = option.attemptMap(() => {
            return Promise.reject<number>(errorThrown);
        });

        expect(await result).toEqual(Err(errorThrown));
    });

    it("None.attemptMap evaluates to Err", () => {
        const option = None;
        const result: Result<never, NoValueError> = option.attemptMap((value: number) => value + 2);

        expect(result).toEqual(Err(new NoValueError()));
    });

    it("None.attemptMap evaluates to Err with an async callback", async () => {
        const option = None;
        const result: AsyncResult<never, NoValueError> = option.attemptMap((value: number) =>
            Promise.resolve(value + 2),
        );

        expect(await result).toEqual(Err(new NoValueError()));
    });
});
