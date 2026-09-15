# Agent Instructions — LabReserve

## Project at a glance

LabReserve is a local web application for lab and equipment reservations. It is a TypeScript modular monolith: a Node `node:http` API, SQLite persistence, and a React/Vite frontend in one npm package.

- **Runtime:** Node.js 22.13+ and npm 10+
- **Entry points:** `src/server/main.ts` (API) and `src/web/main.tsx` (web UI)
- **Data:** SQLite; the API defaults to local data, while automated tests use in-memory databases
- **Seed resources:** `lab-chemistry` and `equipment-microscope`

Read `README.md`, `docs/ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, and `AGENT_ISSUES.md` before changing behavior.

## Persistent project context

- **Work board:** `AGENT_ISSUES.md` is the persistent handoff and priority board. Read it before every non-trivial task, update it after material progress, and leave one clear next action.
- **Knowledge graph:** `graphify-out/graph.json` is the repository knowledge map. For questions about the codebase, architecture, relationships, or implementation paths, query the existing graph first (`graphify query "<question>"`) instead of rebuilding it. Consult `graphify-out/GRAPH_REPORT.md` for its coverage and integrity notes.
- Keep the published graph artifacts when changing the repository. Do not version Graphify runtime caches or temporary extraction files; `.gitignore` defines them.

## Architecture and boundaries

```text
src/domain/       Pure entities, time intervals, overlap rules, state transitions
src/application/  Use cases, ports/contracts, application errors
src/persistence/  SQLite schema, seed data, repository implementation
src/server/       Composition, HTTP routes, request validation, error mapping
src/web/          React UI, API client, styles

tests/domain/       Unit tests
tests/integration/ Persistence and use-case tests
tests/api/          HTTP contract tests
tests/e2e/          Playwright acceptance tests
```

Dependencies point inward: `web` and `server` may depend on `application`; `application` depends on `domain` and contracts; `persistence` implements contracts. Do not put business rules in HTTP handlers, React components, or SQLite queries. The domain must not import HTTP, React, or SQLite.

## Business rules that must remain true

- A reservation requires `endAt` strictly after `startAt`.
- Timestamps accepted by the API require ISO 8601 with an explicit offset/time zone; store normalized UTC ISO strings.
- A confirmed reservation conflicts only when `newStart < existingEnd && newEnd > existingStart`; consecutive reservations are valid.
- Cancelled reservations do not block availability.
- Reservations begin `CONFIRMED`, can be cancelled once, and cannot be edited or reactivated.
- Creation/cancellation and their reservation events must be atomic.
- The API is authoritative: the UI may improve usability but must not duplicate or bypass reservation validation.
- Success responses use `{ "data": ... }`; expected failures use the documented error shape and never expose an internal stack trace.

## Development commands

```bash
npm install
npm run dev:api                       # API at http://127.0.0.1:3000
npm run dev                           # Vite UI at http://127.0.0.1:5173
npm test                              # node:test unit, integration, and API tests
npm run test:e2e                      # Playwright acceptance tests
npm run typecheck
npm run lint
npm run build                         # typecheck plus Vite build
```

For a targeted red/green loop, run the smallest relevant test first, for example:

```bash
npm test -- tests/domain/time-interval.test.ts
npm test -- tests/api/reservations-api.test.ts
npm run test:e2e -- --grep "histórico"
```

Playwright starts its own API and Vite servers with an in-memory database. Do not rely on an already-running development server when validating E2E tests.

## Working agreement

1. Check `AGENT_ISSUES.md` first; treat it as the persistent handoff board. Keep tasks concise and update it after material progress.
2. Inspect the existing implementation and tests before proposing a change. Preserve unrelated user changes.
3. Work test-first for behavior changes: demonstrate the focused failure, implement the minimal fix, then refactor.
4. Add or adjust coverage at the appropriate boundary. Changes to HTTP contracts or user flows normally require API and/or E2E coverage, not only a UI test.
5. Do not add frameworks, ORMs, component libraries, caches, queues, or other dependencies without a concrete requirement and approval.
6. Keep code and user-facing documentation in Portuguese where existing product text uses Portuguese; keep identifiers consistent with the existing TypeScript codebase.

## Validation and review gate

Before declaring an implementation complete, run the applicable focused tests and then the full gate:

```bash
npm run typecheck
npm run lint
npm run build
npm test
npm run test:e2e
```

Also perform a cold-start API smoke check when server behavior changes. Record implementation evidence, known limitations, and independent-review decisions in `docs/verification/` as required by `IMPLEMENTATION_PLAN.md`.

The current delivery task (AI-002) remains blocked until the review findings are corrected and the gate plus independent review are repeated. Its current priority findings are: nonexistent reservation-history handling, E2E isolation/coverage, date validation, and HTTP security.

## Git and delivery policy

- Do not commit, push, rebase, reset, force-push, or discard changes unless the user explicitly requests that action.
- Keep WIP local and describe its validation status accurately; a passing subset is not a release approval.
- For AI-002, the existing conditional authorization applies only after the full gate and **two independent reviews pass**. Until then, do not publish a delivery.
- Before any requested commit, inspect `git status` and the diff; include only intended files and use a conventional commit message.
- Never place credentials, tokens, local databases, Playwright reports, or generated runtime caches under version control. Respect `.gitignore`.
