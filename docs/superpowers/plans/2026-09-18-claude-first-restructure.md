# Claude-first Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `CLAUDE.md` the project's source of truth for agent instructions, clean and reformat the issue board to the `context-issues` skill convention, archive obsolete planning artifacts out of the default reading path, and stand up the `docs/superpowers/{specs,plans}` convention for future work.

**Architecture:** This is a documentation/file-layout restructure — no application code changes, no tests to run. Each task is a self-contained file edit or move, verified by grep checks for stale references and a final `git status` review.

**Tech Stack:** Markdown files, git.

**Spec:** [docs/superpowers/specs/2026-09-18-claude-first-restructure-design.md](../specs/2026-09-18-claude-first-restructure-design.md)

## Global Constraints

- Do not touch application code (`src/`, `tests/`), only root docs and `docs/`/`specs/` trees.
- Preserve git history on moved files: use `git mv`, never delete-and-recreate.
- Do not commit unless the user has already authorized it in this session (they have — see spec approval); still show `git status`/diff before each commit per repo policy.
- Keep Portuguese/English mix consistent with existing files (`AGENTS.md`/`CLAUDE.md` content is in English; `AGENT_ISSUES.md` entries stay in whatever language the original entry was written in).

---

### Task 1: Create `CLAUDE.md` as the source of truth, reduce `AGENTS.md` to a pointer

**Files:**
- Create: `CLAUDE.md`
- Modify: `AGENTS.md` (replace entire content)

**Interfaces:**
- Produces: `CLAUDE.md` is the file future tasks and future agent sessions reference as "the instructions file". Task 4 will link to it from `README.md`.

- [x] **Step 1: Create `CLAUDE.md` with the full migrated content**

Write this exact content to `CLAUDE.md`:

```markdown
# Agent Instructions — LabReserve

## Project at a glance

LabReserve is a local web application for lab and equipment reservations. It is a TypeScript modular monolith: a Node `node:http` API, SQLite persistence, and a React/Vite frontend in one npm package.

- **Runtime:** Node.js 22.13+ and npm 10+
- **Entry points:** `src/server/main.ts` (API) and `src/web/main.tsx` (web UI)
- **Data:** SQLite; the API defaults to local data, while automated tests use in-memory databases
- **Seed resources:** `lab-chemistry` and `equipment-microscope`

Read `README.md`, `docs/ARCHITECTURE.md`, and `AGENT_ISSUES.md` before changing behavior. Historical planning artifacts (the original implementation plan, delivered epics) live in `docs/archive/` — useful context, not required reading.

## Persistent project context

- **Work board:** `AGENT_ISSUES.md` is the persistent handoff and priority board, kept in the format the `context-issues` skill expects. Read it before every non-trivial task, update it after material progress, and leave one clear next action.
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

## Skills e processo

Este projeto usa o plugin `superpowers`. Mapeamento de quando usar cada skill:

| Situação | Skill |
|---|---|
| Mudança de comportamento ou feature nova | `superpowers:brainstorming` primeiro (classifica bounded/architectural); `superpowers:writing-plans` depois, se architectural |
| Bug ou teste falhando | `superpowers:systematic-debugging` antes de propor correção |
| Implementação de qualquer plano | `superpowers:test-driven-development` |
| Início de qualquer tarefa não-trivial | ler `AGENT_ISSUES.md` (convenção da skill `context-issues`) |
| Antes de declarar pronto ou commitar | `superpowers:verification-before-completion` + o gate completo abaixo + as duas revisões independentes quando aplicável |
| Fim de branch de feature | `superpowers:finishing-a-development-branch` |

Novas specs de brainstorming vão para `docs/superpowers/specs/`; novos planos de `writing-plans` vão para `docs/superpowers/plans/`. Isso se aplica a partir de agora — não é retroativo (`docs/archive/specs-epics/` guarda o formato antigo, já entregue).

Esta seção de skills é uma camada de processo geral que se soma ao protocolo de revisão independente abaixo — não o substitui.

## Validation and review gate

Before declaring an implementation complete, run the applicable focused tests and then the full gate:

```bash
npm run typecheck
npm run lint
npm run build
npm test
npm run test:e2e
```

Also perform a cold-start API smoke check when server behavior changes. Record implementation evidence, known limitations, and independent-review decisions in `docs/verification/`.

### Protocolo de custo para revisões independentes

- Durante cada correção, execute somente o teste focalizado necessário para o ciclo red/green; execute o gate completo uma única vez após todas as correções, e novamente apenas se uma mudança posterior de revisão alterar código.
- Antes da revisão externa, faça uma autoauditoria local e entregue aos dois revisores, em paralelo e sem compartilhamento entre eles, um briefing curto: objetivo, arquivos do diff, testes de regressão e resultados já obtidos do gate.
- A revisão externa deve inspecionar somente o diff e seus contratos diretamente afetados. Não deve repetir o gate completo já registrado; pode executar verificações focadas quando isso esclarecer um risco. As duas continuam obrigatórias, independentes e precisam aprovar.

Este protocolo foi usado e aprovado na entrega AI-003 (rodada 6, ver `AGENT_ISSUES.md` e `docs/verification/`). Reuse-o para futuras entregas que exijam revisão independente.

## Git and delivery policy

- Do not commit, push, rebase, reset, force-push, or discard changes unless the user explicitly requests that action.
- Keep WIP local and describe its validation status accurately; a passing subset is not a release approval.
- Deliveries that require independent review may be published only after the full gate and **two independent reviews pass**. Apply the cost protocol above without weakening this gate.
- Before any requested commit, inspect `git status` and the diff; include only intended files and use a conventional commit message.
- Never place credentials, tokens, local databases, Playwright reports, or generated runtime caches under version control. Respect `.gitignore`.
```

