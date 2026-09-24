import { describe, expect, expectTypeOf, it } from "vitest";
import type { Validator } from "../src/types";
import { resolve, string } from "../src/validators";

describe("string() parsing", () => {
  it("returns valid strings unchanged", () => {
    expect(resolve(string(), "GREETING", "hello ")).toEqual({
      ok: true,
      value: "hello ",
    });
  });

  it("allows an empty string unless a constraint rejects it", () => {
    expect(resolve(string(), "MAYBE", "")).toEqual({ ok: true, value: "" });
    expect(resolve(string({ minLength: 1 }), "MAYBE", "")).toEqual({
      ok: false,
      issue: {
        key: "MAYBE",
        code: "OUT_OF_RANGE",
        message: "must be at least 1 characters",
      },
    });
  });

  it("enforces minLength at the boundary", () => {
    expect(resolve(string({ minLength: 3 }), "CODE", "abc")).toEqual({
      ok: true,
      value: "abc",
    });
    expect(resolve(string({ minLength: 3 }), "CODE", "ab")).toEqual({
      ok: false,
      issue: {
        key: "CODE",
        code: "OUT_OF_RANGE",
        message: "must be at least 3 characters",
      },
    });
  });

  it("enforces maxLength at the boundary", () => {
    expect(resolve(string({ maxLength: 5 }), "CODE", "abcde")).toEqual({
      ok: true,
      value: "abcde",
    });
    expect(resolve(string({ maxLength: 5 }), "CODE", "abcdef")).toEqual({
      ok: false,
      issue: {
        key: "CODE",
        code: "OUT_OF_RANGE",
        message: "must be at most 5 characters",
      },
    });
  });

  it("never includes the raw value in messages", () => {
    const result = resolve(
      string({ maxLength: 3 }),
      "TOKEN",
      "super-secret-value",
    );
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("super-secret-value");
  });
});

describe("string() presence", () => {
  it("a missing required variable is an issue", () => {
    expect(resolve(string(), "JWT_SECRET", undefined)).toEqual({
      ok: false,
      issue: {
        key: "JWT_SECRET",
        code: "MISSING",
        message: "missing required value",
      },
    });
  });

  it("a missing variable with a default uses the default", () => {
    expect(
      resolve(string({ default: "development" }), "NAME", undefined),
    ).toEqual({
      ok: true,
      value: "development",
    });
  });

  it("a present empty string is not treated as missing", () => {
    expect(resolve(string({ default: "dev" }), "NAME", "")).toEqual({
      ok: true,
      value: "",
    });
  });

  it("an optional variable may stay undefined", () => {
    expect(resolve(string({ optional: true }), "NAME", undefined)).toEqual({
      ok: true,
      value: undefined,
    });
  });

  it("default wins over optional", () => {
    expect(
      resolve(string({ default: "d", optional: true }), "NAME", undefined),
    ).toEqual({ ok: true, value: "d" });
  });

  it("treats an explicit `default: undefined` as no default (required)", () => {
    expect(resolve(string({ default: undefined }), "NAME", undefined)).toEqual({
      ok: false,
      issue: {
        key: "NAME",
        code: "MISSING",
        message: "missing required value",
      },
    });
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
