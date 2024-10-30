import { describe, expect, it } from "@jest/globals";
import { None, Some } from "./option";

describe("Option", () => {
    it("Some constructor evaluates to a valid Some", () => {
        const option = Some(1);
        expect(option).toEqual({ some: true, value: 1 });
    });

    it("None evaluates to a valid None", () => {
        expect(None).toEqual({ some: false, value: undefined });
    });

    it("Some.map evaluates to a valid Some", () => {
        const option = Some(1).map((value) => value + 1);
        expect(option).toEqual({ some: true, value: 2 });
    });

    it("Some.flatMap evaluates to a valid Some", () => {
        const option = Some(1).flatMap((value) => Some(value + 1));
        expect(option).toEqual({ some: true, value: 2 });
    });

    it("Some.flatMap evaluates to a valid None", () => {
        const option = Some(1).flatMap(() => None);
        expect(option).toEqual({ some: false, value: undefined });
    });

    it("Some.attemptMap evaluates to a valid Ok", () => {
        const option = Some(1).attemptMap((value) => value + 1);
        expect(option).toEqual({ ok: true, value: 2 });
    });

    it("Some.attemptMap evaluates to a valid Err", () => {
        const option = Some(1).attemptMap(() => {
            throw new Error("error");
        });
        expect(option).toEqual({ ok: false, error: new Error("error") });
    });

    it("None.map evaluates to a valid None", () => {
        const option = None.map(() => 1);
        expect(option).toEqual({ some: false, value: undefined });
    });

    it("None.flatMap evaluates to None", () => {
        const option = None.flatMap(() => Some(1));
        expect(option).toEqual({ some: false, value: undefined });
    });

    it("None.attemptMap evaluates to a valid Ok", () => {
        const option = None.attemptMap(() => 1);
        expect(option).toEqual({ ok: true, value: 1 });
    });

    it("None.attemptMap evaluates to a valid Err", () => {
        const option = None.attemptMap(() => {
            throw new Error("error");
        });
        expect(option).toEqual({ ok: false, error: new Error("error") });
    });
});
