import { describe, expect, expectTypeOf, it } from "vitest";
import { url } from "../src/index";
import type { Validator } from "../src/types";

describe("url() parsing", () => {
  it("accepts absolute URLs and returns the raw input unchanged", () => {
    expect(url().parse("https://example.com")).toEqual({
      ok: true,
      value: "https://example.com",
    });
    expect(url().parse("http://localhost:3000/path?q=1#hash")).toEqual({
      ok: true,
      value: "http://localhost:3000/path?q=1#hash",
    });
  });

  it("returns the raw input, not the normalized URL", () => {
    expect(url().parse("HTTPS://Example.COM/")).toEqual({
      ok: true,
      value: "HTTPS://Example.COM/",
    });
  });

  it("rejects unparseable input with a static message", () => {
    for (const raw of ["not a url", "", "example.com"]) {
      expect(url().parse(raw)).toEqual({
        ok: false,
        code: "INVALID",
        message: "invalid URL",
      });
    }
  });

  it("never includes the raw value in messages (F-02)", () => {
    // Node's Invalid URL exception embeds the input; the static message must
    // be used instead of the platform exception text.
    const result = url().parse("not-a-url-secret-token");
    expect(JSON.stringify(result)).not.toContain("not-a-url-secret-token");
  });
});

describe("url() construction-time default checks", () => {
  it("rejects an invalid default", () => {
    expect(() => url({ default: "not a url" })).toThrow(
      "env-validator: url() default must be a valid URL",
    );
  });

  it("accepts and carries a valid default", () => {
    expect(url({ default: "https://example.com" }).default).toBe(
      "https://example.com",
    );
  });
});

describe("url() presence configuration", () => {
  it("is required by default", () => {
    expect(url().optional).toBe(false);
    expect(url().default).toBeUndefined();
  });

  it("carries optional on the descriptor", () => {
    expect(url({ optional: true }).optional).toBe(true);
  });
});

describe("url() type inference", () => {
  it("infers exact validator types", () => {
    expectTypeOf(url()).toEqualTypeOf<Validator<string>>();
    expectTypeOf(url({ default: "https://example.com" })).toEqualTypeOf<
      Validator<string>
    >();
    expectTypeOf(url({ optional: true })).toEqualTypeOf<
      Validator<string | undefined>
    >();
  });
});
