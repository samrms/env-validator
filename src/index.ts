import type {
  BooleanOptions,
  EnumOptions,
  EnvErrorCode,
  EnvIssue,
  EnvSource,
  InferSchema,
  NumberOptions,
  ParseResult,
  Presence,
  Schema,
  StringOptions,
  UrlOptions,
  Validator,
} from "./types";

// Public contract types: inputs, options, schemas, and error shapes.
// Inference machinery (Validator, ParseResult, Presence, InferSchema) stays
// internal on purpose — naming those types erases the literal inference.
export type {
  BooleanOptions,
  EnumOptions,
  EnvErrorCode,
  EnvIssue,
  EnvSource,
  NumberOptions,
  Schema,
  StringOptions,
  UrlOptions,
};

function checkLength(
  value: string,
  minLength: number | undefined,
  maxLength: number | undefined,
): string | null {
  if (minLength !== undefined && value.length < minLength) {
    return `must be at least ${minLength} characters`;
  }
  if (maxLength !== undefined && value.length > maxLength) {
    return `must be at most ${maxLength} characters`;
  }
  return null;
}

export class StringValidator<
  T extends string | undefined,
> implements Validator<T> {
  readonly optional: boolean;
  readonly default?: T;
  private readonly minLength: number | undefined;
  private readonly maxLength: number | undefined;

  constructor(options?: StringOptions) {
    const minLength = options?.minLength;
    const maxLength = options?.maxLength;
    const defaultValue = options?.default;

    // A default that violates its own constraints is a schema bug: fail fast,
    // before any environment is read.
    if (defaultValue !== undefined) {
      const message = checkLength(defaultValue, minLength, maxLength);
      if (message !== null) {
        throw new Error(`env-validator: string() default ${message}`);
      }
    }

    this.minLength = minLength;
    this.maxLength = maxLength;
    this.optional = options?.optional === true;
    if (defaultValue !== undefined) {
      // T matches the presence implied by options; factories infer it exactly.
      this.default = defaultValue as T;
    }
  }

  parse(raw: string): ParseResult<T> {
    const message = checkLength(raw, this.minLength, this.maxLength);
    if (message !== null) {
      return { ok: false, code: "OUT_OF_RANGE", message };
    }
    return { ok: true, value: raw as T };
  }
}

export function string<O extends StringOptions>(
  options?: O,
): Validator<Presence<O, string>> {
  return new StringValidator<Presence<O, string>>(options);
}

// Numeric grammar: optional sign, one or more digits, optional decimal part.
// No whitespace, no exponent, no hex, no "123abc" prefixes, no Infinity/NaN.
const NUMBER_PATTERN = /^[+-]?\d+(\.\d+)?$/;

function checkNumber(
  value: number,
  min: number | undefined,
  max: number | undefined,
): { message: string; code: EnvErrorCode } | null {
  if (!Number.isFinite(value)) {
    return { message: "must be a finite number", code: "INVALID" };
  }
  if (min !== undefined && value < min) {
    return { message: `must be at least ${min}`, code: "OUT_OF_RANGE" };
  }
  if (max !== undefined && value > max) {
    return { message: `must be at most ${max}`, code: "OUT_OF_RANGE" };
  }
  return null;
}

export class NumberValidator<
  T extends number | undefined,
> implements Validator<T> {
  readonly optional: boolean;
  readonly default?: T;
  private readonly min: number | undefined;
  private readonly max: number | undefined;

  constructor(options?: NumberOptions) {
    const min = options?.min;
    const max = options?.max;
    const defaultValue = options?.default;

    // A default that violates its own constraints is a schema bug: fail fast,
    // before any environment is read.
    if (defaultValue !== undefined) {
      const failure = checkNumber(defaultValue, min, max);
      if (failure !== null) {
        throw new Error(`env-validator: number() default ${failure.message}`);
      }
    }

    this.min = min;
    this.max = max;
    this.optional = options?.optional === true;
    if (defaultValue !== undefined) {
      // T matches the presence implied by options; factories infer it exactly.
      this.default = defaultValue as T;
    }
  }

  parse(raw: string): ParseResult<T> {
    if (!NUMBER_PATTERN.test(raw)) {
      return { ok: false, code: "INVALID", message: "invalid number" };
    }
    const value = Number(raw);
    const failure = checkNumber(value, this.min, this.max);
    if (failure !== null) {
      return { ok: false, ...failure };
    }
    return { ok: true, value: value as T };
  }
}

export function number<O extends NumberOptions>(
  options?: O,
): Validator<Presence<O, number>> {
  return new NumberValidator<Presence<O, number>>(options);
}

// Exactly "true" and "false" are accepted — no Boolean() truthiness, no case
// folding, no 1/0/yes.
export class BooleanValidator<
  T extends boolean | undefined,
