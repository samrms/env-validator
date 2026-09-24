import { describe, expectTypeOf, it } from "vitest";
import type {
  EnvErrorCode,
  EnvIssue,
  InferSchema,
  InferValidator,
  Presence,
  Schema,
  Validator,
} from "../src/types";

describe("InferValidator", () => {
  it("infers the output type of each validator shape", () => {
    expectTypeOf<InferValidator<Validator<string>>>().toEqualTypeOf<string>();
    expectTypeOf<InferValidator<Validator<number>>>().toEqualTypeOf<number>();
    expectTypeOf<InferValidator<Validator<boolean>>>().toEqualTypeOf<boolean>();
    expectTypeOf<InferValidator<Validator<"dev" | "prod">>>().toEqualTypeOf<
      "dev" | "prod"
    >();
    expectTypeOf<InferValidator<Validator<string | undefined>>>().toEqualTypeOf<
      string | undefined
    >();
  });
});

describe("InferSchema", () => {
  type Shape = {
    PORT: Validator<number>;
    DEBUG: Validator<boolean>;
    ENV: Validator<"dev" | "prod">;
    LEGACY: Validator<string | undefined>;
  };

  it("maps every schema key to its validator output type", () => {
    expectTypeOf<InferSchema<Shape>>().toEqualTypeOf<{
      PORT: number;
      DEBUG: boolean;
      ENV: "dev" | "prod";
      LEGACY: string | undefined;
    }>();
  });

  it("preserves literal unions instead of widening to string", () => {
    type Cfg = InferSchema<{ ENV: Validator<"dev" | "prod"> }>;

    // Widening to `string` would make this fail to compile.
    expectTypeOf<Cfg["ENV"]>().toEqualTypeOf<"dev" | "prod">();
  });

  it("catches wrong assignments", () => {
    const cfg = {} as InferSchema<{
      PORT: Validator<number>;
      ENV: Validator<"dev" | "prod">;
    }>;

    // @ts-expect-error PORT is a number, not a string
    const port: string = cfg.PORT;
    // @ts-expect-error ENV is a literal union, not a number
    const env: number = cfg.ENV;

    expectTypeOf(port).toEqualTypeOf<string>();
    expectTypeOf(env).toEqualTypeOf<number>();
  });

  it("only accepts validators as schema values", () => {
    // @ts-expect-error 123 is not a Validator
    const bad: Schema = { PORT: 123 };
    expectTypeOf(bad).toEqualTypeOf<Schema>();
  });
});

describe("Presence", () => {
  it("a default guarantees a present value", () => {
    expectTypeOf<Presence<{ default: 3000 }, number>>().toEqualTypeOf<number>();
    expectTypeOf<Presence<{ default: "x" }, string>>().toEqualTypeOf<string>();
  });

  it("optional: true allows undefined", () => {
    expectTypeOf<Presence<{ optional: true }, string>>().toEqualTypeOf<
      string | undefined
    >();
  });

  it("is required without default or optional", () => {
    // Empty options: a validator called with no arguments.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    expectTypeOf<Presence<{}, string>>().toEqualTypeOf<string>();
    expectTypeOf<Presence<{ minLength: 3 }, string>>().toEqualTypeOf<string>();
    // `default: undefined` is treated as no default: required at runtime too.
    expectTypeOf<
      Presence<{ default: undefined }, string>
    >().toEqualTypeOf<string>();
  });
});

describe("error types", () => {
  it("keeps the error code set exact", () => {
    expectTypeOf<EnvErrorCode>().toEqualTypeOf<
      "MISSING" | "INVALID" | "OUT_OF_RANGE"
    >();
    expectTypeOf<EnvIssue["key"]>().toEqualTypeOf<string>();
  });
});
