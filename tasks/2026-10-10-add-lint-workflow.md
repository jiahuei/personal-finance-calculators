# Add repository formatting checks

## Summary

- Added a formatting workflow for branch pushes and pull requests with pinned GitHub actions, Node 24, read-only repository permissions, cancellation of superseded runs and a two-minute timeout.
- Added a private development manifest and lockfile pinning Prettier 3.8.3, preserving the existing formatting configuration and excluding reference repositories, dependencies and generated files.
- Formatted the existing VS Code snippet so repository-wide checks pass and documented the workflow commands in README and agent guidance.

## Verification

- `npm ci`: passed with Node 24.21.0; installed the locked development dependency.
- `npm exec -- prettier --write .github/workflows/lint.yml package.json .vscode/python.json.code-snippets AGENTS.md README.md`: passed; only the previously unformatted editor snippet required changes.
- `npm run format:check`: initially reported the existing editor snippet, then passed after formatting it.
- `node tests/calculators.test.js`: all 22 tests passed with Node 24.21.0.
- `python3 -` with PyYAML: parsed the workflow and verified triggers, permissions, concurrency, timeout, pinned actions and CI commands.
- `git diff --check`: passed.
- `actionlint .github/workflows/lint.yml`: not run because actionlint is unavailable; GitHub Actions execution awaits the requested PR update.
