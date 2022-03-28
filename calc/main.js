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

function padStringToFixedLength(str, length, padLeft = true) {
  if (padLeft) {
    str = str.padStart(length, "\u2007")
  } else {
    str = str.padEnd(length, "\u2007")
  }
  return str
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

function computeGeometricSeries(a, r, n) {
  console.log(`'computeGeometricSeries' inputs: 
  a = ${a}
  r = ${r}
  n = ${n}`)
  let numerator = a * (1 - Math.pow(r, n))
  let denominator = 1 - r
  let result = numerator / denominator
  console.log(`'computeGeometricSeries' result: ${result}`)
  return result
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

function epfReliefYA2021(epfAnnualContribution) {
  return epfReliefYA2020(epfAnnualContribution)
}

function epfReliefYA2020(epfAnnualContribution) {
  return Math.min(epfAnnualContribution, 4000)
}

function computeTaxYA2021(chargeableIncome) {
  // [bracket ceiling, bracket tax rate, accumulated tax from lower brackets]
  let rates = [
    [0, 0.0, 0],
    [5000, 0.0, 0],
    [20000, 1.0, 0],
    [35000, 3.0, 150],
    [50000, 8.0, 600],
    [70000, 13.0, 1800],
    [100000, 21.0, 4400],
    [250000, 24.0, 10700],
    [400000, 24.5, 46700],
    [600000, 25.0, 83450],
    [1000000, 26.0, 133450],
    [2000000, 28.0, 237450],
    [Infinity, 30.0, 517450],
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

function computeSocso(basicSalary) {
  // [bracket ceiling, bracket amount]
  let rates = [
    [30, 0.1],
    [50, 0.2],
    [70, 0.3],
    [100, 0.4],
    [140, 0.6],
    [200, 0.85],
    [300, 1.25],
    [400, 1.75],
    [500, 2.25],
    [600, 2.75],
    [700, 3.25],
    [800, 3.75],
    [900, 4.25],
    [1000, 4.75],
    [1100, 5.25],
    [1200, 5.75],
    [1300, 6.25],
    [1400, 6.75],
    [1500, 7.25],
    [1600, 7.75],
    [1700, 8.25],
    [1800, 8.75],
    [1900, 9.25],
    [2000, 9.75],
    [2100, 10.25],
    [2200, 10.75],
    [2300, 11.25],
    [2400, 11.75],
    [2500, 12.25],
    [2600, 12.75],
    [2700, 13.25],
    [2800, 13.75],
    [2900, 14.25],
    [3000, 14.75],
    [3100, 15.25],
    [3200, 15.75],
    [3300, 16.25],
    [3400, 16.75],
    [3500, 17.25],
    [3600, 17.75],
    [3700, 18.25],
    [3800, 18.75],
    [3900, 19.25],
    [4000, 19.75],
    [Infinity, 19.75],
  ]
  // Loop through the array
  let payable = 0
  for (var i = 1; i < rates.length; i++) {
    let floor = rates[i - 1][0]
    let [ceiling, amount] = rates[i]
    if (basicSalary > floor && basicSalary <= ceiling) {
      payable = amount
    }
  }
  return payable
}
function computeEis(basicSalary) {
  // [bracket ceiling, bracket amount]
  let rates = [
    [30, 0.05],
    [50, 0.1],
    [70, 0.15],
    [100, 0.2],
    [140, 0.25],
    [200, 0.35],
    [300, 0.5],
    [400, 0.7],
    [500, 0.9],
    [600, 1.1],
    [700, 1.3],
    [800, 1.5],
    [900, 1.7],
    [1000, 1.9],
    [1100, 2.1],
    [1200, 2.3],
    [1300, 2.5],
    [1400, 2.7],
    [1500, 2.9],
    [1600, 3.1],
    [1700, 3.3],
    [1800, 3.5],
    [1900, 3.7],
    [2000, 3.9],
    [2100, 4.1],
    [2200, 4.3],
    [2300, 4.5],
    [2400, 4.7],
    [2500, 4.9],
    [2600, 5.1],
    [2700, 5.3],
    [2800, 5.5],
    [2900, 5.7],
    [3000, 5.9],
    [3100, 6.1],
    [3200, 6.3],
    [3300, 6.5],
    [3400, 6.7],
    [3500, 6.9],
    [3600, 7.1],
    [3700, 7.3],
    [3800, 7.5],
    [3900, 7.7],
    [4000, 7.9],
    [Infinity, 7.9],
  ]
  // Loop through the array
  let payable = 0
  for (var i = 1; i < rates.length; i++) {
    let floor = rates[i - 1][0]
    let [ceiling, amount] = rates[i]
    if (basicSalary > floor && basicSalary <= ceiling) {
      payable = amount
    }
  }
  return payable
}

function toggleDisabled(element) {
  element.disabled = !element.disabled
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
    <a href="https://icons8.com/icon/85951/calculator">Calculator favicon by Icons8</a>.
  </p>
  <p>
    Complete source code of licensed works and modifications, which include larger works using a licensed work, 
    must be made available under the same license.
  </p>
</div>
`
  document.getElementById("footer").insertAdjacentHTML("beforeend", html)
}
