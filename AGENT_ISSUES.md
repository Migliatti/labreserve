# Agent Issue Board

> Persistent, project-local handoff for agent work. Update it with each material checkpoint.

## Active

### AI-004 — Add repository-level agent instructions
- **Status:** pending
- **Priority:** urgent
- **Goal:** create `AGENTS.md` at the repository root with project commands, conventions, validation, review, and WIP commit/push policy.
- **Next action:** review the existing project configuration and write `AGENTS.md` before resuming other work.
- **Acceptance criteria:** a fresh coding agent can follow the repository workflow without relying on chat context.
- **Depends on:** none
- **Context:** highest-priority task requested by the user. Preserve `AGENT_ISSUES.md` as the persistent work board.
- **Updated:** 2026-03-31

### AI-003 — Build repository knowledge graph
- **Status:** in progress
- **Goal:** run the full graphify pipeline on the repository.
- **Next action:** resume only after AI-004 is completed.
- **Acceptance criteria:** `graphify-out/graph.json`, `GRAPH_REPORT.md`, and `graph.html` exist and graph health is reported.
- **Blockers:** none.
- **Context:** detected 49 supported files (~8,127 words): 28 code and 21 documents.
- **Updated:** 2026-03-31

### AI-002 — Deliver LabReserve React UI, E2E coverage, and documentation
- **Status:** em correção
- **Goal:** provide the planned browser interface and acceptance coverage for resource reservations.
- **Next action:** corrigir os achados bloqueadores da revisão (histórico inexistente, isolamento/cobertura E2E, validação de datas e segurança HTTP) após retomar em outra máquina; repetir gate e revisões.
- **Acceptance criteria:** users can create, filter, cancel, and inspect reservation history; E2E acceptance scenarios and documented validation pass.
- **Blockers:** revisão independente reprovada; este é um checkpoint WIP autorizado para troca de máquina, não uma publicação de entrega.
- **Context:** Full gate passed before review: cold-start API smoke; `npm run typecheck`; `npm run lint`; `npm run build`; `npm test` (13 passing); and `npm run test:e2e` (2 passing). A primeira revisão identificou estado compartilhado na UI, startup, isolamento E2E, fuso e documentação; correções foram aplicadas. A segunda revisão ainda bloqueia por histórico inexistente retornando 200, isolamento/cobertura E2E, validação de datas e segurança HTTP. Usuário autorizou commit e push após gate e duas revisões aprovadas.
- **Updated:** 2026-03-31

## Done

### AI-001 — Reconcile LabReserve implementation with delivery plan
- **Completed:** 2026-02-07
- **Evidence:** corrected invalid-cancellation mapping and API coverage; `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass. UI/E2E remains a documented future scope.
