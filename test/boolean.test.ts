import { describe, expect, expectTypeOf, it } from "vitest";
import { boolean } from "../src/index";
import type { Validator } from "../src/types";

describe("boolean() parsing", () => {
  it('parses exactly "true" and "false"', () => {
    expect(boolean().parse("true")).toEqual({ ok: true, value: true });
    expect(boolean().parse("false")).toEqual({ ok: true, value: false });
  });

  it("rejects every other representation", () => {
    const rejected = [
      "TRUE",
      "True",
      "False",
      "1",
      "0",
      "yes",
      "no",
      "",
      " true",
      "true ",
    ];
    for (const raw of rejected) {
      expect(boolean().parse(raw)).toEqual({
        ok: false,
        code: "INVALID",
        message: "invalid boolean",
      });
    }
  });

  it("never includes the raw value in messages", () => {
    const result = boolean().parse("not-a-boolean-secret");
    expect(JSON.stringify(result)).not.toContain("not-a-boolean-secret");
  });
});

describe("boolean() presence configuration", () => {
  it("is required by default", () => {
    expect(boolean().optional).toBe(false);
    expect(boolean().default).toBeUndefined();
  });

  it("carries a falsy default (false is a real default, not absence)", () => {
    expect(boolean({ default: false }).default).toBe(false);
    expect(boolean({ default: true }).default).toBe(true);
  });

  it("carries optional on the descriptor", () => {
    expect(boolean({ optional: true }).optional).toBe(true);
  });
});

describe("boolean() type inference", () => {
  it("infers exact validator types", () => {
    expectTypeOf(boolean()).toEqualTypeOf<Validator<boolean>>();
    expectTypeOf(boolean({ default: false })).toEqualTypeOf<
      Validator<boolean>
    >();
    expectTypeOf(boolean({ optional: true })).toEqualTypeOf<
      Validator<boolean | undefined>
    >();
  });
});
