# Ringgit / tools

A static personal finance website for Malaysia: resident income tax and take-home salary estimates for YA 2020–2027, a same-income tax comparison for YA 2022–2027, and a retirement income calculator. No build step, accounts, analytics, or runtime dependencies. Calculations happen in the browser.

## Run locally

From this directory:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open <http://127.0.0.1:8000>. One salary and tax page serves every assessment year: it opens on the newest enacted year, and `calc/take-home-salary-tax.html?ya=2025` opens a specific year. Results and the year comparison recalculate as soon as any input changes, so there is no calculate button. Monthly salary also has a slider for quick exploration, which covers RM 1,000 to RM 3,000,000 on a logarithmic scale so ordinary salaries are still easy to reach; the typed amount remains authoritative and may fall outside that range. Selecting another assessment year retains your entered values and updates the `?ya=` query; reloading starts with the defaults for that year.

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

The workflow runs on pushes to `main`, PR opening, reopening, new commits and closing, or manual dispatch. Runs share the `pages` concurrency group and do not cancel an active deployment. Every run reads current API refs so a delayed event cannot restore an older main site or closed preview. Only the configured runtime paths in `scripts/pages-preview.json` are copied from regular Git blobs; no PR build scripts run, and repository tooling, dependencies and internal references are not published.

GitHub Pages must use GitHub Actions as its publishing source. The `github-pages` environment must permit the intended main and same-repository PR workflow refs. Deployment permissions are isolated from the packaging and comment jobs. Preview comments run only after deployment succeeds.

Packaging and comment regression tests use Node and Git without extra dependencies:

```sh
node --test tests/pages-preview.test.cjs
```

These tests verify production/preview separation, project-relative assets, API pagination, closed and fork PR handling, path/symlink safety and stable comment updates. `_site/` is generated output and is ignored by Git and Prettier.

## Tax rules and assumptions

Reviewed **10 October 2026**. Source links and assumptions also appear within each calculator.

- YA 2020–2025 resident progressive schedules come from [HASiL](https://www.hasil.gov.my/en/individu/kadar-cukai/). YA 2026 continues the schedule in HASiL’s [2026 MTD specification](https://www.hasil.gov.my/media/arvlrzh5/spesifikasi-kaedah-pengiraan-berkomputer-pcb-2026.pdf).
- **YA 2027 is a Budget proposal**, based on the [9 October 2026 Budget speech](https://www.pmo.gov.my/en/speeches-en/speech-the-fifth-madani-budget-2027-by-yab-pm/), paragraphs 29–30. It models RM 12,000 personal relief, 18% on the RM 70,000–100,000 band, 24% on RM 100,000–150,000, and 30% above RM 1 million. Unmentioned bands and relief caps are carried forward. This estimate must be revisited when final legislation and HASiL guidance are available. The graph marks it with a dashed segment.
- The model assumes a Malaysian resident employee under 60 earning a constant monthly salary for 12 months, plus a bonus expressed in salary months. It does not model non-resident rates, joint assessment, spouse rebates, zakat, or special tax regimes.
- Automatic reliefs include personal relief (RM 9,000 through YA 2026), employee EPF capped at RM 4,000, and PRS/deferred annuity capped at RM 3,000. Other reliefs are a user-supplied eligible annual total; check the selected year’s limits in the [HASiL relief guide](https://www.hasil.gov.my/en/individu/pelepasan-cukai/). The [Budget 2025 tax measures](https://belanjawan.mof.gov.my/pdf/belanjawan2025/ucapan/tax-measure.pdf), Appendix 4, extend PRS relief through YA 2030.
- SOCSO relief is capped at RM 250 in YA 2020–2021 and excludes EIS. From YA 2022, the combined SOCSO/EIS cap is RM 350; see the [Budget 2022 tax measures](https://belanjawan.mof.gov.my/pdf/2022/ucapan/bs22.pdf). Employee contributions follow the standard [PERKESO bands](https://www.perkeso.gov.my/en/rate-of-contribution.html). The wage ceiling is RM 4,000 until August 2022, RM 5,000 from September 2022, and RM 6,000 from October 2024. Optional LINDUNG 24 Jam contributions are excluded.
- EPF is a percentage estimate on salary and bonus. Users enter their actual average annual employee/employer rates, including historical changes. Actual payroll uses [KWSP’s contribution schedule](https://www.kwsp.gov.my/en/employer/responsibilities/mandatory-contribution) and rounding. Employer EPF increases your savings and leaves cash deductions unchanged.
- The RM 400 personal rebate applies when chargeable income is at most RM 35,000 and is capped at tax charged; see [MIDA’s policy booklet](https://www.mida.gov.my/wp-content/uploads/2021/04/BOOKLET-1-GENERAL-POLICIES-FACILITIES-AND-GUIDELINES.pdf). “Without tax reliefs” also excludes this rebate.
- PRS cash payments are deducted in full from take-home cash even when the relief is capped or switched off. Monthly outputs are annual averages, including bonus, rather than actual PCB or payslip amounts.
- The comparison holds salary, bonus, entered EPF rates, PRS and other reliefs constant; automatic reliefs, contribution ceilings and tax bands follow each year. Users must confirm that their other reliefs qualify in all comparison years.
- The EPF illustration projects 20 years of unchanged annual contributions deposited at year end at an assumed 5% annual return, which is not guaranteed.
- The bar under the monthly take-home figure splits gross income into take-home pay, employee EPF, income tax, and SOCSO, EIS and PRS payments. The visible legend gives each colour’s annual amount and share, also available in hover titles. When payments exceed income or gross income is zero, the share bar is hidden and an explanation accompanies the signed annual amounts.
- The “Where your money goes” breakdown lists each amount per month and per year. Its monthly column divides the annual amount by 12, so it is an average rather than an actual payslip deduction; SOCSO and EIS follow monthly wage bands, and PRS is paid when you choose to pay it.

## Retirement assumptions

Preserves the original equal annual withdrawal model: savings stay invested, a fixed amount is drawn at the start of each year, and that annual amount is divided by 12 to display a monthly budget. At 0% return, savings are divided evenly across the retirement period. The model does not account for inflation, fluctuating returns, taxes, unexpected expenses, or a reserved ending balance.

## Code

- `style.css`: shared responsive design.
- `calc/main.js`: shared number formatting, navigation/footer and retirement math.
- `calc/tax-engine.js`: year-specific rules and pure calculations, also importable by Node tests.
- `calc/tax-app.js`: common tax interface, validation, breakdowns, the salary slider, sources and responsive SVG chart.
- `calc/retirement-app.js`: retirement interface and validation.
- `calc/take-home-salary-tax.html`: the single salary and tax page, reading its assessment year from the `?ya=` query.

Licensed under [GPL-3.0](LICENSE). Image attribution is preserved on the photo credits page.
