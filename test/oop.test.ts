import { describe, expect, expectTypeOf, it } from "vitest";
import {
  BooleanValidator,
  EnumValidator,
  Env,
  EnvError,
  NumberValidator,
  StringValidator,
  UrlValidator,
  boolean,
  enumOf,
  env,
  number,
  string,
  url,
} from "../src/index";

describe("factories delegate to validator classes", () => {
  it("returns class instances", () => {
    expect(string()).toBeInstanceOf(StringValidator);
    expect(number()).toBeInstanceOf(NumberValidator);
    expect(boolean()).toBeInstanceOf(BooleanValidator);
    expect(enumOf(["a", "b"])).toBeInstanceOf(EnumValidator);
    expect(url()).toBeInstanceOf(UrlValidator);
  });
});

describe("validator classes", () => {
  it("parse and carry presence configuration", () => {
    const name = new StringValidator<string>({ minLength: 2 });
    expect(name.parse("ab")).toEqual({ ok: true, value: "ab" });
    expect(name.parse("a")).toEqual({
      ok: false,
      code: "OUT_OF_RANGE",
      message: "must be at least 2 characters",
    });
    expect(name.optional).toBe(false);

    const port = new NumberValidator<number | undefined>({ optional: true });
    expect(port.parse("8080")).toEqual({ ok: true, value: 8080 });
    expect(port.optional).toBe(true);
    expect(port.default).toBeUndefined();

    expect(new BooleanValidator<boolean>().parse("true")).toEqual({
      ok: true,
      value: true,
    });
    expect(new UrlValidator<string>().parse("https://example.com")).toEqual({
      ok: true,
      value: "https://example.com",
    });
    expect(new EnumValidator<"a" | "b">(["a", "b"]).parse("a")).toEqual({
      ok: true,
      value: "a",
    });
  });

  it("fails fast on schema bugs", () => {
    expect(
      () => new StringValidator<string>({ default: "x", minLength: 2 }),
    ).toThrow("env-validator: string() default must be at least 2 characters");
    expect(() => new EnumValidator<string>([])).toThrow(
      "env-validator: enumOf() requires at least one value",
    );
  });

  it("class instances work in env() schemas with exact inference", () => {
    const config = env(
      {
        NAME: new StringValidator<string | undefined>({ optional: true }),
        MODE: new EnumValidator<"dev" | "prod">(["dev", "prod"], {
          default: "dev",
        }),
      },
      {},
    );
    expectTypeOf(config).toEqualTypeOf<{
      NAME: string | undefined;
      MODE: "dev" | "prod";
    }>();
    expect(config).toEqual({ MODE: "dev" });
  });
});

describe("Env", () => {
  it("validates a schema against a source", () => {
    const validator = new Env({ PORT: number({ default: 3000 }) });
    expect(validator.schema.PORT).toBeInstanceOf(NumberValidator);
    expect(validator.validate({})).toEqual({ PORT: 3000 });
  });

  it("infers the config type", () => {
    const validator = new Env({
      PORT: number({ default: 3000 }),
      DEBUG: boolean({ optional: true }),
    });
    const config = validator.validate({});
    expectTypeOf(config).toEqualTypeOf<{
      PORT: number;
      DEBUG: boolean | undefined;
    }>();
  });

  it("throws EnvError aggregating every failure", () => {
    const validator = new Env({ PORT: number() });
    let caught: unknown;
    try {
      validator.validate({});
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(EnvError);
    expect((caught as EnvError).issues).toEqual([
      { key: "PORT", code: "MISSING", message: "is required" },
    ]);
  });
});
