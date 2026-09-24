import type { ParseResult, Presence, StringOptions, Validator } from "./types";

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
