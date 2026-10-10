"use strict"
const test = require("node:test")
const assert = require("node:assert/strict")
const tax = require("../calc/tax-engine.js")
const {
  parseNonNegativeNumber,
  computeMonthlyWithdrawal,
  computeMonthlyWithdrawalSimple,
} = require("../calc/main.js")
const input = (extra) => ({
  salary: 7500,
  bonus: 0,
  employeeRate: 11,
  employerRate: 12,
  prs: 0,
  otherReliefs: 0,
  social: true,
  ignoreReliefs: false,
  ...extra,
})

// Totals at each published bracket endpoint, calculated independently from HASiL schedules.
const endpoints = {
  2020: [
    [5000, 0],
    [20000, 150],
    [35000, 600],
    [50000, 1800],
    [70000, 4600],
    [100000, 10900],
    [250000, 46900],
    [400000, 83650],
    [600000, 133650],
    [1000000, 237650],
    [2000000, 517650],
    [2100000, 547650],
  ],
  2021: [
    [5000, 0],
    [20000, 150],
    [35000, 600],
    [50000, 1800],
    [70000, 4400],
    [100000, 10700],
    [250000, 46700],
    [400000, 83450],
    [600000, 133450],
    [1000000, 237450],
    [2000000, 517450],
    [2100000, 547450],
  ],
  2023: [
    [5000, 0],
    [20000, 150],
    [35000, 600],
    [50000, 1500],
    [70000, 3700],
    [100000, 9400],
    [400000, 84400],
    [600000, 136400],
    [2000000, 528400],
    [2100000, 558400],
  ],
  2027: [
    [5000, 0],
    [20000, 150],
    [35000, 600],
    [50000, 1500],
    [70000, 3700],
    [100000, 9100],
    [150000, 21100],
    [400000, 83600],
    [600000, 135600],
    [1000000, 247600],
    [2000000, 547600],
    [2100000, 577600],
  ],
}
for (const year of tax.years) {
  /** Ensures YA ${year}: published/proposed bracket endpoints and top marginal rate. */
  test(`YA ${year}: published/proposed bracket endpoints and top marginal rate`, () => {
    const expected = endpoints[year] || endpoints[year === 2022 ? 2021 : 2023]
    for (const [income, total] of expected)
      assert.equal(tax.tax(income, year), total, `at RM ${income}`)
    assert.equal(tax.tax(0, year), 0)
    const upper = year >= 2027 ? 1000000 : 2000000
    assert.equal(tax.tax(upper + 100, year) - tax.tax(upper, year), 30)
  })
}

/** Ensures published band transitions have the correct marginal rate on both sides. */

test("published band transitions have the correct marginal rate on both sides", () => {
  assert.equal(tax.tax(70001, 2022), 4400.21)
  assert.equal(tax.tax(69999, 2022), 4399.87)
  assert.equal(tax.tax(70001, 2023), 3700.19)
  assert.equal(tax.tax(100001, 2027), 9100.24)
  assert.equal(tax.tax(150001, 2027), 21100.25)
  assert.equal(tax.tax(1000001, 2027), 247600.3)
})

/** Ensures RM400 rebate applies through RM35000 inclusive and cannot create a refund. */

test("RM400 rebate applies through RM35000 inclusive and cannot create a refund", () => {
  const at = tax.calculate(input({ salary: 44000 / 12, employeeRate: 0, social: false }), 2025)
  assert.equal(at.chargeable, 35000)
  assert.equal(at.rebate, 400)
  assert.equal(at.annualTax, 200)
  const above = tax.calculate(input({ salary: 44001 / 12, employeeRate: 0, social: false }), 2025)
  assert.equal(above.chargeable, 35001)
  assert.equal(above.rebate, 0)
  assert.equal(above.annualTax, 600.06)
  const below = tax.calculate(input({ salary: 29000 / 12, employeeRate: 0, social: false }), 2025)
  assert.equal(below.beforeRebate, 150)
  assert.equal(below.rebate, 150)
  assert.equal(below.annualTax, 0)
})

/** Ensures zero income gives zero tax, contributions and effective rate in every year. */

