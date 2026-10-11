"use strict"
// Optional browser integration suite. Runtime site requires no Node dependencies.
const assert = require("node:assert/strict")
const TaxEngine = require("../calc/tax-engine.js")
const fs = require("node:fs")
const path = require("node:path")
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright")
const baseURL = process.env.TEST_BASE_URL || "http://127.0.0.1:8000"
const screenshotDir = process.env.TEST_SCREENSHOTS
const taxRoute = "calc/take-home-salary-tax.html"
// One page serves every assessment year through its ?ya= query, opening on the newest enacted year.
const defaultYear = TaxEngine.years.filter((year) => !TaxEngine.rules(year).proposed).at(-1)
const routes = [
  "index.html",
  "photo-credits.html",
  "calc/retirement-monthly-income.html",
  taxRoute,
  `${taxRoute}?ya=2022`,
  `${taxRoute}?ya=2027`,
]
const errors = []
let checks = 0
const check = (condition, message) => {
  assert.ok(condition, message)
  checks++
}
/** Guards against horizontal page overflow at each tested viewport width. */
async function noOverflow(page, route, width) {
  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    root: document.documentElement.scrollWidth,
  }))
  // The requested width is the reference because mobile emulation widens innerWidth to fit
  // overflowing content, which would hide the overflow this check exists to catch.
  check(
    Math.max(dimensions.body, dimensions.root) <= width + 1,
    `${route} overflows at ${width}px: ${JSON.stringify(dimensions)}`,
  )
}
/** Verifies every tax control updates results without submission or moving the typing focus. */
async function liveTaxInputs(page, width) {
  await page.goto(`${baseURL}/${taxRoute}`)
  const input = {
    salary: 7500,
    bonus: 0,
    employeeRate: 11,
    employerRate: 12,
    prs: 0,
    otherReliefs: 0,
    social: true,
    ignoreReliefs: false,
  }
  const money = (value) =>
    new Intl.NumberFormat("en-MY", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  /** Asserts the interface reflects the independently unit-tested engine for each changed control. */
  async function expectedResults(year = defaultYear) {
    const expected = TaxEngine.calculate(input, year)
    check(
      (await page.locator("#annual-tax").textContent()) === `RM ${money(expected.annualTax)}`,
      "annual tax reflects current controls",
    )
    check(
      (await page.locator("#monthly-net").textContent()) === money(expected.monthlyTakeHome),
      "take-home reflects current controls",
    )
    const epf = expected.employeeEpf + expected.employerEpf
    const projection = Array.from({ length: 20 }, (_, i) => epf * 1.05 ** i).reduce(
      (sum, value) => sum + value,
      0,
    )
    check(
      (await page.locator("#epf-breakdown").textContent()).includes(
        `After 20 years at 5%RM ${money(projection)}`,
      ),
      "EPF illustration uses 20 year-end contributions, including the employer rate",
    )
    check(
      (await page.locator(".selected-row").textContent()).includes(money(expected.annualTax)),
      "comparison reflects each input immediately",
    )
    await expectedBreakdown(expected)
  }
  /** Asserts the pay breakdown pairs every annual amount with its monthly average. */
  async function expectedBreakdown(expected) {
    const rows = await page
      .locator("#pay-breakdown tr")
      .evaluateAll((items) => items.map((row) => [...row.cells].map((cell) => cell.textContent)))
    const wanted = [
      ["Gross income", expected.gross],
      ["Employee EPF", expected.employeeEpf],
      ["SOCSO + EIS", expected.socso + expected.eis],
      ["Income tax", expected.annualTax],
      ["PRS / annuity paid", input.prs],
      ["Take-home", expected.annualTakeHome],
    ]
    check(rows.length === wanted.length, "breakdown lists every income allocation")
    for (const [index, [name, value]] of wanted.entries()) {
      const [label, monthly, annual] = rows[index]
      check(label === name, `breakdown keeps the ${name} row`)
      check(annual === money(value), `${name} row keeps its annual amount`)
      check(monthly === money(value / 12), `${name} row adds its monthly average`)
    }
  }
  for (const [id, value] of [
    ["salary", 8123.456],
    ["bonus", 1],
    ["employeeRate", 9],
    ["employerRate", 13],
    ["prs", 2000],
    ["otherReliefs", 1500],
  ]) {
    await page.locator(`#${id}`).fill(String(value))
    input[id] = value
    await expectedResults()
    check(
      await page.evaluate((id) => document.activeElement.id === id, id),
      `${id} retains focus during live recalculation`,
    )
    await page.locator(`#${id}`).blur()
    input[id] = Number(value.toFixed(2))
    await expectedResults()
  }
  for (const [id, value] of [
    ["social", false],
    ["ignoreReliefs", true],
  ]) {
    await page.locator(`#${id}`).setChecked(value)
    input[id] = value
    await expectedResults()
  }
  await page.locator("#assessmentYear").selectOption("2022")
  await expectedResults(2022)
  const validTax = await page.locator("#annual-tax").textContent()
  for (const invalid of ["", "1,2"]) {
    await page.locator("#salary").fill(invalid)
    check(
      await page.locator("#form-error").isVisible(),
      "empty or malformed input explains the validation failure",
    )
    check(
      (await page.locator("#annual-tax").textContent()) === validTax,
      "invalid input preserves the last valid result",
    )
  }
  await page.locator("#salary").fill("9000")
  await page.locator("#salary").evaluate((field) => {
    field.value = "10000"
    field.dispatchEvent(new Event("change", { bubbles: true }))
  })
  input.salary = 10000
  await expectedResults(2022)
  check(
    !(await page.locator("#form-error").isVisible()),
    "valid input restores results after validation",
  )
  await page.locator("#prs").fill("200000")
  check(
    !(await page.locator("#allocation").isVisible()),
    "deductions above income do not masquerade as gross shares",
  )
  check(
    (await page.locator("#allocation-note").textContent()).includes("exceed gross income"),
    "negative take-home explains the excess payments",
  )
  check(
    (await page.locator("#net-allocation").textContent()).includes("RM -"),
    "legend preserves negative annual take-home",
  )
  check(
    !(await page.locator("#net-allocation").textContent()).includes("%"),
    "overspending legend does not show gross shares",
  )
  await noOverflow(page, "negative take-home legend", width)
  await page.locator("#salary").fill("0")
  await page.locator("#prs").fill("0")
  check(!(await page.locator("#allocation").isVisible()), "zero gross income has no share bar")
  check(
    (await page.locator("#allocation-note").textContent()).includes("no gross income"),
    "zero denominator is explained",
  )
  check(
    (await page.locator("#net-allocation").textContent()).includes("RM 0.00 per year"),
    "zero-income legend still provides accessible annual values",
  )
}
/** Verifies all retirement inputs recalculate live, preserve focus and recover from invalid input. */
async function liveRetirementInputs(page) {
  await page.goto(`${baseURL}/calc/retirement-monthly-income.html`)
  for (const [id, value] of [
    ["retireAgeInput", 60],
    ["lifeExpectancyInput", 85],
    ["retireSavingInput", 1200000],
    ["dividendRatePercentInput", 0],
  ]) {
    const before = await page.locator("#monthlyWithdrawResult").textContent()
    await page.locator(`#${id}`).fill(String(value))
    check(
      (await page.locator("#monthlyWithdrawResult").textContent()) !== before,
      `${id} changes the retirement result without submitting`,
    )
    check(
      await page.evaluate((id) => document.activeElement.id === id, id),
      `${id} retains typing focus`,
    )
  }
  check(
    (await page.locator("#monthlyWithdrawResult").textContent()) === "4,000.00",
    "zero-return result matches savings divided across 25 years",
  )
  const lastValid = await page.locator("#monthlyWithdrawResult").textContent()
  await page.locator("#retireSavingInput").fill("")
  check(await page.locator("#form-error").isVisible(), "empty retirement savings reports an error")
  check(
    (await page.locator("#monthlyWithdrawResult").textContent()) === lastValid,
    "invalid savings preserves the last valid result",
  )
  await page.locator("#retireSavingInput").fill("1234567.891")
  await page.locator("#retireSavingInput").blur()
  check(
    (await page.locator("#retireSavingInput").inputValue()) === "1,234,567.89",
    "savings formats on blur",
  )
  check(
    (await page.locator("#monthlyWithdrawResult").textContent()) === "4,115.23",
    "retirement result matches the formatted savings",
  )
  await page.locator("#retireSavingInput").evaluate((field) => {
    field.value = "1200000"
    field.dispatchEvent(new Event("change", { bubbles: true }))
  })
  check(
    (await page.locator("#monthlyWithdrawResult").textContent()) === "4,000.00",
    "change event updates retirement results",
  )
}
/** Ensures all routes recalculate live, explain the allocation bar and keep touch focus in a real browser. */
;(async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const width of [320, 375, 768, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        isMobile: width < 768,
        hasTouch: width < 768,
        deviceScaleFactor: 1,
      })
      const page = await context.newPage()
      page.on("pageerror", (error) => errors.push(error.message))
      page.on("response", (response) => {
        if (response.url().startsWith(baseURL) && response.status() >= 400)
          errors.push(`${response.status()} ${response.url()}`)
      })
      for (const route of routes) {
        const response = await page.goto(`${baseURL}/${route}`)
        check(response.status() === 200, `${route} should load`)
        check((await page.locator("h1").count()) === 1, `${route} should have one main heading`)
        check((await page.locator(".brand").count()) === 1, `${route} should have one navbar brand`)
        await noOverflow(page, route, width)
        if (route.startsWith(taxRoute)) {
          check(
            (await page.locator("#annual-tax").textContent()) !== "—",
            `${route} should calculate on load`,
          )
          const urlYear = Number(new URL(route, baseURL).searchParams.get("ya")) || defaultYear
          check(
            (await page.locator("#assessmentYear").inputValue()) === String(urlYear),
            `${route} opens on the year in its URL`,
          )
          check((await page.title()).includes(`YA ${urlYear}`), `${route} titles its own year`)
          check(
            (await page.locator("#proposal-notice").isVisible()) ===
              TaxEngine.rules(urlYear).proposed,
            "the proposal notice follows the year in the URL",
          )
          check(
            (await page.locator("#pay-breakdown tr").count()) === 6,
            `${route} breaks down six monthly and annual amounts`,
          )
          check(
            (await page.locator(".breakdown thead").textContent()).includes("Per month"),
            "the breakdown labels its monthly column",
          )
          check(
            (await page.locator("#comparison-rows tr").count()) === 6,
            `${route} should compare six years`,
          )
          // Expand content to include table/source layouts in the overflow checks.
          await page
            .locator("details")
            .evaluateAll((items) => items.forEach((item) => (item.open = true)))
          await noOverflow(page, `${route} expanded`, width)
          check(
            (await page.locator("#tax-chart .point").count()) === 6,
            "chart has six data points",
          )
          const widthInSvg = await page
            .locator("#tax-chart svg")
            .evaluate((svg) => svg.viewBox.baseVal.width)
          const chartWidth = await page.locator("#tax-chart").evaluate((node) => node.clientWidth)
          check(Math.abs(widthInSvg - chartWidth) < 2, "chart labels use available pixel width")
          // The legend and hover titles answer what each coloured segment represents.
          check(
            (await page.locator(".allocation-key span").count()) === 4,
            "allocation legend names every segment",
          )
          const shares = await page
            .locator(".allocation span")
            .evaluateAll((spans) => spans.map((span) => Number.parseFloat(span.style.width) || 0))
          check(
            Math.abs(shares.reduce((sum, share) => sum + share, 0) - 100) < 0.01,
            "allocation segments fill the whole gross income bar",
          )
          check(
            (await page.locator("#tax-bar").getAttribute("title")).startsWith("Income tax: RM "),
            "hovering a segment reveals its amount and share",
          )
          check(
            (await page.locator("#tax-allocation").textContent()).includes("per year ("),
            "visible annual amounts and shares are available to touch and keyboard users",
          )
          check(
            (await page.locator("#allocation").getAttribute("aria-label")).includes("gross income"),
            "allocation bar is described to assistive technology",
          )
          const caret = await page.locator("#assessmentYear").evaluate((select) => {
            const style = getComputedStyle(select)
            return {
              appearance: style.appearance,
              image: style.backgroundImage,
              paddingRight: style.paddingRight,
              position: style.backgroundPosition,
            }
          })
          check(
            caret.appearance === "none" &&
              caret.image.startsWith("url(") &&
              caret.paddingRight === "42px" &&
              caret.position.includes("14px"),
            `year dropdown draws its own caret on the field inset: ${JSON.stringify(caret)}`,
          )
        }
        if (
          screenshotDir &&
          [
            "index.html",
            "calc/take-home-salary-tax.html",
            "calc/retirement-monthly-income.html",
            "photo-credits.html",
          ].includes(route) &&
          [375, 1440].includes(width)
        ) {
          fs.mkdirSync(screenshotDir, { recursive: true })
          await page.screenshot({
            path: path.join(screenshotDir, `${width}-${path.basename(route, ".html")}.png`),
            fullPage: true,
          })
        }
      }
      await liveTaxInputs(page, width)
      await liveRetirementInputs(page)
      if (width < 768) {
        await page.goto(`${baseURL}/${taxRoute}`)
        await page.locator("#navbar-burger").tap()
        check(
          (await page.locator("#navbar-burger").getAttribute("aria-expanded")) === "true",
          "mobile menu opens",
        )
        check(await page.locator("#navbar-menu").isVisible(), "mobile menu appears")
        await page.locator("#navbar-burger").tap()
        check(!(await page.locator("#navbar-menu").isVisible()), "mobile menu closes")
        // A selection call on blur is the reported mobile focus regression.
        await page.evaluate(() => {
          window.selectionCalls = 0
          const original = HTMLInputElement.prototype.setSelectionRange
          HTMLInputElement.prototype.setSelectionRange = function (...args) {
            window.selectionCalls++
            return original.apply(this, args)
          }
        })
        const keys = ["salary", "bonus", "employeeRate", "employerRate", "prs", "otherReliefs"]
        for (let i = 0; i < keys.length - 1; i++) {
          await page.locator(`#${keys[i]}`).tap()
          if (i === 0) await page.locator("#salary").fill("8123.45")
          await page.locator(`#${keys[i + 1]}`).tap()
          check(
            await page.evaluate((id) => document.activeElement.id === id, keys[i + 1]),
            `tap transfers focus to ${keys[i + 1]}`,
          )
        }
        check(
          (await page.locator("#salary").inputValue()) === "8,123.45",
          "edited salary formats after tapping another input",
        )
        check(
          (await page.evaluate(() => window.selectionCalls)) === 0,
          "blur must never restore selection",
        )
        await page.locator("#salary").fill("1,2")
        check(
          await page.locator("#form-error").isVisible(),
          "malformed input shows validation while typing",
        )
        await page.locator("#bonus").tap()
        check(
          (await page.locator("#salary").inputValue()) === "1,2",
          "malformed comma input stays visible",
        )
        check(
          (await page.locator("#salary").getAttribute("aria-invalid")) === "true",
          "invalid input accessible state",
        )
        await page.locator("#salary").fill("8000")
        await page.locator("#bonus").fill(".5")
        check(!(await page.locator("#form-error").isVisible()), "decimal input succeeds")
        await page.locator("#bonus").blur()
        check((await page.locator("#bonus").inputValue()) === "0.50", "leaving a field formats it")
        const chartBefore = await page.locator("#comparison-rows").textContent()
        await page.locator("#assessmentYear").selectOption("2022")
        check(page.url().endsWith("take-home-salary-tax.html?ya=2022"), "year updates URL")
        check((await page.locator("#salary").inputValue()) === "8,000.00", "year retains salary")
        check((await page.locator("#bonus").inputValue()) === "0.50", "year retains bonus")
        check(
          await page
            .locator(".selected-row")
            .textContent()
            .then((x) => x.includes("2022")),
          "comparison highlights chosen year",
        )
        check(
          (await page.locator(".skip-link").getAttribute("href")).endsWith(
            "take-home-salary-tax.html?ya=2022#main",
          ),
          "skip link follows the selected year",
        )
        await page.locator(".skip-link").focus()
        await page.keyboard.press("Enter")
        check(
          page.url().endsWith("take-home-salary-tax.html?ya=2022#main"),
          "skip link stays in the current document",
        )
        check(
          (await page.locator("#salary").inputValue()) === "8,000.00",
          "skip link retains entered income",
        )
        await page.locator("#assessmentYear").selectOption("2027")
        check(await page.locator("#proposal-notice").isVisible(), "2027 proposal notice is visible")
        check((await page.title()).includes("2027"), "year updates title")
        await page.locator("#salary").fill("9000")
        check(
          (await page.locator("#comparison-rows").textContent()) !== chartBefore,
          "comparison updates after new income without submitting",
        )
        const sources = await page
          .locator(".source-grid a")
          .evaluateAll((links) => links.map((a) => a.href))
        check(
          sources.includes("https://www.hasil.gov.my/en/individu/kadar-cukai/"),
          "official rate source linked",
        )
        check(
          sources.some((url) => url.includes("spesifikasi-kaedah-pengiraan-berkomputer-pcb-2026")),
          "2026 source linked",
        )
        check(
          sources.some((url) => url.includes("speech-the-fifth-madani-budget-2027")),
          "2027 proposal source linked",
        )
        await page.locator("#employeeRate").fill("101")
        check(await page.locator("#form-error").isVisible(), "EPF rate over100 rejected")
        await page.locator("#employeeRate").fill("11")
        await page.locator("#salary").fill("0")
        check(
          (await page.locator("#annual-tax").textContent()) === "RM 0.00",
          "zero income gives zero tax",
        )
        check(
          (await page.locator("#monthly-net").textContent()) === "0.00",
          "zero income gives zero take-home",
        )
        await page.goto(`${baseURL}/calc/retirement-monthly-income.html`)
        check(
          (await page.locator("#retirement-form button").count()) === 0,
          "retirement form needs no manual calculate button",
        )
        await page.locator("#dividendRatePercentInput").fill("0")
        check(
          (await page.locator("#monthlyWithdrawResult").textContent()) === "3,333.33",
          "zero-return retirement result",
        )
        await page.locator("#lifeExpectancyInput").fill("55")
        check(await page.locator("#form-error").isVisible(), "retirement end age must exceed start")
        await page.locator("#lifeExpectancyInput").fill("80")
        await page.locator("#retireSavingInput").fill("0")
        check(
          (await page.locator("#monthlyWithdrawResult").textContent()) === "0.00",
          "zero savings result",
        )
      }
      await context.close()
    }
    check(errors.length === 0, `No runtime or resource errors: ${errors.join("; ")}`)
    console.log(
      `Passed ${checks} browser assertions across ${routes.length} routes at 320,375,768,1440px, including touch/focus, live recalculation, the monthly and annual breakdown columns, the allocation legend, validation, year-specific URLs, graphs, sources and retirement.`,
    )
  } finally {
    await browser.close()
  }
})().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
