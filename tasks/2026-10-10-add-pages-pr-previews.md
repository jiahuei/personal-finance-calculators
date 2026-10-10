# Add GitHub Pages pull request previews

## Summary

- Added a single Pages workflow that publishes current remote main at the root and immutable snapshots of open same-repository PRs under `pr-preview/<number>/`, preserving production independently of the workflow checkout.
- Added regular Git blob extraction restricted to runtime paths, with no PR application build scripts, fork previews, symlinks, traversal paths or published repository tooling.
- Added preview comments containing the deployed URL and exact source commit after successful deployment; subsequent successful runs remove closed previews and reconcile their existing comments even if a queued close event was replaced.
- Added eight packaging/comment regressions to Pages and lint CI, updated project and agent documentation, and ignored generated `_site/` output.

## Verification

- `node --test tests/pages-preview.test.cjs`: all eight tests passed with Node 24.21.0 and Git subprocess access.
- `node tests/pages-preview.test.cjs`: the first sandbox run failed with `spawnSync git EPERM`; the unchanged seven-test suite passed outside the sandbox before the pagination regression was added.
- `node tests/calculators.test.js`: all 22 calculation tests passed with Node 24.21.0.
- `node --check scripts/pages-preview.cjs` and `node --check tests/pages-preview.test.cjs`: passed.
- `npm run format:check`: passed for all supported repository files.
- `python3 -` with PyYAML: validated Pages triggers, pinned actions, deployment/comment permission boundaries, concurrency and test commands.
- `git diff --check`: passed.
- [Pages run 38062806163](https://github.com/jiahuei/personal-finance-calculators/actions/runs/38062806163): packaging, deployment and preview-comment jobs passed. The first deployment was blocked by the main-only environment rule created when switching Pages to workflow publishing; allowing the intended PR merge refs resolved the restriction, and the failed job rerun passed.
- `node /tmp/finance-hosted-preview-smoke.cjs`: 64 hosted checks passed across all 11 routes, mobile/desktop layouts, tap/blur focus, year navigation, updated graphs and preview-relative assets at the [live PR preview](https://jiahuei.github.io/personal-finance-calculators/pr-preview/1/). The production homepage was byte-identical to `git show origin/main:index.html`.
