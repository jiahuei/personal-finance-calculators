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

function formatStringAsEnFloat(str) {
  if (str == "") {
    return str
  } else {
    return floatToEnString(enStringToFloat(str))
  }
}

function formatStringAsEnInt(str) {
  if (str == "") {
    return str
  } else {
    return intToEnString(enStringToFloat(str))
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

function computeMonthlyWithdrawal(retireAge, lifeExpectancy, retireSaving, dividendRate) {
  console.log(`'computeMonthlyWithdrawal' inputs: 
  retireAge = ${retireAge}
  lifeExpectancy = ${lifeExpectancy}
  retireSaving = ${retireSaving}
  dividendRate = ${dividendRate}`)
  let n = lifeExpectancy - retireAge
  let factor = dividendRate / 100 + 1
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

function toggleBurger() {
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
    onclick="toggleBurger()"
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
        href="https://github.com/photonea/personal-finance-calculators-alt"
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
  </p>
  <p>
    Complete source code of licensed works and modifications, which include larger works using a licensed work, 
    must be made available under the same license.
  </p>
</div>
`
  document.getElementById("footer").insertAdjacentHTML("beforeend", html)
}
