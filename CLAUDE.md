# Mirrorball Madness

Fantasy sports app for Dancing with the Stars. Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Shadcn UI (base-nova style, built on Base UI), Supabase (Auth + Realtime + Postgres).

Schema: [supabase/schema.sql](supabase/schema.sql) is the source of truth — it's applied directly to the Supabase project via `psql` (no migration files/CLI linking yet). After any schema change, regenerate `src/lib/supabase/types.ts` so query results stay correctly typed:
```
npx supabase gen types typescript --project-id wssbwgtsejamlbvfofvu --schema public > src/lib/supabase/types.ts
```
(Needs a `SUPABASE_ACCESS_TOKEN` env var — a personal access token from supabase.com/dashboard/account/tokens — since this container has no Docker for the local-introspection path.)

Full concept and phased build plan live in conversation history until they're worth codifying here.

## Rules

- **Write clean code.** No dead code, no speculative abstractions, no comments explaining *what* code does — only *why*, when the reason isn't obvious from the code itself.
- **Respect the dev container setup.** This project runs inside `.devcontainer/devcontainer.json`. Don't work around it (e.g. installing global tools outside the container, hardcoding host-specific paths). If the container config itself needs to change (new port, new dependency), edit `devcontainer.json` rather than patching around the gap.
- **Never put API keys, secrets, or credentials in code files.** All secrets go in `.env.local` (already gitignored) and are read via `process.env`. If a new secret is introduced, add its key (not its value) to `.env.example` so the shape is documented without leaking anything.
- **Test changes before finishing.** Before considering a task done: run the dev server or build (`npm run build`) and confirm it succeeds, run lint, and exercise the actual feature path (not just "it compiles") when the change is user-facing.
- **Update project documentation as features are added.** Keep this file and any relevant docs (schema comments, README) in sync with what the app actually does — don't let them drift into describing a past version of the app.
