# env-validator

Validate environment variables against a TypeScript schema and return a typed
configuration object. Zero runtime dependencies.

```ts
import { env, number, string, boolean, enumOf } from "env-validator";

const cfg = env(
  {
    PORT: number({ min: 1, max: 65535, default: 3000 }),
    DEBUG: boolean({ optional: true }),
    ENV: enumOf(["dev", "prod", "test"], { default: "dev" }),
    NAME: string({ minLength: 1 }),
  },
  process.env,
);
// cfg.PORT is number; cfg.DEBUG is boolean | undefined; cfg.ENV is "dev" | "prod" | "test"
```

The factory functions (`string`, `number`, etc.) delegate to the class
implementations (`StringValidator`, `NumberValidator`, etc.). Direct class
instantiation requires an explicit `T` (e.g. `new StringValidator<string | undefined>`).
