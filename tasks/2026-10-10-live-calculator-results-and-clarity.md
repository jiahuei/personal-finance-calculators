# feat: Update calculator results live and clarify income breakdowns

## Summary

- Tax and retirement results now update for each input change, including blur formatting and change events, with no calculate buttons. Invalid values preserve the last valid estimate and show an accessible error; typing and mobile focus transfers remain intact.
- Clarified other-relief entries, aligned the assessment-year caret with the field inset, and added visible annual allocation amounts and shares alongside hover values. Zero income and payments above income show an explanation instead of misleading gross shares.
- Updated the existing EPF illustration to 20 years at 5%, capitalized the Tax breakdown heading, and replaced punchy or contrastive marketing copy across the pages and footer with useful descriptions. The default annual EPF contributions of RM 20,700 project to RM 684,465.25 under the stated year-end contribution assumption.
- Updated README assumptions and browser regression coverage. Tax rules, APIs and retirement mathematics are unchanged.

## Verification

- Used Node 24.21.0 through `PATH=/tmp/finance-lint-node24/node_modules/.bin:$PATH`, matching the lint workflow’s Node major version.
- `npm ci`: passed using the locked Prettier dependency; no vulnerabilities reported.
- `node --test tests/calculators.test.js tests/pages-preview.test.cjs`: passed all 30 tests (22 calculation/validation and 8 Pages packaging/comment tests).
- `PLAYWRIGHT_MODULE=/home/akk/.npm/_npx/4d28a6818d23920b/node_modules/playwright PLAYWRIGHT_BROWSERS_PATH=/tmp/finance-browsers LD_LIBRARY_PATH=/tmp/finance-browser-libs/extracted/usr/lib/x86_64-linux-gnu TEST_BASE_URL=http://127.0.0.1:8011 TEST_SCREENSHOTS=/tmp/finance-live-results-screenshots node tests/browser.test.cjs`: passed 987 assertions across 11 routes at 320, 375, 768 and 1440 pixels with no runtime or local-resource errors. Covered every control, input focus, change events, rounded values, validation recovery, negative/zero allocation states, the independently summed 20-year EPF illustration, source links and year navigation.
- Inspected all eight saved screenshots of the home, tax, retirement and photo-credit pages at 375 and 1440 pixels. The legend, caret, tables and page layouts fit their viewports. Mobile checks used Chromium emulation; physical iOS Safari was not tested.
- `python3 -m http.server 8000 --bind 127.0.0.1`: initially blocked by sandbox socket restrictions; an authorized retry found port 8000 already occupied. `python3 -m http.server 8011 --bind 127.0.0.1` started successfully with socket access and served the browser suite.
- `npm exec -- prettier --write README.md calc/main.js calc/retirement-app.js calc/retirement-monthly-income.html calc/tax-app.js index.html photo-credits.html style.css tasks/todo.md tests/browser.test.cjs tasks/2026-10-10-live-calculator-results-and-clarity.md`: formatted the changed files.
- `npm exec -- prettier --check README.md calc/main.js calc/retirement-app.js calc/retirement-monthly-income.html calc/tax-app.js index.html photo-credits.html style.css tasks/todo.md tests/browser.test.cjs tasks/2026-10-10-live-calculator-results-and-clarity.md` and `npm run format:check`: passed changed-file and repository-wide formatting checks.
- `node --check calc/main.js`, `node --check calc/tax-app.js`, `node --check calc/retirement-app.js` and `node --check tests/browser.test.cjs`: passed JavaScript syntax checks.
- `git diff --check`: passed. Reviewed the final diff against the requested changes; no unrelated refactors or dependencies were added.
