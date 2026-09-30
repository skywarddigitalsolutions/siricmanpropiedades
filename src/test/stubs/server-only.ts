// Empty module stub for the `server-only` package under Vitest.
//
// The real `server-only` package throws when imported outside Next.js's
// `react-server` condition, which Vitest does not set. This stub replaces it
// via `resolve.alias` in `vitest.config.ts` so modules that `import "server-only"`
// can still be unit tested with plain Vitest/Node.
export {};
