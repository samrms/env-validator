import type { EnvErrorCode } from "./errors";

/** Explicit source of environment values, e.g. `process.env`. Never mutated. */
export type EnvSource = Record<string, string | undefined>;

/** Result of parsing a raw value that is present in the source. */
export type ParseResult<T> =
  { ok: true; value: T } | { ok: false; code: EnvErrorCode; message: string };

/**
 * A validator. `parse` is only ever called with a present raw value
 * (never `undefined`); presence handling happens in `resolve`.
 */
export interface Validator<T> {
  parse(raw: string): ParseResult<T>;
  /** Value used when the variable is missing, if any. */
  readonly default?: T;
  /** True when the variable may stay undefined. */
  readonly optional: boolean;
}

/** A schema maps environment variable names to validators. */
export type Schema = Record<string, Validator<unknown>>;

/**
 * Effective output type derived from a validator's options:
 * a default guarantees a value, `optional: true` allows undefined,
 * otherwise the variable is required.
 */
export type Presence<O, T> = O extends { default: T }
  ? T
  : O extends { optional: true }
    ? T | undefined
    : T;

/** Output type of a single validator. */
export type InferValidator<V> = V extends Validator<infer T> ? T : never;

/** Output type of a whole schema: the typed configuration object. */
export type InferSchema<S extends Schema> = {
  [K in keyof S]: InferValidator<S[K]>;
};
