const floatFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function floatToEnString(value) {
  return floatFormatter.format(value)
}

function formatInputOnBlur(el, formatFunc) {
  el.addEventListener("blur", () => {
    // Never restore selection on blur: iOS can refocus the old input.
    el.value = formatFunc(el.value)
  })
}

// Accept decimal keyboard input and correctly grouped thousands; never turn a typo into money.
function parseNonNegativeNumber(value) {
  const raw = String(value).trim()
  if (!/^(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?|\.\d+)$/.test(raw)) return NaN
  const parsed = Number(raw.replaceAll(",", ""))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : NaN
}

function computeMonthlyWithdrawal(retireAge, lifeExpectancy, retireSaving, dividendRatePercent) {
  const n = lifeExpectancy - retireAge
  if (
    ![retireAge, lifeExpectancy, retireSaving, dividendRatePercent].every(Number.isFinite) ||
    retireAge < 0 ||
    n <= 0 ||
    retireSaving < 0 ||
    dividendRatePercent < 0
  ) {
    throw new RangeError(
      "Enter valid ages, non-negative savings and returns, and an end age after retirement.",
    )
  }
  const rate = dividendRatePercent / 100
  if (rate === 0) return computeMonthlyWithdrawalSimple(retireAge, lifeExpectancy, retireSaving)
  // Equal annual withdrawals at the start of each year, expressed as a monthly budget.
  return (retireSaving * rate) / (1 + rate) / -Math.expm1(-n * Math.log1p(rate)) / 12
}

function computeMonthlyWithdrawalSimple(retireAge, lifeExpectancy, retireSaving) {
  if (
    ![retireAge, lifeExpectancy, retireSaving].every(Number.isFinite) ||
    retireAge < 0 ||
    lifeExpectancy <= retireAge ||
    retireSaving < 0
  )
    throw new RangeError("Invalid retirement inputs")
  return retireSaving / (lifeExpectancy - retireAge) / 12
}

function toggleNavBarBurger() {
  const button = document.getElementById("navbar-burger")
  const menu = document.getElementById("navbar-menu")
  const expanded = button.getAttribute("aria-expanded") !== "true"
  button.setAttribute("aria-expanded", String(expanded))
  menu.classList.toggle("is-active", expanded)
}

function addNavBarBrand() {
  document.getElementById("navbar").insertAdjacentHTML(
    "afterbegin",
    `
    <a class="brand" href="index.html"><span class="brand-icon" aria-hidden="true">▥</span> Ringgit<span class="brand-light"> / tools</span></a>
    <button type="button" id="navbar-burger" class="navbar-burger" aria-label="Toggle navigation" aria-controls="navbar-menu" aria-expanded="false" onclick="toggleNavBarBurger()">Menu <span aria-hidden="true">☰</span></button>`,
  )
}
function addNavBarEnd() {
  document
    .getElementById("navbar-menu")
    .insertAdjacentHTML(
      "beforeend",
      `<a class="source-link" href="https://github.com/jiahuei/personal-finance-calculators">View source ↗</a>`,
    )
}
function addFooter() {
  document.getElementById("footer").innerHTML =
    `<div class="footer-inner"><div><strong>Ringgit / tools</strong><p>Income tax, take-home pay and retirement calculators for Malaysia.</p></div><p>Made by <a href="https://github.com/jiahuei">Jia-Huei Tan</a> · <a href="https://choosealicense.com/licenses/gpl-3.0/">GPL-3.0</a><br><a href="photo-credits.html">Photo credits</a> · <a href="https://icons8.com/icon/85951/calculator">Favicon by Icons8</a></p></div>`
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    parseNonNegativeNumber,
    computeMonthlyWithdrawal,
    computeMonthlyWithdrawalSimple,
  }
}
