# Implementation specification

This document defines the calculator behavior, calculation assumptions and deployment contracts. See [README.md](README.md) for usage, local setup and test commands, and [AGENTS.md](AGENTS.md) for contributor workflow. Update this specification when implementation behavior changes.

## Architecture

This is a static HTML/CSS/JavaScript site with no build step or runtime dependencies. Calculations happen in the browser; the site has no accounts or analytics.

### Repository structure

```text
.
├── index.html         # Calculator home page
├── photo-credits.html # Image attribution
├── style.css          # Shared responsive styling
├── calc/              # Calculator pages, applications and calculation engine
├── img/               # Project photographs
├── tests/             # Node calculation and optional Playwright browser tests
├── scripts/           # Pages snapshot packaging, comments and runtime-path configuration
├── tasks/             # Local, untracked plans and dated completion records
├── .github/workflows/ # Formatting checks and Pages production/PR deployments
├── package.json       # Pinned development-only formatting dependency
├── .prettierrc.json    # Formatting configuration
├── AGENTS.md          # Contributor workflow and coding guidance
├── README.md          # Local setup, usage and tests
└── SPEC.md            # Implementation contracts and calculation assumptions
```

### Application modules

- `style.css`: shared responsive design.
- `calc/main.js`: shared number formatting, navigation/footer and retirement math.
- `calc/tax-engine.js`: year-specific rules and pure calculations, also importable by Node tests.
- `calc/tax-app.js`: common tax interface, validation, breakdowns, the salary slider, sources and responsive SVG chart.
- `calc/retirement-app.js`: retirement interface and validation.
- `calc/take-home-salary-tax.html`: the single salary and tax page, reading its assessment year from the `?ya=` query.

## Calculator interface

One salary and tax page serves every assessment year: it opens on the newest enacted year, and `calc/take-home-salary-tax.html?ya=2025` opens a specific year. Results and the year comparison recalculate as soon as any input changes, so there is no calculate button. Monthly salary also has a slider for quick exploration, which covers RM 1,000 to RM 3,000,000 on a logarithmic scale so ordinary salaries are still easy to reach; the typed amount remains authoritative and may fall outside that range. Selecting another assessment year retains your entered values and updates the `?ya=` query; reloading starts with the defaults for that year.

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

## Pages deployment

The [Pages workflow](.github/workflows/pages.yml) deploys the current remote `main` at the site root and open same-repository PR snapshots under `pr-preview/<number>/`. Preserve that separation. Fork PR previews are excluded.

The workflow runs on pushes to `main`, PR opening, reopening, new commits and closing, or manual dispatch. Runs share the `pages` concurrency group and do not cancel an active deployment. Every run reads current API refs so a delayed event cannot restore an older main site or closed preview. Only the configured runtime paths in `scripts/pages-preview.json` are copied from regular Git blobs; no PR build scripts run, and repository tooling, dependencies and internal references are not published.

Deployment permissions are isolated from the packaging and comment jobs. Publish preview comments only after successful deployment. Rebuild from current refs and reconcile closed-preview comments on each successful run, since a newer queued Pages event can replace an earlier close event. Successful deployment creates or updates one comment per PR with the preview URL and exact source commit; closing a PR removes its snapshot and updates its existing comment after the next successful deployment.

`_site/` is generated output and is ignored by Git and Prettier.
