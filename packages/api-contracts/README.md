# API contracts

Platform-neutral public health/error schemas and an opt-in Fetch client shared by API, Next.js and Expo. Zod validates wire responses and public API URLs. No database models, secrets, Nest services, framework UI, server state cache or authentication are exported.

Use only the package root (`api-contracts`), via an explicit `workspace:*` dependency. Nx builds the CommonJS runtime before dependents; Metro can consume the `react-native` source entry. See [backend foundation](../../docs/BACKEND_FOUNDATION.md) for configuration, ownership and the next phases.
