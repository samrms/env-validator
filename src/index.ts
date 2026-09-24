import type {
  EnvErrorCode,
  NumberOptions,
  ParseResult,
  Presence,
  StringOptions,
  Validator,
} from "./types";

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

export function string<O extends StringOptions>(
  options?: O,
): Validator<Presence<O, string>> {
  const minLength = options?.minLength;
  const maxLength = options?.maxLength;
  const defaultValue = options?.default;
  const optional = options?.optional;

  // A default that violates its own constraints is a schema bug: fail fast,
  // before any environment is read.
  if (defaultValue !== undefined) {
    const message = checkLength(defaultValue, minLength, maxLength);
    if (message !== null) {
      throw new Error(`env-validator: string() default ${message}`);
    }
  }

  const validator: Validator<string> = {
    optional: optional === true,
    ...(defaultValue !== undefined ? { default: defaultValue } : {}),
    parse(raw): ParseResult<string> {
      const message = checkLength(raw, minLength, maxLength);
      if (message !== null) {
        return { ok: false, code: "OUT_OF_RANGE", message };
      }
      return { ok: true, value: raw };
    },
  };

  // Presence<O, string> is either `string` or `string | undefined`,
  // and Validator<string> satisfies both.
  return validator as Validator<Presence<O, string>>;
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

export function number<O extends NumberOptions>(
  options?: O,
): Validator<Presence<O, number>> {
  const min = options?.min;
  const max = options?.max;
  const defaultValue = options?.default;
  const optional = options?.optional;

  // A default that violates its own constraints is a schema bug: fail fast,
  // before any environment is read.
  if (defaultValue !== undefined) {
    const failure = checkNumber(defaultValue, min, max);
    if (failure !== null) {
      throw new Error(`env-validator: number() default ${failure.message}`);
    }
  }

  const validator: Validator<number> = {
    optional: optional === true,
    ...(defaultValue !== undefined ? { default: defaultValue } : {}),
    parse(raw): ParseResult<number> {
      if (!NUMBER_PATTERN.test(raw)) {
        return { ok: false, code: "INVALID", message: "invalid number" };
      }
      const value = Number(raw);
      const failure = checkNumber(value, min, max);
      if (failure !== null) {
        return { ok: false, ...failure };
      }
      return { ok: true, value };
    },
  };

  // Presence<O, number> is either `number` or `number | undefined`,
  // and Validator<number> satisfies both.
  return validator as Validator<Presence<O, number>>;
}
