# Guide for AI agents

This `AGENTS.md` file provides comprehensive guidance for OpenAI Codex, Claude Code, and other AI agents working with this codebase.

The user's job as a senior software engineer is dependent on you implementing clean code with elegant architecture.

## Repository Structure

```text
.
├── index.html         # Calculator home page
├── photo-credits.html # Image attribution
├── style.css          # Shared responsive styling
├── calc/              # Calculator pages, applications and calculation engine
├── img/               # Project photographs
├── tests/             # Node calculation and optional Playwright browser tests
├── scripts/           # Pages snapshot packaging, comments and runtime-path configuration
├── tasks/             # Local, untracked plans and dated completion records
├── .github/workflows/ # Formatting checks and Pages production/PR deployments
├── package.json       # Pinned development-only formatting dependency
├── .prettierrc.json    # Formatting configuration
└── README.md          # Local setup, tests and calculation assumptions
```

## Core Principles

- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Simplicity First**: Make every change as simple as possible. Only touch what's necessary. Impact minimal code. Over-complication leads to bugs.
  1. Always start with thorough understanding of the problem and motivation
  2. Does this functionality need to exist? → no: challenge or skip it (YAGNI)
  3. Already in this codebase? → reuse or extend it, don't rewrite
  4. Stdlib does it? → use it
  5. Native platform feature? → use it
  6. Installed dependency? → use it
  7. One line? → one line
  8. Only then: the minimum that works
- **Simplify After Implementation**: Treat the first working version and the requirements behind it as drafts.
  1. Run relevant tests to uncover hidden requirements and assumptions.
  2. Relate every code path back to a concrete requirement, and challenge whether that requirement is truly necessary (first principles approach).
  3. Review the full diff for unnecessary abstractions, branches, defensive code, and overly strict guarantees.
  4. Prefer sufficient correctness over absolute correctness: for example, eventual consistency when acceptable, or simple retries when failure is cheap and recoverable.
  5. Remove or relax requirements that do not justify their complexity. Simplify immediately when behavior is preserved; otherwise present the proposed change, benefits, and trade-offs to the user.
- **Protect Secrets in Command Output**: Do not print secret environment values or configuration that expands them. Use quiet validation when supported.

## Workflow Orchestration

### 1. Planning

- For non-trivial work, create a concise implementation plan before editing.
- Proceed without waiting for approval when the requested outcome is clear and the changes are low-risk.
- Ask for clarification only when ambiguity would materially change behavior, public interfaces, data, security, or architecture.
- Re-plan when evidence invalidates the current approach.
- Keep planning proportional to the task; do not create process overhead for straightforward changes.

### 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Task Tracking

