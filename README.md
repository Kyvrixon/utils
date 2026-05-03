# @kyvrixon/utils

General utility library designed for use with the [Bun runtime](https://bun.sh/) and [discord.js](https://discord.js.org/).

## Installation

```bash
bun install @kyvrixon/utils
```

## Features

- **LoggerModule**: Chalk-based structured logger with timestamped, color-coded output.
- **DiscordPagination**: Powerful paginator supporting both Components V2 (containers) and Embeds.
- **formatSeconds**: Calendar-aware duration formatter with localization and rounding support.
- **toOrdinal**: Converts numbers to English ordinal strings (e.g., 1st, 2nd).
- **DiscordCommand**: Wrapper for slash and context menu commands.
- **DiscordEvent**: Wrapper for discord.js events (client, rest, and custom).
- **Utils**: Collection of common helper functions (`truncate`, `chunk`, `isLink`, `randomInt`, `sleep`).

## Usage

### Logger

```ts
import { LoggerModule } from "@kyvrixon/utils";

const logger = new LoggerModule({ name: "App", level: "DEBUG" });
logger.notif("Starting application...");
logger.error(new Error("Something went wrong"));
```

### Pagination

```ts
import { DiscordPagination } from "@kyvrixon/utils";

const items = ["Item 1", "Item 2", "Item 3", ...];
const pagination = new DiscordPagination(items, {
    type: "container",
    layout: [
        "# My List",
        DiscordPagination.DATA,
        DiscordPagination.BUTTONS
    ],
    showSkipButtons: true
});

await pagination.send(message);
```

### Duration Formatting

```ts
import { formatSeconds } from "@kyvrixon/utils";

formatSeconds(3661); // "1 hour, 1 minute, and 1 second"
formatSeconds(3661, { format: "short" }); // "1h 1m 1s"
```

## License

MIT
