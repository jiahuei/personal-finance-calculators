# Modernize calculators and add YA 2022–2027 tax comparisons

## Summary

- Replaced the old page layouts with shared responsive styling, accessible navigation, and clear salary, retirement, home and photo credits pages.
- Fixed mobile input switching by formatting on blur without restoring selection or focus. Invalid numeric grouping remains visible for validation.
- Added shared resident tax calculations and year-specific pages through YA 2027, linked official sources, contribution and relief breakdowns, and a responsive same-income annual-tax graph for YA 2022–2027. YA 2027 is explicitly labelled a Budget proposal, with carried-forward assumptions documented.
- Corrected bonus EPF estimates, historical SOCSO/EIS wage ceilings, and EIS relief eligibility from YA 2022. Retirement estimates now support 0% returns and reject invalid planning horizons.
- Preserved existing calculator routes, added regression tests and run instructions, and removed unused tax, validation and cursor-formatting code.
- Kept the user-supplied AGENTS.md content unchanged. Its backend, Svelte and Docker guidance does not apply to this static repository.

## Verification

- `node --test tests/calculators.test.js`: passed 22 tests, including independent bracket totals, marginal-rate transitions, rebate boundaries, relief caps, bonus EPF, historical SOCSO/EIS, numeric parsing and retirement math. The initial sandboxed isolated runner failed because of restricted child processes; the standard command passed with escalated execution. `node --test --test-isolation=none tests/calculators.test.js` and `node tests/calculators.test.js` also passed.
- `LD_LIBRARY_PATH=/tmp/finance-browser-libs/extracted/usr/lib/x86_64-linux-gnu PLAYWRIGHT_BROWSERS_PATH=/tmp/finance-browsers PLAYWRIGHT_MODULE=/home/akk/.npm/_npx/4d28a6818d23920b/node_modules/playwright TEST_SCREENSHOTS=/tmp/finance-screenshots node tests/browser.test.cjs`: passed 403 browser assertions across 11 routes at 320, 375, 768 and 1440 pixels. Verified touch focus after editing, no selection restoration on blur, malformed input, year URL/value preservation, skip-link activation without losing edits, source links, graph updates, expanded-content overflow and retirement cases. No runtime or local resource errors occurred. Chromium and missing libraries were downloaded only into `/tmp`; the browser run used escalated execution and a local Python static server.
- Desktop and mobile screenshots of the home, tax, retirement and photo credits pages were saved under `/tmp/finance-screenshots`; desktop/mobile visual review passed. Physical iOS Safari was not available, so mobile checks used Chromium touch emulation.
- `for file in calc/*.js tests/*.js tests/*.cjs; do node --check "$file" || exit; done`: passed syntax checks for all application and test JavaScript.
- `npx prettier --write AGENTS.md README.md index.html photo-credits.html style.css 'calc/*.{html,js}' 'tests/*.{js,cjs}' tasks/todo.md`: applied repository formatting to affected files; AGENTS.md was unchanged. Final follow-up formatting covered review fixes and this record.
- `npx prettier --version`: used Prettier 3.9.10 with `.prettierrc.json`. No `.github/workflows/lint.yml` or package-defined formatter version exists.
- `npx prettier --check AGENTS.md README.md index.html photo-credits.html style.css 'calc/*.{html,js}' 'tests/*.{js,cjs}' 'tasks/*.md'`: passed for all changed files.
- `npx prettier --check .`: reported one pre-existing formatting issue in `.vscode/python.json.code-snippets`. The narrow check `npx prettier --check .vscode/python.json.code-snippets` reproduced that issue; `git diff -- .vscode/python.json.code-snippets` confirmed the file was untouched. It was left unchanged under the repository’s instruction to avoid unrelated formatting.
- `git diff --check`: passed.
- Backend, Ruff, Svelte, ESLint and Docker commands were not run: their directories, configurations, dependencies and lint workflow are absent from this repository. No site deployment was performed.
