# Guide for AI agents

This `AGENTS.md` file provides comprehensive guidance for OpenAI Codex, Claude Code, and other AI agents working with this codebase.

The user's job as a senior software engineer is dependent on you implementing clean code with elegant architecture.

## Repository Structure

```text
.
├── .github/workflows/  # CI, release, and documentation workflows
├── assets/            # Shared images and branding
├── charts/            # Helm charts
├── docker/            # Dockerfiles and Compose configurations
├── docs/              # User and developer documentation
├── k8s/               # Kubernetes deployment configuration
├── scripts/           # Development and documentation scripts
├── services/
│   ├── api/           # FastAPI/SQLModel backend and tests
│   └── studio/        # Svelte frontend
└── tools/             # Maintenance utilities
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
- **Protect Secrets in Command Output**: When validating Compose files that use environment files, use `docker compose config --quiet`. Do not print fully resolved Compose configuration because it expands secret environment values into command output.

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
- All tests must have a docstring stating their intention, goal, purpose, or the regression they guard against. For example: "Ensures ..." or "Asserts that ...".
- Compare behavior before and after the change when practical.
- Run the applicable checks defined in the Linting Workflow.
- Always check whether any project documentation needs updating, even when documentation was not mentioned in the task. Update all affected docs before reporting completion.
- Keep verification proportional to the scope and risk of the change.

#### Local development environment

- Use `uv` when available.
- Run backend tests from the repository root: `uv run --project services/api --extra test pytest services/api/tests/`. Pytest config lives in `services/api/pyproject.toml`; the `.env` at the repo root feeds `ENV_CONFIG` (pydantic-settings).
- Docker is available on the host. Shared-service tests use `docker/compose.dev.yml`. Tests marked `onprem` require model deployment infrastructure.
- Run parallel tests with `pytest services/api/tests/ -m "not serial and not onprem" -n auto --dist worksteal`, then shared-service tests with `pytest services/api/tests/ -m "serial and not onprem" -n 0`.
- Use `setup_test_db` for isolated async database tests. See `docs/Guides-for-Devs/testing-and-ci.md` for test isolation guidance.

For backend changes requiring running services:

1. Validate the Compose configuration without exposing secrets: `docker compose -p tv --env-file .env -f docker/compose.dev.yml config --quiet`
2. Start only the services required by the affected tests.
3. Rebuild or force-recreate services only when the change requires it.
4. Verify readiness using configured health checks, service status, relevant logs, or an explicit endpoint probe.
5. Run the narrowest relevant tests first.
6. For substantial or shared backend changes, run: `pytest services/api/tests/ -m "not onprem"`; include on-prem tests when the scope requires them and the environment supports them.

Before reporting completion, review the final diff and ask:

- Does every change relate to a requirement?
- Did the change introduce unnecessary complexity or scope?
- Would a staff engineer approve the implementation and verification evidence?

#### Python Tests

- Run tests (especially async tests that invoke the OpenAI or Anthropic SDK) with escalated permissions on the first attempt. Their first-request platform detection uses `asyncio.to_thread()`, while the sandbox blocks the Unix socketpair wakeup that asyncio uses to deliver the worker result. Inside the sandbox these tests can therefore stall before reaching `MockTransport`; this is an environment limitation, not a cassette or SDK parsing failure.

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

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Create the dated completion record in `tasks/` using the required [PR description format](#pr-descriptions).
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

### 8. Linting Workflow

- Run formatting, linting, and static analysis after implementation and before reporting completion.
- The `.github/workflows/lint.yml` workflow is the source of truth. Before running checks, inspect it and use the commands, installation method, configuration, and tool versions selected by that workflow. Do not substitute globally installed tools or copy version numbers into this document.
- Start with changed files for fast feedback, then run the applicable repository-wide checks used by CI.
- When editing or creating Markdown files, run every applicable formatting or linting checks.

Always run `npx prettier` commands with escalated permissions on the first attempt. Do not try them in the sandbox first because `npx` requires registry and cache access to resolve Prettier.

Do not format unrelated files merely to make a repository-wide check pass.

#### Backend

From the repository root:

1. Inspect the Ruff installation and check steps in `.github/workflows/lint.yml`.
2. Install or select Ruff using the workflow's current version constraint.
3. Confirm the selected version: `ruff --version`
4. Format changed Python files: `ruff format --config services/api/pyproject.toml <changed-python-files>`
5. Check changed Python files: `ruff check --config services/api/pyproject.toml <changed-python-files>`
6. Run the same repository-wide Ruff format check and lint check configured in CI.

Do not run automatic fixes across the entire repository unless explicitly required by the task.

#### Frontend

From `services/studio`:

1. Inspect the Prettier installation and formatting steps in `.github/workflows/lint.yml`.
2. Use the Prettier version and invocation selected by that workflow.
3. Format and check changed files before running the same repository-wide formatting check configured in CI.
4. Run ESLint and the package's formatting check: `npm run lint`
5. Run Svelte and TypeScript diagnostics: `npm run check`

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
- **Pin dependency versions**: Use exact versions (e.g. `"2.0.0"`) in `package.json` and `pyproject.toml`. Never use caret (`^`) or tilde (`~`) ranges.

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

### Backend Conventions

Always follow `services/api/CONVENTIONS-BACKEND.md`.

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

- Existing release tags in this repository are annotated tags, not lightweight tags.
- Before creating a release tag, fetch the latest main branch and tags: `git fetch origin main --tags`
- Verify the intended tag target before tagging: `git rev-parse main`, `git rev-parse origin/main`, and `git rev-parse FETCH_HEAD`
- Create release tags as annotated tags using the existing message style: `git tag -a vYYYY.MM.DD <commit-sha> -m 'Release YYYY.MM.DD'`
- Verify the new tag is annotated and points at the intended commit: `git for-each-ref refs/tags/vYYYY.MM.DD --format='%(refname:short) %(objecttype) %(objectname) %(*objectname) %(contents:subject)'`
- Push only the release tag: `git push origin vYYYY.MM.DD`
- If a lightweight tag is created locally by mistake, delete and recreate it as annotated before pushing: `git tag -d vYYYY.MM.DD`
