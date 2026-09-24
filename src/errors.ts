/** Category of a validation failure. Kept small on purpose. */
export type EnvErrorCode = "MISSING" | "INVALID" | "OUT_OF_RANGE";

/**
 * One validation failure for one variable.
 * `message` never contains the raw environment value.
 */
export type EnvIssue = {
  key: string;
  code: EnvErrorCode;
  message: string;
};