- [x] **Step 2: Replace `AGENTS.md` with a short pointer**

Write this exact content to `AGENTS.md`:

```markdown
# Agent Instructions — LabReserve

See [CLAUDE.md](CLAUDE.md) — the source of truth for agent instructions in this project (architecture, business rules, commands, working agreement, skills/process, validation gate, and Git policy).

This file is kept only for compatibility with tools that look for `AGENTS.md` by convention.
```

- [x] **Step 3: Verify no unintended content loss**

Run: `git diff AGENTS.md` and confirm the new `CLAUDE.md` contains every section that was in the old `AGENTS.md` (project at a glance, persistent project context, architecture, business rules, commands, working agreement, validation gate, cost protocol, git policy) plus the new "Skills e processo" section.

- [x] **Step 4: Commit**

```bash
git add CLAUDE.md AGENTS.md
git commit -m "docs(agents): make CLAUDE.md the source of truth, reduce AGENTS.md to a pointer"
```

---

### Task 2: Clean and reformat `AGENT_ISSUES.md` to the `context-issues` convention

**Files:**
- Modify: `AGENT_ISSUES.md` (replace entire content)

**Interfaces:**
- Consumes: the three LabReserve-relevant entries from the current `AGENT_ISSUES.md` (AI-004, AI-006, AI-002 in the old numbering) — content already read in this conversation.
- Produces: `AGENT_ISSUES.md` in the exact section/field structure the `context-issues` skill expects (`## To-do`, `## In progress`, `## Done`), so future sessions following that skill read it correctly.

- [x] **Step 1: Write the cleaned, reformatted board**

Write this exact content to `AGENT_ISSUES.md`:

```markdown
# Agent To-Do

> Persistent, project-local task list and handoff. No transcripts or secrets.

## To-do

_(empty)_

## In progress

_(empty)_

## Done

- [x] **AI-001** — Add repository-level agent instructions (2026-03-31)
  - **Evidence:** `AGENTS.md` (now superseded by `CLAUDE.md`) documented architecture, business invariants, npm commands, test-first workflow, full validation gate, verification records, commit/push constraints, and the mandatory use of `AGENT_ISSUES.md` plus `graphify-out/` as persistent project context.
  - **Context:** highest-priority task requested by the user at the time. `AGENT_ISSUES.md` remains the persistent work board.

- [x] **AI-002** — Optimize independent-review execution (2026-03-31)
  - **Evidence:** the review-scope manifest and blind-reviewer restriction to the diff and directly affected contracts were adopted as the standing cost protocol, now documented in `CLAUDE.md` under "Protocolo de custo para revisões independentes". Corrected the internal review-cap handoff from 3 to 5 rounds.
  - **Context:** used and validated by AI-003 below.

- [x] **AI-003** — Deliver LabReserve React UI, E2E coverage, and documentation (2026-09-15)
  - **Evidence:** round 6 of independent review approved (A 95%, B 95%, zero must-fix); delivered via PR #1 (`feat/labreserve-api`), merged into `main` at commit `8265e0a`. Full gate passed: typecheck, lint, build, `npm test` (19), `npm run test:e2e` (3), cold-start smoke. Records in `docs/verification/ai-002-independent-review-round-6.md` and prior rounds (3-5), plus `docs/verification/ai-002-local-audit.md` and `docs/verification/ai-002-review-findings-correction.md`.
  - **Acceptance criteria met:** users can create, filter, cancel, and inspect reservation history; E2E acceptance scenarios and documented validation pass.
  - **Context:** applied the AI-002 cost protocol (self-audit, parallel blind reviewers restricted to the diff). Historical planning artifacts for this delivery are archived at `docs/archive/IMPLEMENTATION_PLAN.md` and `docs/archive/specs-epics/`.
```

