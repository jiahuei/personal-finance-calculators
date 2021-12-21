floatFormatter = new Intl.NumberFormat(
  "en-US",
  (options = { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
)

intFormatter = new Intl.NumberFormat(
  "en-US",
  (options = { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
)

function removeCommaThousandSep(str) {
  return str.split(",").join("")
}

function enStringToFloat(str) {
  if (str == "") {
    str = "0"
  } else {
    str = removeCommaThousandSep(str)
  }
  val = parseFloat(str)
  if (val == NaN) {
    val = 0
  }
  return val
}

function floatToEnString(val) {
  if (isNaN(val)) {
    val = "0"
  }
  return floatFormatter.format(val)
}

function intToEnString(val) {
  if (isNaN(val)) {
    val = "0"
  }
  return intFormatter.format(val)
}

function formatStringAsEnFloat(str, minimum = 0, maximum = Infinity) {
  if (str == "") {
    return str
  } else {
    return floatToEnString(Math.min(Math.max(enStringToFloat(str), minimum), maximum))
  }
}

function formatStringAsEnInt(str, minimum = 0, maximum = Infinity) {
  if (str == "") {
    return str
  } else {
    return intToEnString(Math.min(Math.max(enStringToFloat(str), minimum), maximum))
  }
}

function formatInput(el, formatFunc = formatStringAsEnFloat) {
  // https://codepen.io/559wade/pen/LRzEjj

  // initial caret position
  let caretPos = el.selectionStart
  let oriLength = el.value.length

  // format value
  el.value = formatFunc(el.value)

  // put caret back in the right position
  let newLength = el.value.length
  caretPos = newLength - oriLength + caretPos
  el.setSelectionRange(caretPos, caretPos)
}

function formatInputOnBlur(el, formatFunc = formatStringAsEnFloat, onKeyUp = false) {
  el.onblur = () => {
    formatInput(el, formatFunc)
  }
  if (onKeyUp) {
    el.onkeyup = () => {
      formatInput(el, formatFunc)
    }
  }
}

function validateInputNumber(el) {
  let val = el.value
  if (val == "") {
    val = "0"
  }
  return isNaN(val)
}

function computeMonthlyWithdrawal(retireAge, lifeExpectancy, retireSaving, dividendRatePercent) {
  console.log(`'computeMonthlyWithdrawal' inputs: 
  retireAge = ${retireAge}
  lifeExpectancy = ${lifeExpectancy}
  retireSaving = ${retireSaving}
  dividendRatePercent = ${dividendRatePercent}`)
  let n = lifeExpectancy - retireAge
  let factor = dividendRatePercent / 100 + 1
  let numerator = retireSaving * factor ** (n - 1) * (factor - 1)
  let denominator = factor ** n - 1
  let monthlyWithdraw = numerator / denominator / 12
  console.log(`'computeMonthlyWithdrawal' result: ${monthlyWithdraw}`)
  return monthlyWithdraw
}

function computeMonthlyWithdrawalSimple(retireAge, lifeExpectancy, retireSaving) {
  console.log(`'computeMonthlyWithdrawalSimple' inputs: 
  retireAge = ${retireAge}
  lifeExpectancy = ${lifeExpectancy}
  retireSaving = ${retireSaving}`)
  let n = lifeExpectancy - retireAge
  let monthlyWithdraw = retireSaving / n / 12
  console.log(`'computeMonthlyWithdrawalSimple' result: ${monthlyWithdraw}`)
  return monthlyWithdraw
}

function computeAnnualIncome(baseSalary, bonusAmount) {
  return baseSalary * 12 + baseSalary * bonusAmount
}

function computeEpfAnnualContribution(baseSalary, epfRatePercent) {
  return baseSalary * 12 * (epfRatePercent / 100)
}

function epfReliefYA2020(epfAnnualContribution) {
  return Math.min(epfAnnualContribution, 4000)
}

function computeTaxYA2020(chargeableIncome) {
  // [bracket ceiling, bracket tax rate, accumulated tax from lower brackets]
  let rates = [
    [0, 0.0, 0],
    [5000, 0.0, 0],
    [20000, 1.0, 0],
    [35000, 3.0, 150],
    [50000, 8.0, 600],
    [70000, 14.0, 1800],
    [100000, 21.0, 4600],
    [250000, 24.0, 10900],
    [400000, 24.5, 46900],
    [600000, 25.0, 83650],
    [1000000, 26.0, 133650],
    [2000000, 28.0, 237650],
    [Infinity, 30.0, 517650],
  ]
  // Loop through the array
  let payableTax = 0
  for (var i = 1; i < rates.length; i++) {
    let floor = rates[i - 1][0]
    let [ceiling, rate, tax] = rates[i]
    if (chargeableIncome > floor && chargeableIncome <= ceiling) {
      payableTax = tax + (chargeableIncome - floor) * (rate / 100)
    }
  }
  return payableTax
}

function toggleNavBarBurger() {
  let burgerIcon = document.getElementById("navbar-burger")
  let dropMenu = document.getElementById("navbar-menu")
  burgerIcon.classList.toggle("is-active")
  dropMenu.classList.toggle("is-active")
}

function addNavBarBrand() {
  let html = `
<div class="navbar-brand">
  <a class="navbar-item" href="https://github.com/jiahuei">
    <img src="https://github.com/jiahuei.png?size=96" alt="Jia Huei Tan" height="96" />
  </a>

  <a
    role="button"
    id="navbar-burger"
    class="navbar-burger"
    aria-label="menu"
    aria-expanded="false"
    onclick="toggleNavBarBurger()"
  >
    <span aria-hidden="true"></span>
    <span aria-hidden="true"></span>
    <span aria-hidden="true"></span>
  </a>
</div>
`
  document.getElementById("navbar").insertAdjacentHTML("afterbegin", html)
}

function addNavBarEnd() {
  let html = `
<div class="navbar-end">
  <div class="navbar-item">
    <div class="buttons">
      <a
        class="button is-light"
        href="https://bulma.io"
      >
        Made using
        <img
          src="https://bulma.io/images/bulma-logo.png"
          width="112"
          height="28"
          class="px-2"
      </a>
      <a
        class="button is-light"
        href="https://github.com/jiahuei/personal-finance-calculators"
      >
        <span class="icon-text">
          <span class="icon">
            <i class="fab fa-github"></i>
          </span>
          <span> View source on GitHub </span>
        </span>
      </a>
    </div>
  </div>
</div>
`
  document.getElementById("navbar-menu").insertAdjacentHTML("beforeend", html)
}

function addFooter() {
  let html = `
<div class="container has-text-centered">
  <p>
    Made by <a href="https://github.com/jiahuei">Jia-Huei Tan</a>. The source code and website content are
    licensed <a href="https://choosealicense.com/licenses/gpl-3.0/">GPL-3.0</a>. 
    <a href="photo-credits.html">Click here for photo credits</a>.
  </p>
  <p>
    Complete source code of licensed works and modifications, which include larger works using a licensed work, 
    must be made available under the same license.
  </p>
</div>
`
  document.getElementById("footer").insertAdjacentHTML("beforeend", html)
}
