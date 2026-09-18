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
