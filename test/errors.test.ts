import { describe, expect, expectTypeOf, it } from "vitest";
import { EnvError, env, number, string, url } from "../src/index";
import type { EnvIssue } from "../src/types";

describe("EnvError", () => {
  it("is an Error named EnvError carrying the issues array", () => {
    const issues: EnvIssue[] = [
      { key: "PORT", code: "MISSING", message: "is required" },
    ];
    const error = new EnvError(issues);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(EnvError);
    expect(error.name).toBe("EnvError");
    expect(error.issues).toEqual(issues);
    expectTypeOf(error.issues).toEqualTypeOf<EnvIssue[]>();
  });

  it("formats a single issue deterministically", () => {
    const error = new EnvError([
      { key: "PORT", code: "MISSING", message: "is required" },
    ]);
    expect(error.message).toBe(
      "env-validator: invalid environment: PORT: is required",
    );
  });

  it("aggregates multiple issues in order, joined deterministically", () => {
    const issues: EnvIssue[] = [
      { key: "PORT", code: "INVALID", message: "invalid number" },
      { key: "HOST", code: "MISSING", message: "is required" },
    ];
    const first = new EnvError(issues).message;
    const second = new EnvError(issues).message;
    expect(first).toBe(
      "env-validator: invalid environment: " +
        "PORT: invalid number; HOST: is required",
    );
    expect(second).toBe(first);
  });
});

describe("EnvError aggregation through env()", () => {
  it("produces the exact aggregated message", () => {
    let caught: unknown;
    try {
      env({ PORT: number(), HOST: string() }, { PORT: "abc" });
    } catch (error) {
      caught = error;
    }
    expect((caught as EnvError).message).toBe(
      "env-validator: invalid environment: " +
        "PORT: invalid number; HOST: is required",
    );
  });

  it("never includes raw values in the aggregated message", () => {
    const secret = "super-secret-token-value";
    let caught: unknown;
    try {
      env(
        {
          TOKEN: string({ maxLength: 5 }),
          ENDPOINT: url(),
        },
        { TOKEN: secret, ENDPOINT: `not a url ${secret}` },
      );
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(EnvError);
    expect((caught as EnvError).message).not.toContain(secret);
    expect(JSON.stringify(caught)).not.toContain(secret);
  });
});
