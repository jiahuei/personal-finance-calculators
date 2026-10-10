"use strict"
// Optional browser integration suite. Runtime site requires no Node dependencies.
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright")
const baseURL = process.env.TEST_BASE_URL || "http://127.0.0.1:8000"
const screenshotDir = process.env.TEST_SCREENSHOTS
const years = Array.from({ length: 8 }, (_, i) => 2020 + i)
const routes = [
  "index.html",
  "photo-credits.html",
  "calc/retirement-monthly-income.html",
  ...years.map((y) => `calc/take-home-salary-tax-ya${y}.html`),
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
    viewport: innerWidth,
    body: document.body.scrollWidth,
    root: document.documentElement.scrollWidth,
  }))
  check(
    Math.max(dimensions.body, dimensions.root) <= dimensions.viewport + 1,
    `${route} overflows at ${width}px: ${JSON.stringify(dimensions)}`,
  )
}
/** Ensures all routes, touch focus, year switching, charts and retirement work in a real browser. */
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
        if (route.includes("tax-ya")) {
          check(
            (await page.locator("#annual-tax").textContent()) !== "—",
            `${route} should calculate on load`,
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
        }
        if (
          screenshotDir &&
          [
            "index.html",
            "calc/take-home-salary-tax-ya2026.html",
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
      if (width < 768) {
        await page.goto(`${baseURL}/calc/take-home-salary-tax-ya2026.html`)
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
        await page.locator("#bonus").tap()
        check(
          (await page.locator("#salary").inputValue()) === "1,2",
          "malformed comma input stays visible",
        )
        await page.locator("#tax-form button").tap()
        check(await page.locator("#form-error").isVisible(), "malformed input shows validation")
        check(
          (await page.locator("#salary").getAttribute("aria-invalid")) === "true",
          "invalid input accessible state",
        )
        await page.locator("#salary").fill("8000")
        await page.locator("#bonus").fill(".5")
        await page.locator("#tax-form button").tap()
        check(!(await page.locator("#form-error").isVisible()), "decimal input succeeds")
        const chartBefore = await page.locator("#comparison-rows").textContent()
        await page.locator("#assessmentYear").selectOption("2022")
        check(page.url().endsWith("take-home-salary-tax-ya2022.html"), "year updates URL")
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
            "take-home-salary-tax-ya2022.html#main",
          ),
          "skip link follows the selected year",
        )
        await page.locator(".skip-link").focus()
        await page.keyboard.press("Enter")
        check(
          page.url().endsWith("take-home-salary-tax-ya2022.html#main"),
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
        await page.locator("#tax-form button").tap()
        check(
          (await page.locator("#comparison-rows").textContent()) !== chartBefore,
          "comparison updates after new income",
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
        await page.locator("#tax-form button").tap()
        check(await page.locator("#form-error").isVisible(), "EPF rate over100 rejected")
        await page.locator("#employeeRate").fill("11")
        await page.locator("#salary").fill("0")
        await page.locator("#tax-form button").tap()
        check(
          (await page.locator("#annual-tax").textContent()) === "RM 0.00",
          "zero income gives zero tax",
        )
        check(
          (await page.locator("#monthly-net").textContent()) === "0.00",
          "zero income gives zero take-home",
        )
        await page.goto(`${baseURL}/calc/retirement-monthly-income.html`)
        await page.locator("#dividendRatePercentInput").fill("0")
        await page.locator("#retirement-form button").tap()
        check(
          (await page.locator("#monthlyWithdrawResult").textContent()) === "3,333.33",
          "zero-return retirement result",
        )
        await page.locator("#lifeExpectancyInput").fill("55")
        await page.locator("#retirement-form button").tap()
        check(await page.locator("#form-error").isVisible(), "retirement end age must exceed start")
        await page.locator("#lifeExpectancyInput").fill("80")
        await page.locator("#retireSavingInput").fill("0")
        await page.locator("#retirement-form button").tap()
        check(
          (await page.locator("#monthlyWithdrawResult").textContent()) === "0.00",
          "zero savings result",
        )
      }
      await context.close()
    }
    check(errors.length === 0, `No runtime or resource errors: ${errors.join("; ")}`)
    console.log(
      `Passed ${checks} browser assertions across 11 routes at 320,375,768,1440px, including touch/focus, validation, year changes, graphs, sources and retirement.`,
    )
  } finally {
    await browser.close()
  }
})().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
