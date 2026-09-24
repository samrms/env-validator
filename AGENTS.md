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
src/types.ts      Validator<T>, schema + inference types, EnvSource
src/validators.ts string(), number(), boolean(), enumOf(), url(), shared resolve()
src/env.ts        env(): schema × source -> typed config, error aggregation
src/errors.ts     EnvError, EnvIssue, EnvErrorCode, message formatting
src/index.ts      public exports only
```

Public API (the only things exported from `src/index.ts`):
`env`, `string`, `number`, `boolean`, `enumOf`, `url`, `EnvError`, `EnvIssue`,
`EnvErrorCode`, `EnvSource`.

## Rules

- Read the relevant files before modifying. Review the git diff before every
  commit.
- Run verification after changes. Do not claim success without executing the
  commands.
- Do not expand scope. Do not add features, options, or APIs beyond what
  DESIGN.md / README document.
- Prefer simple, explicit, boring code. Prefer deletion over abstraction.
- Do not weaken or delete tests. Every behavior change needs a test.
- Do not add speculative abstractions: no factories, registries, pipelines,
  strategies, managers, or plugin systems.
- Runtime dependencies must stay **0**. Justify any new dev dependency.
- Security: never print or embed raw environment values in errors or messages;
  never mutate the source or `process.env`; no I/O, no network, no global
  mutable state in `src/`.
- Runtime behavior and TypeScript types must match exactly.
- Use small conventional commits. Never use destructive git commands. Never
  push or publish automatically.
