<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# RevuPing conventions

- Preserve the completed web design, route locations, CSS and mock behavior when organizing code.
- Web features live in `apps/web/src/features`; demo fixtures/state in `src/data-access`; reusable presentation in `src/components`. `@/` is app-local.
- Admin remains a starter. API has configuration, health transport and database/Redis foundations; do not imply implemented authentication, authorized business storage or integrations.
- Applications never import each other. Extract `packages/` libraries only for concrete consumers, use workspace package dependencies, public exports and platform/type tags.
- Browser source cannot import server packages or `src/server`. Future Next server modules must import `server-only` and stay behind server entry points.
- Use Node 24.20.x, pnpm 11.25.0 and the frozen pnpm lockfile. Never commit local environment files or credentials.
- Verify with `pnpm check` and `pnpm build` (build sequentially). For route/interaction changes run `pnpm e2e:web`; detailed existing flows use `PROTOTYPE_URL=http://localhost:3000 pnpm nx run web:product-check` against running web.
- Run `pnpm nx graph` after changing project dependencies. CI uses affected checks for PRs and full checks on main/manual runs.
