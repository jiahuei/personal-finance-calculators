# Ringgit / tools

A static personal finance website for Malaysia: resident income tax and take-home salary estimates for YA 2020–2027, a same-income tax comparison for YA 2022–2027, and a retirement income calculator. No build step, accounts, analytics, or runtime dependencies. Calculations happen in the browser.

## Run locally

From this directory:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open <http://127.0.0.1:8000>. Use the assessment-year selector to compare years, or open a specific year with `calc/take-home-salary-tax.html?ya=2025`. Results update as you change inputs.

## Formatting

The [linting workflow](.github/workflows/lint.yml) checks formatting on pushes and pull requests using Node 24 and the pinned Prettier development dependency. Run the same commands locally:

```sh
npm ci
npm run format:check
```

Use `npm exec -- prettier --write <changed-files>` to format changed files, or `npm run format` to format the whole repository. Prettier follows `.prettierrc.json`; `.prettierignore` excludes nested reference repositories, installed dependencies and generated files. The website still runs without installing development tools.

## Tests

Calculation and input-validation tests use Node’s built-in test runner (Node 18+):

```sh
node --test tests/calculators.test.js
```

In environments that restrict child processes, use `node tests/calculators.test.js`, or `node --test --test-isolation=none tests/calculators.test.js` with a recent Node release. Tests cover independently calculated tax bracket endpoints, rebate boundaries, relief caps, bonus EPF, historical SOCSO/EIS ceilings and relief eligibility, malformed numbers, and retirement annuity/zero-return cases.

The optional browser suite needs Playwright and Chromium. Keep test dependencies outside the site if preferred:

```sh
npm install --prefix /tmp/ringgit-browser-tests playwright@1.58.2
/tmp/ringgit-browser-tests/node_modules/.bin/playwright install chromium
PLAYWRIGHT_MODULE=/tmp/ringgit-browser-tests/node_modules/playwright node tests/browser.test.cjs
```

Run the local server first. If your OS lacks browser libraries, follow Playwright’s platform dependency setup. `TEST_BASE_URL` overrides the server URL; `TEST_SCREENSHOTS` saves screenshots to a chosen directory. The suite checks all 6 routes at 320, 375, 768 and 1440 pixels, including expanded tables, mobile touch/focus, live recalculation for every control, the salary slider in both directions, blur-rounding consistency, the monthly and annual breakdown columns, accessible annual allocation values, zero-income and excess-payment states, the 20-year EPF illustration, the custom select caret, year-specific URLs, updated charts, source links, validation, and retirement results. Mobile emulation verifies browser behavior; physical iOS Safari remains a separate device check.

## Published site and PR previews

The [Pages workflow](.github/workflows/pages.yml) publishes the current remote `main` site at the project root and each open same-repository pull request at `pr-preview/<number>/`. A successful deployment creates or updates one PR comment with the preview URL and exact source commit. Closing a PR removes its snapshot and updates its existing comment after the next successful deployment. Fork PRs do not receive hosted previews.

GitHub Pages must use GitHub Actions as its publishing source. The `github-pages` environment must permit the intended main and same-repository PR workflow refs.

Packaging and comment regression tests use Node and Git without extra dependencies:

```sh
node --test tests/pages-preview.test.cjs
```

These tests verify production/preview separation, project-relative assets, API pagination, closed and fork PR handling, path/symlink safety and stable comment updates.

## Implementation specification

[SPEC.md](SPEC.md) documents the repository structure, calculator behavior, tax rules and retirement assumptions, and Pages deployment contracts. In particular, YA 2027 is a Budget proposal; see the [tax rules and assumptions](SPEC.md#tax-rules-and-assumptions) before interpreting estimates. [AGENTS.md](AGENTS.md) covers contributor workflow and verification.

Licensed under [GPL-3.0](LICENSE). Image attribution is preserved on the photo credits page.
