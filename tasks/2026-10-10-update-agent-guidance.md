# Update agent guidance for the static calculator repository

## Summary

- Updated AGENTS.md to describe the actual files, static server, Node tests, optional Playwright setup and Prettier configuration.
- Removed instructions for absent backend, Svelte, Docker and Ruff tooling, and unsupported release-tag conventions.
- Aligned plan tracking and lessons with the existing proportional-work rules, and specified JSDoc comments for JavaScript test intentions. Core principles and unrelated guidance remain intact.

## Verification

- `npx prettier --write AGENTS.md tasks/2026-10-10-update-agent-guidance.md`: applied repository formatting.
- `npx prettier --check AGENTS.md tasks/2026-10-10-update-agent-guidance.md`: passed.
- `npx prettier --check .`: reported the existing formatting issue in untouched `.vscode/python.json.code-snippets`; no unrelated formatting was applied.
- `git diff --check`: passed.
- Application tests were not rerun because only documentation changed.
