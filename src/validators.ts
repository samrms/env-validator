import type { EnvIssue } from "./errors";
import type { ParseResult, Presence, Validator } from "./types";

export type StringOptions = {
  minLength?: number;
  maxLength?: number;
  default?: string;
  optional?: true;
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

export type ResolveResult<T> =
  { ok: true; value: T } | { ok: false; issue: EnvIssue };

/**
 * Resolve one schema entry against one raw source value:
 * presence handling first (default / optional / missing), then parsing.
 */
export function resolve<T>(
  validator: Validator<T>,
  key: string,
  raw: string | undefined,
): ResolveResult<T> {
  if (raw === undefined) {
    if (validator.default !== undefined) {
      return { ok: true, value: validator.default };
    }
    if (validator.optional) {
      // Only optional validators take this path, so T includes undefined here.
      return { ok: true, value: undefined as T };
    }
    return {
      ok: false,
      issue: { key, code: "MISSING", message: "missing required value" },
    };
  }

  const result = validator.parse(raw);
  if (!result.ok) {
    return {
      ok: false,
      issue: { key, code: result.code, message: result.message },
    };
  }
  return { ok: true, value: result.value };
}
