import { describe, expect, it } from "@jest/globals";
import { None, Some, Option } from "./option";
import { Ok, Result } from "./result";

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

    it("Some.attemptMap evaluates to a valid Ok", () => {
        const option: Result<number, unknown> = Some(1).attemptMap((value) => value + 1);
        expect(option).toEqual({ ok: true, value: 2 });
    });

    it("Some.attemptMap evaluates to a valid Err", () => {
        const option: Result<number, Error> = Some(1).attemptMap(() => {
            throw new Error("error");
        });
        expect(option).toEqual({ ok: false, error: new Error("error") });
    });

    it("None.map evaluates to a valid None", () => {
        const option: None = None.map(() => 1);
        expect(option).toEqual({ some: false, value: undefined });
    });

    it("None.flatMap evaluates to a valid Some", () => {
        const option: None = None.flatMap(() => Some(1));
        expect(option).toEqual({ some: false, value: undefined });
    });

    it("None.attemptMap evaluates to Ok(undefined)", () => {
        const option: Ok<undefined> = None.attemptMap(() => 1);
        expect(option).toEqual({ ok: true, value: undefined });
    });

    it("None.attemptMap evaluates to Ok(undefined)", () => {
        const option: Ok<undefined> = None.attemptMap(() => {
            throw new Error("error");
        });
        expect(option).toEqual({ ok: true, value: undefined });
    });
});
