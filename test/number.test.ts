import { describe, expect, expectTypeOf, it } from "vitest";
import { number } from "../src/index";
import type { Validator } from "../src/types";

describe("number() parsing", () => {
  it("parses integers, decimals, negatives, plus signs, and zero", () => {
    expect(number().parse("42")).toEqual({ ok: true, value: 42 });
    expect(number().parse("3.14")).toEqual({ ok: true, value: 3.14 });
    expect(number().parse("-17")).toEqual({ ok: true, value: -17 });
    expect(number().parse("+7")).toEqual({ ok: true, value: 7 });
    expect(number().parse("0")).toEqual({ ok: true, value: 0 });
  });

  it("rejects malformed input", () => {
    for (const raw of ["123abc", "abc", "1e3", "1 2", "1,5", ".5", "5.", ""]) {
      expect(number().parse(raw)).toEqual({
        ok: false,
        code: "INVALID",
        message: "invalid number",
      });
    }
  });

  it("enforces min at the boundary", () => {
    expect(number({ min: 1 }).parse("1")).toEqual({ ok: true, value: 1 });
    expect(number({ min: 1 }).parse("0")).toEqual({
      ok: false,
      code: "OUT_OF_RANGE",
      message: "must be at least 1",
    });
  });

  it("enforces max at the boundary", () => {
    expect(number({ max: 65535 }).parse("65535")).toEqual({
      ok: true,
      value: 65535,
    });
    expect(number({ max: 65535 }).parse("65536")).toEqual({
      ok: false,
      code: "OUT_OF_RANGE",
      message: "must be at most 65535",
    });
  });

  it("enforces min and max together (typical PORT schema)", () => {
    const port = number({ min: 1, max: 65535 });
    expect(port.parse("8080")).toEqual({ ok: true, value: 8080 });
    expect(port.parse("0")).toEqual({
      ok: false,
      code: "OUT_OF_RANGE",
      message: "must be at least 1",
    });
    expect(port.parse("70000")).toEqual({
      ok: false,
      code: "OUT_OF_RANGE",
      message: "must be at most 65535",
    });
  });

  it("rejects values that overflow IEEE754 instead of returning Infinity", () => {
    expect(number().parse("9".repeat(400))).toEqual({
      ok: false,
      code: "INVALID",
      message: "must be a finite number",
    });
  });

  it("never includes the raw value in messages", () => {
    const result = number().parse("hunter2-secret");
    expect(JSON.stringify(result)).not.toContain("hunter2-secret");
  });
});

describe("number() presence configuration", () => {
  it("is required by default", () => {
    expect(number().optional).toBe(false);
    expect(number().default).toBeUndefined();
  });

  it("carries default and optional settings on the descriptor", () => {
    expect(number({ default: 3000 }).default).toBe(3000);
    expect(number({ optional: true }).optional).toBe(true);
  });
});

describe("number() construction-time default checks", () => {
  it("rejects a default below min", () => {
    expect(() => number({ default: 0, min: 1 })).toThrow(
      "env-validator: number() default must be at least 1",
    );
  });

  it("rejects a default above max", () => {
    expect(() => number({ default: 70000, max: 65535 })).toThrow(
      "env-validator: number() default must be at most 65535",
    );
  });

  it("accepts defaults exactly on the boundary", () => {
    expect(() => number({ default: 1, min: 1 })).not.toThrow();
    expect(() => number({ default: 65535, max: 65535 })).not.toThrow();
  });

  it("rejects a non-finite default", () => {
    expect(() => number({ default: Infinity })).toThrow(
      "env-validator: number() default must be a finite number",
    );
  });
});

describe("number() type inference", () => {
  it("infers exact validator types", () => {
    expectTypeOf(number()).toEqualTypeOf<Validator<number>>();
    expectTypeOf(number({ min: 1, max: 65535 })).toEqualTypeOf<
      Validator<number>
    >();
    // A default guarantees presence: not number | undefined (spec §32).
    expectTypeOf(number({ default: 3000 })).toEqualTypeOf<Validator<number>>();
    expectTypeOf(number({ optional: true })).toEqualTypeOf<
      Validator<number | undefined>
    >();
  });
});