- `tasks/` is ignored by Git, so plans, completion records and lessons stay local and out of review. Never commit them; the pull request description carries the same content.
- Use `tasks/todo.md` for substantial, multi-stage work when persistent tracking is useful.
- Do not create or modify `tasks/todo.md` for small or routine changes; the completion record below is still required.
- At the end of every feature, bug fix, or task, before the final handoff, create `tasks/YYYY-MM-DD-<task-name>.md`. Use the completion date and a short, descriptive, lowercase task name with hyphens.
- Write the completion record using the structure and wording rules in [PR Descriptions](#pr-descriptions).
- Record only durable, project-specific lessons in `tasks/lessons.md`.
- Do not record one-off user preferences, speculative conclusions, or conversational details.
- A user correction is evidence to reconsider the approach, not an automatic reason to create a permanent rule.

### 4. Verification Before Done

- Run the strongest applicable verification available in the current environment.
- Never claim that a check passed unless it was actually run and passed.
- When a check cannot be run, report the exact command not run and the reason.
- Distinguish failures introduced by the current change from pre-existing or environment-dependent failures.
- Verify the behavior affected by the change, not merely that the code compiles.
- Add or update regression tests when fixing a reproducible defect.
- All tests must have a JSDoc comment stating their intention, goal, purpose, or the regression they guard against. For example: "Ensures ..." or "Asserts that ...".
- Compare behavior before and after the change when practical.
- Run the applicable checks defined in the Linting Workflow.
- Always check whether any project documentation needs updating, even when documentation was not mentioned in the task. Update all affected docs before reporting completion.
- Keep verification proportional to the scope and risk of the change.

#### Local development environment

- This is a static HTML/CSS/JavaScript site with no build step or runtime dependencies.
- Serve it from the repository root: `python3 -m http.server 8000 --bind 127.0.0.1`.
- Run calculation and input-validation tests: `node --test tests/calculators.test.js`.
- Run Pages packaging/comment regression tests: `node --test tests/pages-preview.test.cjs`. These tests spawn Git for isolated synthetic repositories; use permissions that allow subprocesses if the sandbox restricts them.
- If child processes are restricted, use `node tests/calculators.test.js`, or `node --test --test-isolation=none tests/calculators.test.js` with a recent Node release.
- For changes affecting browser behavior or layout, follow the optional Playwright setup in [README.md](README.md#tests) and run `node tests/browser.test.cjs` with the documented module path and local server.
- Inspect relevant desktop and mobile screenshots for layout changes. Distinguish browser mobile emulation from physical-device verification.
- `.github/workflows/pages.yml` deploys current remote main at the site root and open same-repository PR snapshots under `pr-preview/<number>/`. Preserve that separation, copy only configured runtime regular blobs, and do not execute application build scripts from preview sources. Fork PR previews are excluded.
- Publish preview comments only after successful deployment. Rebuild from current refs and reconcile closed-preview comments on each successful run, since a newer queued Pages event can replace an earlier close event. `_site/` is generated output.

Before reporting completion, review the final diff and ask:

- Does every change relate to a requirement?
- Did the change introduce unnecessary complexity or scope?
- Would a staff engineer approve the implementation and verification evidence?

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes – don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests – then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

### 7. Task Management

1. **Plan First**: Write checkable items to `tasks/todo.md` when [Task Tracking](#3-task-tracking) calls for persistent tracking.
2. **Communicate Plan**: Share the approach before implementation; proceed without approval when authorized and clear.
3. **Track Progress**: Mark tracked items complete as you go.
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Create the dated completion record in `tasks/` using the required [PR description format](#pr-descriptions).
6. **Capture Lessons**: Update `tasks/lessons.md` only for durable, project-specific lessons as described above.

### 8. Linting Workflow

- Run formatting, linting, and static analysis after implementation and before reporting completion.
- The `.github/workflows/lint.yml` workflow is the source of truth. Use its Node version and `npm ci` installation before running `npm run format:check`. Prettier is pinned in `package.json` and uses `.prettierrc.json`.
- Start with changed files for fast feedback, then run the repository-wide formatting check.
- When editing or creating Markdown files, run the applicable formatting checks.

Install dependencies with network and cache access when the sandbox restricts them. Use the installed Prettier through package scripts instead of resolving an unpinned version through `npx`.

From the repository root:

1. Install the locked development dependencies: `npm ci`.
2. Format changed supported files with the installed tool: `npm exec -- prettier --write <changed-files>`.
3. Check changed files with `npm exec -- prettier --check <changed-files>`, then run the repository-wide CI check: `npm run format:check`.
4. For JavaScript changes, run `node --check <changed-javascript-file>` for each changed file.
5. Run the applicable calculation or browser tests described above. Documentation-only changes do not require application tests.

Do not format unrelated files merely to make a repository-wide check pass.

#### Failure Handling

- When a project-wide check fails, rerun the narrowest relevant command to determine whether the failure was caused by the current change.
- Fix failures introduced by the current change.
- Do not modify unrelated code to resolve pre-existing failures.
- Report pre-existing, infrastructure-dependent, or environment-dependent failures with the exact command and relevant error.
- Never describe a skipped, incomplete, or failing check as passing.
- In the final handoff, list the verification, test, formatting, linting, and static-analysis commands run, together with their outcomes.

### 9. Repository Safety

- Inspect `git status` and the relevant diff before editing.
- Preserve existing uncommitted changes and never overwrite work you did not create.
- Do not use destructive Git commands such as `reset --hard`, `clean`, or broad checkout/restore operations unless explicitly requested.
- Do not commit, push, create branches, or open pull requests unless requested.
- Avoid modifying generated files unless the project workflow requires regeneration.
- Keep unrelated formatting, refactors, dependency updates, and lockfile changes out of the diff.

## PR Descriptions

- Use the structure below for GitHub PR descriptions and dated task completion records.
- Start PR descriptions with `## Summary`; do not repeat the PR title in the description. Dated task completion records should prepend a `# <task title>` heading.
- Before choosing a PR title, review the latest commits on the remote main branch (`git fetch origin main`, then `git log origin/main -10 --format=%s`) and follow the style of comparable changes, preferring area prefixes found in that history.
- Use declarative statements to describe completed changes, their purpose, and resulting behavior. For example "Replaced ..." or "The workflow now uses ...".
- Lead with the concrete problem and resulting behavior. Write for a reviewer who has not read the conversation, and keep details proportional to the change.
- Keep the title and description aligned with the final diff. Omit conversational history and abandoned approaches unless they explain a necessary trade-off.
- List verification commands and their actual outcomes. Include failed or skipped checks and their reasons; never claim an unrun check passed. Distinguish completed implementation from unverified deployment or runtime behavior.

```markdown
# <PR title>

## Summary

- <Completed change and its purpose>

## Verification

- `<command>`: <outcome, or reason it was not run>
```

## Coding Conventions

### General Conventions

- When writing prompts, avoid using non-ASCII symbols.
- Follow the existing code style in each file.
- Use meaningful variable and function names.
- **Pin dependency versions**: If dependencies are added, use exact versions (e.g. `"2.0.0"`) in their manifests and setup commands. Never use caret (`^`) or tilde (`~`) ranges.

### Code Comments

- Prefer clear code, meaningful names, and straightforward structure over comments that merely describe what the code does.
- Add comments when the reason behind an implementation would not be obvious to another developer.
- In particular, comment logic that:
  - may be surprising or counter-intuitive;
  - encodes a business rule or architectural decision;
  - intentionally deviates from established conventions or the most obvious implementation;
  - reflects an accepted trade-off, limitation, workaround, or compatibility constraint;
  - depends on subtle assumptions, ordering requirements, external behaviour, or non-obvious invariants;
  - is sufficiently complex that its intent or correctness would otherwise be difficult to verify.

- Comments should explain **why** the implementation exists, what constraint or decision led to it, and — when useful — what could go wrong if it is changed.
- Do not add comments that simply restate the code, narrate each operation, or compensate for unnecessarily complicated implementation.
- Keep comments accurate when modifying the associated code. Remove comments that are obsolete, misleading, or no longer useful.

## Code Review and Refactoring Guidelines

- Prioritize correctness, security, data integrity, and behavioral regressions.
- Identify duplicated logic, unnecessary branches, and avoidable complexity.
- Keep variant-specific behavior in explicit, responsibility-focused paths.
- Place genuinely shared validation, state updates, processing, and finalization in one location.
- Preserve observable behavior, ordering, errors, and public interfaces unless a change is explicitly requested.
- Prefer straightforward control flow over premature helper abstractions.
- Ensure abstractions reduce cognitive load rather than merely moving code.
- Touch only code relevant to the review or refactor.
- Add or update regression tests for every affected path and edge case.
- Review the final diff and confirm the result is materially simpler.
- Always provide concrete findings and recommended solutions.
- Check compliance with this `AGENTS.md` and project conventions.

## Release Tagging

- Create or push release tags only when requested by the user.
- Before tagging, fetch the relevant remote branch and tags, inspect existing tag names, types and messages, and follow the verified repository convention.
- If no convention exists, prefer an annotated tag; do not invent a version or date scheme.
- Verify the intended commit and the new tag's type and target before pushing only the requested tag.