test("zero income gives zero tax, contributions and effective rate in every year", () => {
  for (const year of tax.years) {
    const result = tax.calculate(input({ salary: 0 }), year)
    for (const key of [
      "gross",
      "annualTax",
      "employeeEpf",
      "employerEpf",
      "socso",
      "eis",
      "annualTakeHome",
      "effectiveRate",
    ])
      assert.equal(result[key], 0)
  }
})

/** Ensures bonus is included in both employee and employer EPF, not SOCSO/EIS. */

test("bonus is included in both employee and employer EPF, not SOCSO/EIS", () => {
  const result = tax.calculate(input({ bonus: 2 }), 2025)
  assert.equal(result.gross, 105000)
  assert.equal(result.employeeEpf, 11550)
  assert.equal(result.employerEpf, 12600)
  assert.equal(result.socso, 357)
  assert.equal(result.eis, 142.8)
  assert.equal(
    result.annualTakeHome,
    result.gross - result.employeeEpf - result.socso - result.eis - result.annualTax,
  )
})

/** Ensures automatic relief caps, extra reliefs, and full PRS cash payment. */

test("automatic relief caps, extra reliefs, and full PRS cash payment", () => {
  const result = tax.calculate(input({ prs: 5000, otherReliefs: 2000 }), 2025)
  assert.deepEqual(result.reliefs, {
    personal: 9000,
    epf: 4000,
    prs: 3000,
    social: 350,
    other: 2000,
  })
  assert.equal(result.totalReliefs, 18350)
  assert.equal(result.chargeable, 71650)
  assert.equal(result.annualTax, 4013.5)
  assert.equal(result.annualTakeHome, 70586.7)
  assert.equal(tax.calculate(input({ salary: 1000, prs: 100000 }), 2025).chargeable, 0)
})

/** Ensures ignore reliefs also ignores rebate, but still deducts cash contributions. */

test("ignore reliefs also ignores rebate, but still deducts cash contributions", () => {
  const result = tax.calculate(
    input({ salary: 2000, prs: 1000, otherReliefs: 4000, ignoreReliefs: true }),
    2025,
  )
  assert.equal(result.totalReliefs, 0)
  assert.equal(result.chargeable, 24000)
  assert.equal(result.rebate, 0)
  assert.equal(result.annualTax, 270)
  assert.equal(result.annualTakeHome, 24000 - 2640 - 117 - 46.8 - 270 - 1000)
})

/** Ensures SOCSO/EIS low bands, exact salary boundary and ceilings. */

test("SOCSO/EIS low bands, exact salary boundary and ceilings", () => {
  assert.deepEqual(tax.monthlySocial(0, 6000), { socso: 0, eis: 0 })
  assert.deepEqual(tax.monthlySocial(30, 6000), { socso: 0.1, eis: 0.05 })
  assert.deepEqual(tax.monthlySocial(30.01, 6000), { socso: 0.2, eis: 0.1 })
  assert.deepEqual(tax.monthlySocial(200, 6000), { socso: 0.85, eis: 0.35 })
  assert.deepEqual(tax.monthlySocial(200.01, 6000), { socso: 1.25, eis: 0.5 })
  assert.deepEqual(tax.monthlySocial(4000, 4000), { socso: 19.75, eis: 7.9 })
  assert.deepEqual(tax.monthlySocial(4000.01, 5000), { socso: 20.25, eis: 8.1 })
  assert.deepEqual(tax.monthlySocial(100000, 6000), { socso: 29.75, eis: 11.9 })
})

/** Ensures SOCSO/EIS split-year ceilings account for September2022 and October2024. */

test("SOCSO/EIS split-year ceilings account for September2022 and October2024", () => {
  assert.deepEqual(tax.annualSocial(7000, 2021), { socso: 237, eis: 94.8 })
  assert.deepEqual(tax.annualSocial(7000, 2022), { socso: 257, eis: 102.8 })
  assert.deepEqual(tax.annualSocial(7000, 2023), { socso: 297, eis: 118.8 })
  assert.deepEqual(tax.annualSocial(7000, 2024), { socso: 312, eis: 124.8 })
  assert.deepEqual(tax.annualSocial(7000, 2025), { socso: 357, eis: 142.8 })
})

