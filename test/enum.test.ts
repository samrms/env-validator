import { describe, expect, expectTypeOf, it } from "vitest";
import { enumOf } from "../src/index";
import type { Validator } from "../src/types";

const NODE_ENV = ["development", "test", "production"] as const;

describe("enumOf() parsing", () => {
  it("accepts the first, middle, and last value", () => {
    expect(enumOf(NODE_ENV).parse("development")).toEqual({
      ok: true,
      value: "development",
    });
    expect(enumOf(NODE_ENV).parse("test")).toEqual({ ok: true, value: "test" });
    expect(enumOf(NODE_ENV).parse("production")).toEqual({
      ok: true,
      value: "production",
    });
  });

  it("rejects a value outside the list", () => {
    expect(enumOf(NODE_ENV).parse("staging")).toEqual({
      ok: false,
      code: "INVALID",
      message: "invalid value",
    });
  });

  it("never includes the raw value in messages", () => {
    const result = enumOf(NODE_ENV).parse("secret-stage-name");
    expect(JSON.stringify(result)).not.toContain("secret-stage-name");
  });
});

describe("enumOf() construction-time checks", () => {
  it("rejects an empty value list", () => {
    expect(() => enumOf([])).toThrow(
      "env-validator: enumOf() requires at least one value",
    );
  });

  it("rejects a default that is not an allowed value", () => {
    // Simulates an untyped (JavaScript) caller bypassing the type system.
    expect(() =>
      enumOf(["yes", "no"] as string[], { default: "maybe" }),
    ).toThrow(
      "env-validator: enumOf() default must be one of the allowed values",
    );
  });

  it("accepts a default that is an allowed value", () => {
    expect(() => enumOf(NODE_ENV, { default: "test" })).not.toThrow();
    expect(enumOf(NODE_ENV, { default: "test" }).default).toBe("test");
  });
});

describe("enumOf() presence configuration", () => {
  it("is required by default", () => {
    expect(enumOf(NODE_ENV).optional).toBe(false);
    expect(enumOf(NODE_ENV).default).toBeUndefined();
  });

  it("carries optional on the descriptor", () => {
    expect(enumOf(NODE_ENV, { optional: true }).optional).toBe(true);
  });
});

describe("enumOf() type inference", () => {
  it("preserves the literal union without requiring as const", () => {
    expectTypeOf(enumOf(["dev", "prod"])).toEqualTypeOf<
      Validator<"dev" | "prod">
    >();
    expectTypeOf(enumOf(["development", "test", "production"])).toEqualTypeOf<
      Validator<"development" | "test" | "production">
    >();
  });

  it("a default guarantees the literal union, not | undefined", () => {
    expectTypeOf(enumOf(NODE_ENV, { default: "test" })).toEqualTypeOf<
      Validator<"development" | "test" | "production">
    >();
  });

  it("default combined with optional still guarantees the union", () => {
    // Regression test: the default branch must win over the optional branch.
    expectTypeOf(
      enumOf(NODE_ENV, { default: "test", optional: true }),
    ).toEqualTypeOf<Validator<"development" | "test" | "production">>();
    expectTypeOf(enumOf(NODE_ENV, { optional: true })).toEqualTypeOf<
      Validator<"development" | "test" | "production" | undefined>
    >();
  });
});