- [x] **Step 2: Verify no unrelated-project content remains**

Run: `grep -i -E "pi.agent|main-model-router|execution.path|adaptive.model" AGENT_ISSUES.md` and confirm zero matches.

- [x] **Step 3: Commit**

```bash
git add AGENT_ISSUES.md
git commit -m "docs(agent-issues): clean unrelated entries, reformat to context-issues convention"
```

---

### Task 3: Archive obsolete planning artifacts

**Files:**
- Move: `IMPLEMENTATION_PLAN.md` → `docs/archive/IMPLEMENTATION_PLAN.md`
- Move: `specs/epics/` → `docs/archive/specs-epics/`

**Interfaces:**
- Produces: `docs/archive/` directory containing both, referenced (not required) from `CLAUDE.md` (already written in Task 1) and `README.md` (Task 4).

- [x] **Step 1: Create the archive directory and move files with git mv**

```bash
mkdir -p docs/archive
git mv IMPLEMENTATION_PLAN.md docs/archive/IMPLEMENTATION_PLAN.md
git mv specs/epics docs/archive/specs-epics
```

- [x] **Step 2: Remove the now-empty `specs/` directory if nothing else lives there**

Run: `ls specs/` (or `find specs -type f`). If empty, remove it:

```bash
rmdir specs 2>/dev/null || true
```

If `specs/` contains other files besides the moved `epics/`, leave it in place and note this in the commit message.

- [x] **Step 3: Verify git tracked the moves as renames**

Run: `git status --short` and confirm entries show as `R` (rename) for the moved files, not as separate delete+add pairs losing history. `git log --follow docs/archive/IMPLEMENTATION_PLAN.md` should show the file's prior history.

- [x] **Step 4: Commit**

```bash
git add -A
git commit -m "docs(archive): move IMPLEMENTATION_PLAN.md and specs/epics to docs/archive"
```

---

### Task 4: Set up `docs/superpowers/plans/` and update `README.md`

**Files:**
- Create: `docs/superpowers/plans/.gitkeep`
- Modify: `README.md`

**Interfaces:**
- Consumes: `docs/superpowers/specs/` already exists (created when the design spec for this restructure was written).
- Produces: a `docs/superpowers/plans/` directory ready for the next `writing-plans` invocation; `README.md` pointing readers to `CLAUDE.md` and `docs/archive/`.

- [x] **Step 1: Create the plans directory placeholder**

```bash
mkdir -p docs/superpowers/plans
touch docs/superpowers/plans/.gitkeep
```

- [x] **Step 2: Update `README.md`**

In `README.md`, change the bullet:

```markdown
- **Instruções explícitas para agentes:** [AGENTS.md](AGENTS.md) define arquitetura, regras de negócio invariantes, comandos, fluxo de trabalho e política de Git.
```

to:

```markdown
- **Instruções explícitas para agentes:** [CLAUDE.md](CLAUDE.md) define arquitetura, regras de negócio invariantes, comandos, fluxo de trabalho, skills do plugin `superpowers` e política de Git. Planejamento e revisões já entregues ficam arquivados em [docs/archive/](docs/archive/).
```

- [x] **Step 3: Verify no other file references the old paths**

Run: `grep -rn "IMPLEMENTATION_PLAN.md\|specs/epics" --include="*.md" .` (excluding `docs/archive/` and `node_modules/`) and confirm any remaining hits are either inside `docs/archive/` itself or intentionally point there with the new path.

- [x] **Step 4: Commit**

```bash
git add docs/superpowers/plans/.gitkeep README.md
git commit -m "docs(readme): point to CLAUDE.md and docs/archive, scaffold superpowers plans dir"
```

---

### Task 5: Final consistency check

**Files:** none (verification only)

- [x] **Step 1: Confirm the full tree matches the spec's target layout**

Run: `find . -maxdepth 2 -not -path "./node_modules*" -not -path "./.git*" -not -path "./dist*" -not -path "./test-results*"` and compare against the "Estrutura final" section of `docs/superpowers/specs/2026-09-18-claude-first-restructure-design.md`.

- [x] **Step 2: Confirm `git status` is clean**

Run: `git status --short`. Expect no output (everything committed) or only intentionally untracked files already present before this plan started.

- [x] **Step 3: Report to the user**

Summarize the four commits made and point to the new `CLAUDE.md`, cleaned `AGENT_ISSUES.md`, and `docs/archive/` layout for their review.
