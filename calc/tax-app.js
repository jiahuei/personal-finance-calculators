"use strict"
const fmt = (value) =>
  new Intl.NumberFormat("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    value,
  )
const rm = (value) => `RM ${fmt(value)}`
const el = (id) => document.getElementById(id)
const source = TaxEngine.sources
let selectedYear = Number(document.body.dataset.year)
function field(id, label, value, unit, help = "", max = "") {
  const percent = unit === "%" || unit === "months"
  return `<div class="field"><label for="${id}">${label}</label><div class="input-wrap ${percent ? "percent" : ""}">${!percent ? `<span class="prefix" aria-hidden="true">${unit}</span>` : ""}<input id="${id}" name="${id}" type="text" inputmode="decimal" value="${value}" data-max="${max}" required ${help ? `aria-describedby="${id}Help"` : ""}>${percent ? `<span class="suffix" aria-hidden="true">${unit}</span>` : ""}</div>${help ? `<p class="help" id="${id}Help">${help}</p>` : ""}</div>`
}
el("main").insertAdjacentHTML(
  "beforeend",
  `
  <p class="breadcrumb"><a href="index.html">All calculators</a> <span aria-hidden="true"> / </span> Salary &amp; tax</p>
  <header class="page-heading"><p class="eyebrow">Your income, understood</p><h1>Make sense of your salary.</h1><p class="intro">From gross pay to what’s yours. Estimate your Malaysian income tax and see how it changes through the years.</p></header>
  <div class="workspace"><section class="panel" aria-labelledby="input-title"><div class="panel-heading"><h2 id="input-title"><span class="step">01</span> Your details</h2><span class="badge">Malaysian tax resident</span></div>
    <form id="tax-form"><div class="field"><label for="assessmentYear">Year of assessment</label><select id="assessmentYear" name="assessmentYear">${TaxEngine.years
      .slice()
      .reverse()
      .map(
        (year) =>
          `<option value="${year}" ${year === selectedYear ? "selected" : ""}>YA ${year}${year === 2027 ? " · Budget proposal" : ""}</option>`,
      )
      .join(
        "",
      )}</select><p class="help">The year you earn the income, usually filed in the following year.</p></div>
    <div class="notice" id="proposal-notice" ${selectedYear !== 2027 ? "hidden" : ""}><strong>YA 2027 · Budget proposal</strong><br>Models the proposed RM 12,000 personal relief, 18% and 24% bands, and 30% above RM 1 million. Other rules are carried forward. Subject to legislation and final HASiL guidance. <a href="${source.budget2027}">Budget 2027 speech ↗</a></div>
    <fieldset class="form-section"><legend>Income</legend><div class="field-grid">${field("salary", "Monthly salary", "7,500.00", "RM", "Include taxable fixed allowances.")}${field("bonus", "Annual bonus", "0.00", "months", "Bonus as a multiple of monthly salary.")}</div></fieldset>
    <fieldset class="form-section"><legend>Contributions</legend><div class="field-grid">${field("employeeRate", "Employee EPF rate", "11.00", "%", "Use your actual average rate for this year.", 100)}${field("employerRate", "Employer EPF rate", "12.00", "%", "Use your employer’s applicable rate.", 100)}</div><label class="check-row"><input id="social" type="checkbox" checked> Include employee SOCSO &amp; EIS (under 60)</label><p class="help">Standard contributions; excludes optional LINDUNG 24 Jam. EPF is estimated on salary and bonus. Historical EPF rates may vary within a year.</p></fieldset>
    <fieldset class="form-section"><legend>Annual tax reliefs</legend><div class="field-grid">${field("prs", "PRS / deferred annuity paid", "0.00", "RM", "Full annual payment; relief capped at RM 3,000.")}${field("otherReliefs", "Other eligible reliefs", "0.00", "RM", "Enter your eligible total for the selected YA. Exclude personal, EPF, PRS and SOCSO/EIS reliefs already included.")}</div><p class="help">Check each year’s limits in the <a href="${source.reliefs}">HASiL relief guide ↗</a>.</p></fieldset>
    <label class="check-row"><input id="ignoreReliefs" type="checkbox"> Compare without tax reliefs or the personal rebate</label>
    <p class="error" id="form-error" role="alert" hidden></p><button type="submit" class="button wide">Calculate take-home pay <span aria-hidden="true">→</span></button><p class="privacy">No account. No data sent. Just your numbers.</p></form></section>
  <div class="results-column"><section class="result-panel" aria-labelledby="result-title"><p class="eyebrow" id="result-title">02 · Your estimate <span id="result-year"></span></p><p class="result-label">Average monthly take-home</p><div class="amount"><span class="currency">RM</span><span id="monthly-net">—</span></div><p class="result-sub"><span id="annual-net">—</span> per year, including bonus</p><div class="allocation" aria-hidden="true"><span class="net" id="net-bar"></span><span class="epf" id="epf-bar"></span><span class="tax" id="tax-bar"></span><span class="other" id="other-bar"></span></div><div class="result-stats"><div><p>Annual income tax</p><strong id="annual-tax">—</strong></div><div><p>Effective tax rate</p><strong id="effective-rate">—</strong></div><div><p>Employee EPF / year</p><strong id="annual-epf">—</strong></div><div><p>Tax / month, averaged</p><strong id="monthly-tax">—</strong></div></div><p class="result-note" id="result-status" role="status" aria-live="polite">Based on the details entered.</p></section>
  <section class="panel breakdown"><h3>Where your money goes</h3><div id="pay-breakdown"></div><p class="subtle-note">Monthly figures are annual averages, not a PCB deduction or a payslip. PRS payments are deducted from available cash.</p></section></div></div>
  <section class="panel section-block"><details id="calculation-details"><summary>Behind the numbers · tax &amp; EPF breakdown</summary><div class="source-grid"><div><h3>From income to tax</h3><div id="tax-breakdown"></div></div><div><h3>Your EPF savings</h3><div id="epf-breakdown"></div><p class="subtle-note">The 30-year illustration assumes unchanged annual contributions deposited at year end and 5% annual returns. Returns are not guaranteed.</p></div></div><div class="table-scroll section-block"><table><caption id="bracket-caption"></caption><thead><tr><th scope="col">Chargeable income band (RM)</th><th scope="col">Rate</th><th scope="col">Tax in band (RM)</th></tr></thead><tbody id="bracket-rows"></tbody></table></div></details></section>
  <section class="panel section-block" aria-labelledby="sources-title"><details><summary id="sources-title">Sources &amp; calculation assumptions</summary><div class="source-grid"><div><a href="${source.rates}">HASiL · YA 2020–2025 tax rates ↗</a><p>Progressive resident individual tax schedules, including the change from YA 2023.</p><a href="${source.mtd2026}">HASiL · 2026 calculation specification ↗</a><p>YA 2026 uses the continuing resident bands in the 2026 MTD specification.</p></div><div><a href="${source.budget2027}">Prime Minister’s Office · Budget 2027 ↗</a><p>Speech of 9 October 2026, paragraphs 29–30. YA 2027 estimates apply the announced changes, with unmentioned bands and relief caps carried forward. This is a proposal, not a final tax schedule.</p></div><div><a href="${source.reliefs}">HASiL · reliefs by assessment year ↗</a><p>Automatically includes personal relief, employee EPF up to RM 4,000, PRS up to RM 3,000 and SOCSO/EIS contributions up to RM 350 from YA 2022, or SOCSO alone up to RM 250 in YA 2020–2021. Other reliefs must be entered within the applicable annual limits.</p><a href="${source.socialRelief2022}">Ministry of Finance · 2022 SOCSO/EIS relief change ↗</a><a href="${source.prs}">Ministry of Finance · PRS extension ↗</a><p>Budget 2025 tax measures, Appendix 4: extension through YA 2030.</p></div><div><a href="${source.rebate}">MIDA · resident individual tax rebate ↗</a><p>RM 400 personal rebate for chargeable income up to RM 35,000, capped at tax charged. Joint assessment, spouse rebates, zakat and special tax regimes are not modelled.</p></div><div><a href="${source.socso}">PERKESO · contribution schedules ↗</a><p>Standard employee SOCSO and EIS bands. Annual estimates account for the September 2022 and October 2024 wage-ceiling changes. Excludes optional LINDUNG 24 Jam contributions.</p><a href="${source.socso2022}">PERKESO · September 2022 circular ↗</a></div><div><a href="${source.epf}">KWSP · mandatory contributions ↗</a><p>EPF is a percentage estimate on salary and bonus, using your entered rates. Actual contributions follow KWSP’s statutory schedule and rounding. Employer contributions do not reduce take-home pay.</p></div></div><p class="subtle-note">Reviewed 10 October 2026. Assumes a full year of constant employment income for a Malaysian resident individual under 60. Other reliefs are an eligible amount you supply, not an automatic eligibility assessment. Estimates are for planning and are not tax advice.</p></details></section>
  <section class="panel chart-panel" aria-labelledby="comparison-title"><div class="panel-heading"><h2 id="comparison-title">Same income. Different years.</h2><span class="badge">YA 2022–2027</span></div><p class="intro" id="comparison-description"></p><div class="chart-key"><span>Published rules</span><span class="proposal">2027 budget proposal</span></div><div id="tax-chart"></div><p class="chart-summary" id="comparison-summary"></p><p class="subtle-note">Salary, bonus, EPF rates, PRS payments and other entered reliefs stay constant. Automatic reliefs and tax bands follow each YA. Check that your other reliefs qualify in every year. Dashed segment: proposed YA 2027 rules.</p><details class="chart-table" open><summary>View exact yearly amounts</summary><div class="table-scroll"><table><caption>Same-income comparison, after eligible personal rebate</caption><thead><tr><th scope="col">Assessment year</th><th scope="col">Chargeable income</th><th scope="col">Annual tax</th><th scope="col">Effective rate</th></tr></thead><tbody id="comparison-rows"></tbody></table></div></details></section>`,
)
addNavBarBrand()
addNavBarEnd()
addFooter()
const numericKeys = ["salary", "bonus", "employeeRate", "employerRate", "prs", "otherReliefs"]
for (const key of numericKeys) {
  // Formatting never touches selection or focuses an input while it loses focus.
  formatInputOnBlur(el(key), (value) => {
    const parsed = parseNonNegativeNumber(value)
    return value.trim() && Number.isFinite(parsed) && parsed >= 0 ? fmt(parsed) : value
  })
}
function readInput() {
  const input = {}
  for (const key of numericKeys) {
    const control = el(key)
    const raw = control.value.trim()
    const parsed = parseNonNegativeNumber(raw)
    const valid =
      Number.isFinite(parsed) &&
      parsed >= 0 &&
      (control.dataset.max === "" || parsed <= Number(control.dataset.max))
    control.setAttribute("aria-invalid", String(!valid))
    if (!valid)
      throw new Error(
        `Enter a valid non-negative number for ${control.labels[0].textContent.toLowerCase()}${control.dataset.max ? ` (maximum ${control.dataset.max})` : ""}.`,
      )
    input[key] = parsed
  }
  input.ignoreReliefs = el("ignoreReliefs").checked
  input.social = el("social").checked
  return input
}
function rows(target, values) {
  el(target).innerHTML = values
    .map(
      ([name, value, total]) =>
        `<div class="data-row ${total ? "total" : ""}"><span>${name}</span><strong>${rm(value)}</strong></div>`,
    )
    .join("")
}
let chartResults = []
function renderChart(results) {
  chartResults = results
  const width = Math.max(240, el("tax-chart").clientWidth),
    compact = width < 500
  const height = compact ? 250 : 290,
    left = compact ? 48 : 76,
    right = 26,
    top = 40,
    bottom = 44
  const maximum = Math.max(100, ...results.map((r) => r.annualTax)) * 1.25
  const x = (i) => left + (i * (width - left - right)) / (results.length - 1)
  const y = (value) => height - bottom - (value / maximum) * (height - top - bottom)
  const points = results.map((r, i) => `${x(i)},${y(r.annualTax)}`)
  const ticks = Array.from({ length: 5 }, (_, i) => (maximum * i) / 4)
  const short = (value) =>
    new Intl.NumberFormat("en-MY", { notation: "compact", maximumFractionDigits: 1 }).format(value)
  el("tax-chart").innerHTML =
    `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chart-title chart-desc"><title id="chart-title">Annual income tax from YA 2022 to YA 2027</title><desc id="chart-desc">${results.map((r) => `YA ${r.year}${r.proposed ? " proposed" : ""}: ${rm(r.annualTax)}`).join("; ")}. Exact amounts are in the table below.</desc><text x="${left}" y="17">Annual tax (RM)</text>${ticks.map((v) => `<line class="grid" x1="${left}" x2="${width - right}" y1="${y(v)}" y2="${y(v)}"/><text x="${left - 12}" y="${y(v) + 4}" text-anchor="end">${short(v)}</text>`).join("")}<path d="M ${points.slice(0, 5).join(" L ")} L ${x(4)},${height - bottom} L ${left},${height - bottom} Z" fill="#13776b0c"/><polyline class="line" points="${points.slice(0, 5).join(" ")}"/><polyline class="projection" points="${points.slice(4).join(" ")}"/>${results.map((r, i) => `<circle class="point ${r.proposed ? "proposal" : ""}" cx="${x(i)}" cy="${y(r.annualTax)}" r="${r.year === selectedYear ? 6 : 4}"><title>YA ${r.year}: ${rm(r.annualTax)}${r.proposed ? " (proposal)" : ""}</title></circle>${compact ? "" : `<text class="value" x="${x(i)}" y="${y(r.annualTax) - 16}" text-anchor="middle">${short(r.annualTax)}</text>`}<text x="${x(i)}" y="${height - 16}" text-anchor="middle">${r.year}${r.proposed ? "*" : ""}</text>`).join("")}</svg>`
}
function update() {
  try {
    const input = readInput()
    const result = TaxEngine.calculate(input, selectedYear)
    el("form-error").hidden = true
    el("result-year").textContent = `· YA ${selectedYear}${result.proposed ? " proposal" : ""}`
    el("monthly-net").textContent = fmt(result.monthlyTakeHome)
    el("annual-net").textContent = rm(result.annualTakeHome)
    el("annual-tax").textContent = rm(result.annualTax)
    el("monthly-tax").textContent = rm(result.annualTax / 12)
    el("effective-rate").textContent = `${fmt(result.effectiveRate)}%`
    el("annual-epf").textContent = rm(result.employeeEpf)
    el("result-status").textContent =
      `${result.proposed ? "Budget proposal estimate" : "Estimate updated"} for YA ${selectedYear}.${input.ignoreReliefs ? " Reliefs and personal rebate excluded." : ""}`
    const values = [
      Math.max(0, result.annualTakeHome),
      result.employeeEpf,
      result.annualTax,
      result.socso + result.eis + input.prs,
    ]
    const total = values.reduce((a, b) => a + b, 0)
    ;["net", "epf", "tax", "other"].forEach(
      (key, i) => (el(`${key}-bar`).style.width = `${total ? (values[i] / total) * 100 : 0}%`),
    )
    rows("pay-breakdown", [
      ["Gross annual income", result.gross],
      ["Employee EPF", result.employeeEpf],
      ["SOCSO + EIS", result.socso + result.eis],
      ["Income tax", result.annualTax],
      ["PRS / annuity paid", input.prs],
      ["Annual take-home", result.annualTakeHome, true],
    ])
    rows("tax-breakdown", [
      ["Gross annual income", result.gross],
      ["Personal relief", result.reliefs.personal],
      ["EPF relief", result.reliefs.epf],
      ["PRS relief", result.reliefs.prs],
      ["SOCSO / EIS relief", result.reliefs.social],
      ["Other reliefs", result.reliefs.other],
      ["Chargeable income", result.chargeable, true],
      ["Tax before rebate", result.beforeRebate],
      ["Personal rebate", result.rebate],
      ["Tax payable", result.annualTax, true],
    ])
    const totalEpf = result.employeeEpf + result.employerEpf
    rows("epf-breakdown", [
      ["Employee / year", result.employeeEpf],
      ["Employer / year", result.employerEpf],
      ["Combined / year", totalEpf, true],
      ["Combined / month, averaged", totalEpf / 12],
      ["After 30 years at 5%", totalEpf * ((1.05 ** 30 - 1) / 0.05)],
    ])
    el("bracket-caption").textContent =
      `YA ${selectedYear}${result.proposed ? " proposed" : ""} progressive tax calculation, before rebate`
    el("bracket-rows").innerHTML = result.brackets
      .map(
        (row) =>
          `<tr><td>${fmt(row.floor)} ${row.ceiling === Infinity ? "and above" : `– ${fmt(row.ceiling)}`}</td><td>${row.rate}%</td><td>${fmt(row.tax)}</td></tr>`,
      )
      .join("")
    const comparison = [2022, 2023, 2024, 2025, 2026, 2027].map((year) =>
      TaxEngine.calculate(input, year),
    )
    el("comparison-description").textContent =
      `Annual tax on the same ${rm(result.gross)} gross income, using your current inputs.`
    el("comparison-rows").innerHTML = comparison
      .map(
        (r) =>
          `<tr class="${r.year === selectedYear ? "selected-row" : ""}"><td>YA ${r.year}${r.proposed ? " · Proposed" : ""}</td><td>${rm(r.chargeable)}</td><td>${rm(r.annualTax)}</td><td>${fmt(r.effectiveRate)}%</td></tr>`,
      )
      .join("")
    const difference = comparison[0].annualTax - comparison[4].annualTax
    el("comparison-summary").textContent =
      difference === 0
        ? "Your estimated tax is the same in YA 2022 and YA 2026 with these inputs."
        : `With these inputs, your YA 2026 tax is ${rm(Math.abs(difference))} ${difference > 0 ? "lower" : "higher"} than YA 2022.`
    renderChart(comparison)
  } catch (error) {
    el("form-error").textContent = error.message
    el("form-error").hidden = false
    el("result-status").textContent = "Results have not updated. Check the highlighted inputs."
  }
}
el("tax-form").addEventListener("submit", (event) => {
  event.preventDefault()
  update()
})
el("assessmentYear").addEventListener("change", () => {
  selectedYear = Number(el("assessmentYear").value)
  document.body.dataset.year = selectedYear
  el("proposal-notice").hidden = selectedYear !== 2027
  document.title = `YA ${selectedYear} Salary & Tax Calculator — Ringgit / tools`
  // Keep entered details when changing year, while preserving shareable year-specific URLs.
  history.replaceState(
    null,
    "",
    new URL(`calc/take-home-salary-tax-ya${selectedYear}.html`, document.baseURI),
  )
  // The base URL makes hash-only links resolve to the home page.
  document.querySelector(".skip-link").href = `${location.pathname}#main`
  update()
})
for (const id of ["ignoreReliefs", "social"]) el(id).addEventListener("change", update)
for (const key of numericKeys)
  el(key).addEventListener("input", () => {
    el("result-status").textContent =
      "Details changed. Calculate again to refresh the results and comparison."
  })
update()

if (typeof ResizeObserver !== "undefined") {
  new ResizeObserver(() => {
    if (chartResults.length) renderChart(chartResults)
  }).observe(el("tax-chart"))
} else {
  window.addEventListener("resize", () => {
    if (chartResults.length) renderChart(chartResults)
  })
}