/** Ensures EIS relief begins YA2022; social toggle removes cash contribution and relief. */

test("EIS relief begins YA2022; social toggle removes cash contribution and relief", () => {
  assert.equal(tax.calculate(input(), 2020).reliefs.social, 237)
  assert.equal(tax.calculate(input(), 2021).reliefs.social, 237)
  assert.equal(tax.calculate(input(), 2022).reliefs.social, 350)
  const result = tax.calculate(input({ social: false }), 2025)
  assert.equal(result.socso, 0)
  assert.equal(result.eis, 0)
  assert.equal(result.reliefs.social, 0)
})

/** Ensures 2027 proposals are explicitly flagged and personal relief rises to12000. */

test("2027 proposals are explicitly flagged and personal relief rises to12000", () => {
  assert.equal(tax.calculate(input(), 2026).proposed, false)
  assert.equal(tax.calculate(input(), 2027).proposed, true)
  assert.equal(tax.calculate(input(), 2027).reliefs.personal, 12000)
})

/** Ensures reject invalid input, unrecognised year, non-finite income and impossible EPF rates. */

test("reject invalid input, unrecognised year, non-finite income and impossible EPF rates", () => {
  for (const value of [-1, NaN, Infinity, undefined, "7500"])
    assert.throws(() => tax.calculate(input({ salary: value }), 2025), RangeError)
  assert.throws(() => tax.calculate(input({ employeeRate: 101 }), 2025), RangeError)
  assert.throws(() => tax.calculate(input({ employerRate: 101 }), 2025), RangeError)
  assert.throws(() => tax.calculate(input(), 2028), RangeError)
  assert.throws(() => tax.tax(-1, 2025), RangeError)
  assert.throws(() => tax.calculate(input({ salary: Number.MAX_VALUE }), 2025), RangeError)
})

/** Ensures numeric parsing supports decimal keyboard input and rejects malformed grouping. */

test("numeric parsing supports decimal keyboard input and rejects malformed grouping", () => {
  for (const [raw, expected] of [
    ["1,234.56", 1234.56],
    [".5", 0.5],
    ["7500.", 7500],
    [" 0 ", 0],
    ["1,000,000", 1000000],
  ])
    assert.equal(parseNonNegativeNumber(raw), expected)
  for (const raw of ["", "1,2", "1,234,56", "-1", "Infinity", "1e3", "abc", "1.2.3", "1 234"])
    assert.ok(Number.isNaN(parseNonNegativeNumber(raw)), raw)
})

/** Ensures retirement withdrawal matches independent annuity calculation and zero-return budget. */

test("retirement withdrawal matches independent annuity calculation and zero-return budget", () => {
  const annualFactorSum = Array.from({ length: 25 }, (_, i) => 1 / 1.05 ** i).reduce(
    (a, b) => a + b,
    0,
  )
  assert.ok(
    Math.abs(computeMonthlyWithdrawal(55, 80, 1000000, 5) - 1000000 / annualFactorSum / 12) < 1e-8,
  )
  assert.equal(computeMonthlyWithdrawal(55, 80, 1000000, 0), 1000000 / 300)
  assert.equal(computeMonthlyWithdrawalSimple(55, 80, 1000000), 1000000 / 300)
  assert.equal(computeMonthlyWithdrawal(55, 80, 0, 5), 0)
  assert.ok(Math.abs(computeMonthlyWithdrawal(55, 80, 1000000, 1e-10) - 1000000 / 300) < 1e-6)
  assert.equal(computeMonthlyWithdrawal(55, 56, 12000, 5), 1000)
})

/** Ensures retirement rejects equal/backward ages, negative savings, invalid returns. */

test("retirement rejects equal/backward ages, negative savings, invalid returns", () => {
  for (const values of [
    [55, 55, 1000, 5],
    [80, 55, 1000, 5],
    [55, 80, -1, 5],
    [55, 80, 1000, -1],
    [55, Infinity, 1000, 5],
  ])
    assert.throws(() => computeMonthlyWithdrawal(...values), RangeError)
})
