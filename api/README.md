# Api

## Setup

1. Install dependencies

```bash
bun install
```

2. Create env file

```bash
cp .env.example .env.development
```

3. Start local Postgres (dev)

```bash
bun run docker:db:up
```

4. Apply migrations

```bash
bun run db:migrate
```

5. Seed initial data (optional but recommended for first run)

```bash
bun run db:seed
```

6. Start development server

```bash
bun run dev
```

## Testing

1. Start local Postgres (test)

```bash
bun run docker:test-db:up
```

2. Test project

```bash
bun run test
```

## Useful DB scripts

- `bun run db:generate` - generate a new migration after schema changes
- `bun run db:migrate` - apply pending migrations
- `bun run db:seed` - seed data
- `bun run db:studio` - open Drizzle Studio
- `bun run docker:db:stop` / `bun run docker:db:start` - stop/start dev DB container
- `bun run docker:db:down` - stop and remove dev DB container
- `bun run docker:test-db:stop` / `bun run docker:test-db:start` - stop/start test DB container
- `bun run docker:test-db:down` - stop and remove test DB container
- `bun run docker:test-db:reset` - remove test DB container and volumes (fresh state)
