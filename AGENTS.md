# AGENTS.md

## Purpose

`env-validator` validates environment variables against a TypeScript schema and
returns a typed configuration object. It is a tiny, zero-runtime-dependency
library — not a configuration platform. It never loads `.env` files and never
touches I/O.

## Commands

- Package manager: **pnpm** (pinned via `packageManager` in package.json)
- Install: `pnpm install`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Format: `pnpm format:check` (fix with `pnpm format`)
- Test: `pnpm test`
- Build: `pnpm build`

After every meaningful change run, in order:
`pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`

## Architecture

```
src/index.ts   the public API is DEFINED here (every exported function and
               class), plus private module helpers
src/types.ts   all type definitions (public and internal)
```

The classes own all behavior; the factory functions (`string`, `number`,
`boolean`, `enumOf`, `url`) delegate to them so there is exactly one
implementation. Classes are generic over the output type `T`, which factories
instantiate with `Presence<O, ...>` — direct class use requires an explicit
`T` (e.g. `new StringValidator<string | undefined>({ optional: true })`).

Public API (the target exports of `src/index.ts`):
`env`, `Env`, `string`, `StringValidator`, `number`, `NumberValidator`,
`boolean`, `BooleanValidator`, `enumOf`, `EnumValidator`, `url`,
`UrlValidator`, `EnvError`, `EnvIssue`, `EnvErrorCode`, `EnvSource`.

## Rules

- Read the relevant files before modifying. Review the git diff before every
  commit.
- Run verification after changes. Do not claim success without executing the
  commands.
- Do not expand scope. Do not add features, options, or APIs beyond what
  DESIGN.md / README document.
- Prefer simple, explicit, boring code. Prefer deletion over abstraction.
- Do not weaken or delete tests. Every behavior change needs a test.
- Do not add speculative abstractions: no registries, pipelines, strategies,

  managers, or plugin systems. (The validator classes plus the delegating
  factory functions are required API, not speculative abstraction.)

- No barrel files: never add a module that exists only to re-export. The
  public API must be defined directly in `src/index.ts`, never as
  `export ... from` another module.
- Never run parallel edits or writes on the same file: concurrent
  modifications to one file race and corrupt it. Edit files sequentially.
- Runtime dependencies must stay **0**. Justify any new dev dependency.
- Security: never print or embed raw environment values in errors or messages;
  never mutate the source or `process.env`; no I/O, no network, no global
  mutable state in `src/`.
- Runtime behavior and TypeScript types must match exactly.
- Use small conventional commits. Never use destructive git commands. Never
  push or publish automatically.
