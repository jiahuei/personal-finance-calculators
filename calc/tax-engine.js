/* Malaysian resident employment estimates. Sources and assumptions are shown in the UI.
   YA 2027 is a Budget 2027 proposal, not an enacted schedule (reviewed 10 Oct 2026). */
;(function (root) {
  "use strict"
  const historical = [
    [5000, 0],
    [20000, 1],
    [35000, 3],
    [50000, 8],
    [70000, 13],
    [100000, 21],
    [250000, 24],
    [400000, 24.5],
    [600000, 25],
    [1000000, 26],
    [2000000, 28],
    [Infinity, 30],
  ]
  const current = [
    [5000, 0],
    [20000, 1],
    [35000, 3],
    [50000, 6],
    [70000, 11],
    [100000, 19],
    [400000, 25],
    [600000, 26],
    [2000000, 28],
    [Infinity, 30],
  ]
  const proposed = [
    [5000, 0],
    [20000, 1],
    [35000, 3],
    [50000, 6],
    [70000, 11],
    [100000, 18],
    [150000, 24],
    [400000, 25],
    [600000, 26],
    [1000000, 28],
    [Infinity, 30],
  ]
  const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]
  const sources = {
    rates: "https://www.hasil.gov.my/en/individu/kadar-cukai/",
    reliefs: "https://www.hasil.gov.my/en/individu/pelepasan-cukai/",
    socialRelief2022: "https://belanjawan.mof.gov.my/pdf/2022/ucapan/bs22.pdf",
    mtd2026:
      "https://www.hasil.gov.my/media/arvlrzh5/spesifikasi-kaedah-pengiraan-berkomputer-pcb-2026.pdf",
    budget2027:
      "https://www.pmo.gov.my/en/speeches-en/speech-the-fifth-madani-budget-2027-by-yab-pm/",
    prs: "https://belanjawan.mof.gov.my/pdf/belanjawan2025/ucapan/tax-measure.pdf",
    rebate:
      "https://www.mida.gov.my/wp-content/uploads/2021/04/BOOKLET-1-GENERAL-POLICIES-FACILITIES-AND-GUIDELINES.pdf",
    socso: "https://www.perkeso.gov.my/en/rate-of-contribution.html",
    socso2022:
      "https://www.perkeso.gov.my/images/arahan/Employers_Circular_No_2_Year_2022_-_Increment_Of_The_Wage_Ceiling_For_Monthly_Contributions_From_RM4000_to_RM5000.pdf",
    epf: "https://www.kwsp.gov.my/en/employer/responsibilities/mandatory-contribution",
  }
  function rules(year) {
    if (!years.includes(year)) throw new RangeError("Unsupported assessment year")
    return {
      year,
      proposed: year === 2027,
      personal: year === 2027 ? 12000 : 9000,
      epf: 4000,
      prs: 3000,
      socso: year >= 2022 ? 350 : 250,
      brackets:
        year === 2027
          ? proposed
          : year >= 2023
            ? current
            : historical.map(([limit, rate]) => [
                limit,
                year === 2020 && limit === 70000 ? 14 : rate,
              ]),
    }
  }
  function positive(value, name) {
    if (!Number.isFinite(value) || value < 0)
      throw new RangeError(`${name} must be a finite, non-negative number`)
    return value
  }
  const money = (value) => Math.round((value + Number.EPSILON) * 100) / 100
  function taxDetails(income, year) {
    positive(income, "Income")
    let floor = 0
    return rules(year).brackets.map(([ceiling, rate]) => {
      const taxable = Math.max(0, Math.min(income, ceiling) - floor)
      const row = { floor, ceiling, rate, taxable, tax: (taxable * rate) / 100 }
      floor = ceiling
      return row
    })
  }
  function tax(income, year) {
    return money(taxDetails(income, year).reduce((sum, row) => sum + row.tax, 0))
  }
  // First-category employee SOCSO and EIS, excluding optional LINDUNG 24 Jam.
  function monthlySocial(salary, ceiling) {
    if (salary === 0) return { socso: 0, eis: 0 }
    const low = [
      [30, 0.1, 0.05],
      [50, 0.2, 0.1],
      [70, 0.3, 0.15],
      [100, 0.4, 0.2],
      [140, 0.6, 0.25],
      [200, 0.85, 0.35],
    ]
    const band = low.find((row) => salary <= row[0])
    if (band) return { socso: band[1], eis: band[2] }
    const midpoint = Math.ceil(Math.min(salary, ceiling) / 100) * 100 - 50
    return { socso: money(midpoint * 0.005), eis: money(midpoint * 0.002) }
  }
  function annualSocial(salary, year) {
    const periods =
      year <= 2021
        ? [[12, 4000]]
        : year === 2022
          ? [
              [8, 4000],
              [4, 5000],
            ]
          : year === 2023
            ? [[12, 5000]]
            : year === 2024
              ? [
                  [9, 5000],
                  [3, 6000],
                ]
              : [[12, 6000]]
    return periods.reduce(
      (sum, [months, ceiling]) => {
        const month = monthlySocial(salary, ceiling)
        return {
          socso: money(sum.socso + month.socso * months),
          eis: money(sum.eis + month.eis * months),
        }
      },
      { socso: 0, eis: 0 },
    )
  }
  function calculate(input, year) {
    const config = rules(year)
    for (const key of ["salary", "bonus", "employeeRate", "employerRate", "prs", "otherReliefs"])
      positive(input[key], key)
    if (input.employeeRate > 100 || input.employerRate > 100)
      throw new RangeError("EPF rates cannot exceed 100%")
    const gross = money(input.salary * (12 + input.bonus))
    positive(gross, "Annual income")
    const employeeEpf = money((gross * input.employeeRate) / 100)
    const employerEpf = money((gross * input.employerRate) / 100)
    const social = input.social === false ? { socso: 0, eis: 0 } : annualSocial(input.salary, year)
    const reliefs = input.ignoreReliefs
      ? { personal: 0, epf: 0, prs: 0, social: 0, other: 0 }
      : {
          personal: config.personal,
          epf: Math.min(employeeEpf, config.epf),
          prs: Math.min(input.prs, config.prs),
          social: Math.min(social.socso + (year >= 2022 ? social.eis : 0), config.socso),
          other: input.otherReliefs,
        }
    const totalReliefs = money(Object.values(reliefs).reduce((a, b) => a + b, 0))
    const chargeable = money(Math.max(0, gross - totalReliefs))
    const beforeRebate = tax(chargeable, year)
    const rebate = !input.ignoreReliefs && chargeable <= 35000 ? Math.min(400, beforeRebate) : 0
    const annualTax = money(Math.max(0, beforeRebate - rebate))
    const annualTakeHome = money(
      gross - employeeEpf - social.socso - social.eis - annualTax - input.prs,
    )
    return {
      year,
      proposed: config.proposed,
      gross,
      employeeEpf,
      employerEpf,
      ...social,
      reliefs,
      totalReliefs,
      chargeable,
      beforeRebate,
      rebate,
      annualTax,
      annualTakeHome,
      monthlyTakeHome: annualTakeHome / 12,
      effectiveRate: gross ? (annualTax / gross) * 100 : 0,
      brackets: taxDetails(chargeable, year),
    }
  }
  const api = { years, sources, rules, taxDetails, tax, monthlySocial, annualSocial, calculate }
  if (typeof module !== "undefined" && module.exports) module.exports = api
  else root.TaxEngine = api
})(typeof globalThis !== "undefined" ? globalThis : this)