> implements Validator<T> {
  readonly optional: boolean;
  readonly default?: T;

  constructor(options?: BooleanOptions) {
    const defaultValue = options?.default;

    this.optional = options?.optional === true;
    if (defaultValue !== undefined) {
      // T matches the presence implied by options; factories infer it exactly.
      this.default = defaultValue as T;
    }
  }

  parse(raw: string): ParseResult<T> {
    if (raw === "true") {
      return { ok: true, value: true as T };
    }
    if (raw === "false") {
      return { ok: true, value: false as T };
    }
    return { ok: false, code: "INVALID", message: "invalid boolean" };
  }
}

export function boolean<O extends BooleanOptions>(
  options?: O,
): Validator<Presence<O, boolean>> {
  return new BooleanValidator<Presence<O, boolean>>(options);
}

export class EnumValidator<
  T extends string | undefined,
> implements Validator<T> {
  readonly optional: boolean;
  readonly default?: T;
  private readonly values: readonly string[];

  constructor(values: readonly string[], options?: EnumOptions<string>) {
    const defaultValue = options?.default;

    // Schema bugs fail fast, before any environment is read.
    if (values.length === 0) {
      throw new Error("env-validator: enumOf() requires at least one value");
    }
    if (defaultValue !== undefined && !values.includes(defaultValue)) {
      throw new Error(
        "env-validator: enumOf() default must be one of the allowed values",
      );
    }

    this.values = values;
    this.optional = options?.optional === true;
    if (defaultValue !== undefined) {
      // T matches the presence implied by options; factories infer it exactly.
      this.default = defaultValue as T;
    }
  }

  parse(raw: string): ParseResult<T> {
    if (this.values.includes(raw)) {
      // Membership in the allowed list proved by includes().
      return { ok: true, value: raw as T };
    }
    return { ok: false, code: "INVALID", message: "invalid value" };
  }
}

export function enumOf<
  const V extends readonly string[],
  const O extends EnumOptions<V[number]>,
>(values: V, options?: O): Validator<Presence<O, V[number]>> {
  return new EnumValidator<Presence<O, V[number]>>(values, options);
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// The WHATWG parser decides validity; the raw input is returned unchanged.
// Failure messages are static on purpose: Node's Invalid URL exception
// embeds the input, and raw environment values must never reach output.
export class UrlValidator<
  T extends string | undefined,
> implements Validator<T> {
  readonly optional: boolean;
  readonly default?: T;

  constructor(options?: UrlOptions) {
    const defaultValue = options?.default;

    // A default that violates its own constraints is a schema bug: fail fast,
    // before any environment is read.
    if (defaultValue !== undefined && !isValidUrl(defaultValue)) {
      throw new Error("env-validator: url() default must be a valid URL");
    }

    this.optional = options?.optional === true;
    if (defaultValue !== undefined) {
      // T matches the presence implied by options; factories infer it exactly.
      this.default = defaultValue as T;
    }
  }

  parse(raw: string): ParseResult<T> {
    if (!isValidUrl(raw)) {
      return { ok: false, code: "INVALID", message: "invalid URL" };
    }
    return { ok: true, value: raw as T };
  }
}

export function url<O extends UrlOptions>(
  options?: O,
): Validator<Presence<O, string>> {
  return new UrlValidator<Presence<O, string>>(options);
}

export class EnvError extends Error {
  readonly issues: EnvIssue[];

  constructor(issues: EnvIssue[]) {
    super(
      `env-validator: invalid environment: ${issues
        .map((issue) => `${issue.key}: ${issue.message}`)
        .join("; ")}`,
    );
    this.name = "EnvError";
    this.issues = issues;
  }
}

function resolve(
  schema: Schema,
  source: EnvSource,
): { config: Record<string, unknown>; issues: EnvIssue[] } {
  const config: Record<string, unknown> = {};
  const issues: EnvIssue[] = [];

  for (const [key, validator] of Object.entries(schema)) {
    const raw = source[key];
    if (raw === undefined) {
      // Missing: a default fills the gap, optional stays undefined,
      // otherwise the variable is reported.
      if (validator.default !== undefined) {
        config[key] = validator.default;
      } else if (!validator.optional) {
        issues.push({ key, code: "MISSING", message: "is required" });
      }
    } else {
      // Present — including a present empty string, which is parsed, never
      // treated as missing.
      const result = validator.parse(raw);
      if (result.ok) {
        config[key] = result.value;
      } else {
        issues.push({ key, code: result.code, message: result.message });
      }
    }
  }

  return { config, issues };
}

export function env<S extends Schema>(
  schema: S,
  source: EnvSource,
): InferSchema<S> {
  const { config, issues } = resolve(schema, source);
  if (issues.length > 0) {
    throw new EnvError(issues);
  }
  return config as InferSchema<S>;
}

export class Env<S extends Schema> {
  constructor(readonly schema: S) {}

  validate(source: EnvSource): InferSchema<S> {
    return env(this.schema, source);
  }
}
