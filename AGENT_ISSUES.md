# Agent Issue Board

> Persistent, project-local handoff for agent work. Update it with each material checkpoint.

## Active

### AI-004 — Add repository-level agent instructions
- **Status:** concluída
- **Priority:** urgent
- **Goal:** create `AGENTS.md` at the repository root with project commands, conventions, validation, review, and WIP commit/push policy.
- **Evidence:** `AGENTS.md` documents the architecture, business invariants, npm commands, test-first workflow, full validation gate, verification records, commit/push constraints, and the mandatory use of `AGENT_ISSUES.md` plus `graphify-out/` as persistent project context.
- **Context:** highest-priority task requested by the user. Preserve `AGENT_ISSUES.md` as the persistent work board.
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

### AI-003 — Build repository knowledge graph
- **Completed:** 2026-03-31
- **Evidence:** generated `graphify-out/graph.json` (222 nodes, 366 edges, 15 communities), `GRAPH_REPORT.md`, `graph.html`, `manifest.json`, and `cost.json`; benchmark measured 3.8x fewer tokens per query. Health warning: 22 dangling-endpoint edges, 2 self-loops, 12 directed and 15 undirected collapsed endpoint-pair edges.

### AI-001 — Reconcile LabReserve implementation with delivery plan
- **Completed:** 2026-02-07
- **Evidence:** corrected invalid-cancellation mapping and API coverage; `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass. UI/E2E remains a documented future scope.
