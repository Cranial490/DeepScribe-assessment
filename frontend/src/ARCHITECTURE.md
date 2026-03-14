# Frontend Structure

- `app/`: app-level composition and shell containers.
- `features/`: domain-oriented feature modules (`model`, `hooks`, `ui`).
- `components/ui/`: reusable design-system primitives.
- `shared/`: cross-feature types and utilities.

Guidelines:
- Keep business state in feature hooks/containers, not in presentational UI files.
- Type all props and event handlers explicitly.
- Prefer discriminated unions for UI states that branch on `kind`.
- Use `assertNever` for exhaustive switch checks.
