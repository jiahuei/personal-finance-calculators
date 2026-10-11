"use strict"
addNavBarBrand()
addNavBarEnd()
addFooter()
const retirementFields = [
  "retireAgeInput",
  "lifeExpectancyInput",
  "retireSavingInput",
  "dividendRatePercentInput",
]
const retirementEl = (id) => document.getElementById(id)
for (const id of retirementFields) {
  formatInputOnBlur(retirementEl(id), (value) => {
    const parsed = parseNonNegativeNumber(value)
    return Number.isFinite(parsed)
      ? id.includes("Age") || id === "lifeExpectancyInput"
        ? String(parsed)
        : floatToEnString(parsed)
      : value
  })
  for (const event of ["input", "change", "blur"])
    retirementEl(id).addEventListener(event, updateRetirement)
}
function updateRetirement() {
  try {
    const values = retirementFields.map((id) => {
      const field = retirementEl(id)
      const value = parseNonNegativeNumber(field.value)
      const valid =
        Number.isFinite(value) && (!field.dataset.max || value <= Number(field.dataset.max))
      field.setAttribute("aria-invalid", String(!valid))
      if (!valid)
        throw new Error(
          `Enter a valid non-negative number for ${field.labels[0].textContent.toLowerCase()}${field.dataset.max ? ` (maximum ${field.dataset.max})` : ""}.`,
        )
      return value
    })
    const [start, end, savings, rate] = values
    if (end <= start) {
      retirementEl("lifeExpectancyInput").setAttribute("aria-invalid", "true")
      throw new Error("Plan until an age after your retirement age.")
    }
    const monthly = computeMonthlyWithdrawal(start, end, savings, rate)
    retirementEl("monthlyWithdrawResult").textContent = floatToEnString(monthly)
    retirementEl("monthlyWithdrawSimpleResult").textContent =
      `RM ${floatToEnString(computeMonthlyWithdrawalSimple(start, end, savings))}`
    retirementEl("yearsInRetirement").textContent = String(end - start)
    retirementEl("dividendRatePercent").textContent = `${floatToEnString(rate)}%`
    retirementEl("form-error").hidden = true
    retirementEl("resultsStatus").textContent =
      `Estimate updated for RM ${floatToEnString(savings)} in retirement savings.`
  } catch (error) {
    retirementEl("form-error").textContent = error.message
    retirementEl("form-error").hidden = false
    retirementEl("resultsStatus").textContent =
      "Fix the highlighted inputs to update this estimate."
  }
}
// Enter still submits the form; prevent it so a live-updating calculator never navigates away.
retirementEl("retirement-form").addEventListener("submit", (event) => {
  event.preventDefault()
  updateRetirement()
})
updateRetirement()
