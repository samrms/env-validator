import { describe, expect, expectTypeOf, it } from "vitest";
import { string } from "../src/index";
import type { Validator } from "../src/types";

describe("string() parsing", () => {
  it("returns valid strings unchanged", () => {
    expect(string().parse("hello ")).toEqual({ ok: true, value: "hello " });
  });

  it("allows an empty string unless a constraint rejects it", () => {
    expect(string().parse("")).toEqual({ ok: true, value: "" });
    expect(string({ minLength: 1 }).parse("")).toEqual({
      ok: false,
      code: "OUT_OF_RANGE",
      message: "must be at least 1 characters",
    });
  });

  it("enforces minLength at the boundary", () => {
    expect(string({ minLength: 3 }).parse("abc")).toEqual({
      ok: true,
      value: "abc",
    });
    expect(string({ minLength: 3 }).parse("ab")).toEqual({
      ok: false,
      code: "OUT_OF_RANGE",
      message: "must be at least 3 characters",
    });
  });

  it("enforces maxLength at the boundary", () => {
    expect(string({ maxLength: 5 }).parse("abcde")).toEqual({
      ok: true,
      value: "abcde",
    });
    expect(string({ maxLength: 5 }).parse("abcdef")).toEqual({
      ok: false,
      code: "OUT_OF_RANGE",
      message: "must be at most 5 characters",
    });
  });

  it("never includes the raw value in messages", () => {
    const result = string({ maxLength: 3 }).parse("super-secret-value");
    expect(JSON.stringify(result)).not.toContain("super-secret-value");
  });
});

describe("string() presence configuration", () => {
  it("is required by default", () => {
    expect(string().optional).toBe(false);
    expect(string().default).toBeUndefined();
  });

  it("carries default and optional settings on the descriptor", () => {
    expect(string({ default: "dev" }).default).toBe("dev");
    expect(string({ optional: true }).optional).toBe(true);
  });
});

describe("string() construction-time default checks", () => {
  it("rejects a default below minLength", () => {
    expect(() => string({ default: "ab", minLength: 3 })).toThrow(
      "env-validator: string() default must be at least 3 characters",
    );
  });

  it("rejects a default above maxLength", () => {
    expect(() => string({ default: "abcdef", maxLength: 5 })).toThrow(
      "env-validator: string() default must be at most 5 characters",
    );
  });

  it("accepts a default exactly on the boundary", () => {
    expect(() => string({ default: "abc", minLength: 3 })).not.toThrow();
    expect(() => string({ default: "abc", maxLength: 3 })).not.toThrow();
  });
});

describe("string() type inference", () => {
  it("infers exact validator types", () => {
    expectTypeOf(string()).toEqualTypeOf<Validator<string>>();
    expectTypeOf(string({ minLength: 3 })).toEqualTypeOf<Validator<string>>();
    expectTypeOf(string({ default: "dev" })).toEqualTypeOf<Validator<string>>();
    expectTypeOf(string({ optional: true })).toEqualTypeOf<
      Validator<string | undefined>
    >();
  });
});
