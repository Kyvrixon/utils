# @kyvrixon/utils — CLAUDE.md

## Project Overview

A personal TypeScript utility library published to npm as `@kyvrixon/utils`. Designed exclusively for the **Bun runtime**. Ships raw TypeScript source — no build step.

- **Package**: `@kyvrixon/utils` (public, MIT)
- **Runtime**: Bun `1.3.11`
- **Language**: TypeScript (strict, ESNext, bundler module resolution)
- **Linter/Formatter**: Biome `2.4.6`
- **Package manager**: `bun` (exact installs via `bunfig.toml`)

## Branch Strategy

- `main` — stable/published branch
- `dev` — active development branch (Renovate targets this)
- PRs merge `dev` → `main` before publishing

## Key Scripts

```bash
bun test                  # run all tests
bun test --only-failures  # CI mode (used in GitHub Actions)
bun run pretty            # format with Biome
bun run pub               # publish to npm (bun publish --access public)
```

## Project Structure

```
src/
  index.ts                          # barrel — re-exports everything
  lib/
    formatSeconds.ts                # calendar-aware duration formatter
    toOrdinal.ts                    # ordinal number suffix (1st, 2nd…)
    discord-utils/
      Command.ts                    # DiscordCommand<C> class
      Event.ts                      # DiscordEvent<V, T, K> class
      createPagination.ts           # DiscordPagination class (Components V2 paginator)
    modules/
      LoggerModule.ts               # chalk-based structured logger
tests/
  formatSeconds.test.ts
  toOrdinal.test.ts
  modules/LoggerModule.test.ts
```

## Source Modules

### `formatSeconds(seconds, options?)`
Calendar-aware duration formatter. Accepts raw seconds, returns a human-readable string.
- `format`: `"long"` (default) or `"short"`
- `onlyUnits`: filter to specific time units (`"y" | "mo" | "w" | "d" | "h" | "m" | "s" | "ms"`)
- `includeZeroUnits`: show units even when zero
- `customFormatter`: override per-unit rendering

### `toOrdinal(n)`
Converts a number to its English ordinal string using `Intl.PluralRules`. Handles edge cases: teens (11th/12th/13th), zero, negatives, infinities.

### `DiscordCommand<C extends Client>`
Class wrapping a discord.js slash command with `data`, `execute`, and optional `autocomplete` handlers. Generic over the bot's client type.

### `DiscordEvent<V, T, K>`
Class wrapping a discord.js event handler. Supports three event types:
- `"client"` — standard `ClientEvents`
- `"rest"` — `RestEvents`
- `"custom"` — user-defined events via **module augmentation** on `DiscordEventCustomType`

Custom event example:
```ts
declare module "@kyvrixon/utils" {
  interface DiscordEventCustomType {
    myEvent: [data: string];
  }
}
```

### `DiscordPagination`
Discord **Components V2** paginator (`IsComponentsV2` flag). Renders a `ContainerBuilder`-based layout with Prev/Next/page-jump buttons. Collector expires after 60 seconds.
- Construct with `new DiscordPagination(list, structure, options?)`, then call `.send(interaction)`
- `structure` is an array of page layouts using sentinel values `DiscordPagination.DATA` (paginated entries) and `DiscordPagination.BUTTONS` (navigation row)
- Uses `randomUUIDv7()` (Bun built-in) for unique button ID prefixes
- `entriesPerPage`: default 5
- `replacements`: key-value pairs replaced in rendered content
- `styling`: per-page `accent_color`/`spoiler` overrides
- `ephemeral`: whether the pagination message is ephemeral

### `LoggerModule`
Chalk-based logger class with levels: `notif`, `alert`, `error`, `debug`.
- All methods accept a `raw?: boolean` flag — returns the formatted string instead of printing
- `error(m, e?)` — pass an optional `Error` to log its stack trace
- Stack traces are sanitized: `node_modules` frames are stripped, paths normalized
- `divider(text)` — prints a centered `─` divider line
- Timestamp format: `[Day HH:mm:ss.ms]` (en-AU locale, 24h)

## Code Style

Enforced by Biome — run `bun run pretty` before committing:
- **Indent**: tabs
- **Quotes**: double quotes for JS/TS strings
- **Linter**: Biome recommended rules
- Import organization: disabled (organizeImports is off)

## Testing

Tests use `bun:test` (built-in). Test files mirror `src/` structure under `tests/`.
- No mocking of external services — `LoggerModule` tests spy on `console.*`
- CI runs on every push via GitHub Actions (`bun test --only-failures`)

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| `chalk` | 5.6.2 | Terminal colors in `LoggerModule` |
| `discord.js` | 14.25.1 | Types and builders for discord utilities |

## Publishing

```bash
bun run pub   # publishes src/ as-is (no compiled output)
```

The package ships `src/` directly. Consumers must use Bun (or a bundler that handles `.ts` imports). Entry point and types both point to `./src/index.ts`.

## Renovate

Auto-dependency updates are configured in `renovate.json`, targeting the `dev` branch. All update types are scheduled "at any time". PRs are assigned/reviewed by `Kyvrixon`.
