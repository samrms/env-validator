import { describe, expect, expectTypeOf, it } from "vitest";
import { EnvError, boolean, env, number, string } from "../src/index";

describe("env() happy path", () => {
  it("returns a typed config for valid input", () => {
    const config = env(
      { PORT: number(), HOST: string() },
      { PORT: "8080", HOST: "example.com" },
    );
    expect(config).toEqual({ PORT: 8080, HOST: "example.com" });
  });

  it("infers the config type end to end", () => {
    const config = env(
      {
        PORT: number({ default: 3000 }),
        DEBUG: boolean({ optional: true }),
      },
      {},
    );
    expectTypeOf(config).toEqualTypeOf<{
      PORT: number;
      DEBUG: boolean | undefined;
    }>();
    expect(config).toEqual({ PORT: 3000, DEBUG: undefined });
  });

  it("accepts process.env directly", () => {
    const previous = process.env.E2E_TEST_PORT;
    process.env.E2E_TEST_PORT = "8080";
    try {
      expect(env({ E2E_TEST_PORT: number() }, process.env)).toEqual({
        E2E_TEST_PORT: 8080,
      });
    } finally {
      if (previous === undefined) {
        delete process.env.E2E_TEST_PORT;
      } else {
        process.env.E2E_TEST_PORT = previous;
      }
    }
  });

  it("ignores unknown source keys", () => {
    expect(env({ PORT: number() }, { PORT: "1", EXTRA: "yes" })).toEqual({
      PORT: 1,
    });
  });

  it("never mutates the source", () => {
    const source = { PORT: "8080" };
    env({ PORT: number() }, source);
    expect(source).toEqual({ PORT: "8080" });
  });
});

describe("env() presence", () => {
  it("reports a missing required variable", () => {
    let caught: unknown;
    try {
      env({ PORT: number() }, {});
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(EnvError);
    expect((caught as EnvError).issues).toEqual([
      { key: "PORT", code: "MISSING", message: "is required" },
    ]);
  });

  it("uses the default when the variable is missing", () => {
    expect(env({ PORT: number({ default: 3000 }) }, {})).toEqual({
      PORT: 3000,
    });
  });

  it("treats a present empty string as present, not missing", () => {
    expect(env({ NAME: string() }, { NAME: "" })).toEqual({ NAME: "" });
  });

  it("parses a present empty string, so constraints can still reject it", () => {
    let caught: unknown;
    try {
      env({ NAME: string({ minLength: 1 }) }, { NAME: "" });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(EnvError);
    expect((caught as EnvError).issues).toEqual([
      {
        key: "NAME",
        code: "OUT_OF_RANGE",
        message: "must be at least 1 characters",
      },
    ]);
  });

  it("yields undefined for a missing optional variable", () => {
    const config = env({ LEGACY: string({ optional: true }) }, {});
    expect(config.LEGACY).toBeUndefined();
  });

  it("prefers the default over optional when both are set", () => {
    expect(
      env({ PORT: number({ default: 3000, optional: true }) }, {}),
    ).toEqual({ PORT: 3000 });
  });

  it("treats default: undefined as no default (still required)", () => {
    let caught: unknown;
    try {
      env({ PORT: number({ default: undefined }) }, {});
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(EnvError);
    expect((caught as EnvError).issues).toEqual([
      { key: "PORT", code: "MISSING", message: "is required" },
    ]);
  });
});

describe("env() invalid values", () => {
  it("throws one EnvError aggregating every failure in schema order", () => {
    let caught: unknown;
    try {
      env(
        { PORT: number(), FLAG: boolean(), NAME: string() },
        { PORT: "abc", FLAG: "yes" },
      );
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(EnvError);
    expect((caught as EnvError).issues).toEqual([
      { key: "PORT", code: "INVALID", message: "invalid number" },
      { key: "FLAG", code: "INVALID", message: "invalid boolean" },
      { key: "NAME", code: "MISSING", message: "is required" },
    ]);
  });

  it("keeps valid defaults out of the reported issues", () => {
    let caught: unknown;
    try {
      env({ MODE: string({ default: "dev" }), PORT: number() }, { PORT: "x" });
    } catch (error) {
      caught = error;
    }
    expect((caught as EnvError).issues).toEqual([
      { key: "PORT", code: "INVALID", message: "invalid number" },
    ]);
  });
});
