# Project Guidelines

## i18n

All user-facing strings must go through the i18n system in `src/lib/i18n/`.

- Never hardcode display strings in components or pages.
- Add every new string to **both** the `en` and `nl` translation sets in `src/lib/i18n/translations.ts`.
- Use the `$t` store (imported from `$lib/i18n`) to reference strings in Svelte files.
- Pluralization belongs in `translations.ts` as a function `(count: number) => string`.