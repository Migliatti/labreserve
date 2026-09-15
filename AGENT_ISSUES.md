# Agent Issue Board

> Persistent, project-local handoff for agent work. Update it with each material checkpoint.

## Active

### AI-010 — Restaurar seleção automática do modelo principal
- **Status:** concluída
- **Priority:** high
- **Goal:** criar a extensão global **Adaptive Model** para escolher o modelo/esforço principal automaticamente, sem iniciar ou decidir orquestração.
- **Evidence:** criada `~/.pi/agent/extensions/adaptive-model/` com `policy.ts` testável e extensão global. A seleção escolhe Luna/Terra/Sol e nível de raciocínio, não importa nem inicia subagentes. Dois testes de rota e o carregamento offline/global aprovaram.
- **Context:** Execution Path permanece responsável apenas por oferecer escolha explícita de orquestração.
- **Updated:** 2026-03-31

### AI-009 — Migrar a escolha global para Execution Path
- **Status:** concluída
- **Priority:** high
- **Goal:** remover o `main-model-router` global e manter somente o seletor global **Execution Path**, sem injetar política em tarefas locais.
- **Evidence:** o diretório global `~/.pi/agent/extensions/main-model-router` foi removido e migrado para `~/.pi/agent/extensions/execution-path`. A nova extensão não altera modelo principal, fica silenciosa para tarefas locais e oferece o seletor somente para trabalho delegável. Testes (27) e carregamento global offline aprovados.
- **Context:** Execution Path permanece global; recarregar o Pi substitui a instância antiga já carregada.
- **Updated:** 2026-03-31

### AI-008 — Substituir delegação automática por escolha de execução
- **Status:** concluída
- **Priority:** high
- **Goal:** apresentar o seletor **Execution Path** para trabalho delegável, permitindo escolher execução local, subagentes ou cancelamento.
- **Evidence:** `policy.test.ts` confirma que trabalho delegável não inicia automaticamente e requer escolha. `index.ts` apresenta **Choose an Execution Path** com Stay Local, Launch a Crew e Not Now; em modo sem UI permanece local. `VALIDATION.md` foi atualizado. A suíte da extensão aprovou 27 testes e o carregamento offline aprovou.
- **Context:** solicitado pelo usuário para evitar delegação surpresa; em modos sem UI, a execução deve permanecer local.
- **Updated:** 2026-03-31

### AI-007 — Corrigir retomada de orquestração explícita
- **Status:** concluída
- **Priority:** high
- **Goal:** evitar que o roteador global classifique como local um pedido explícito para executar revisão/delegação já contextualizada.
- **Evidence:** a regressão em `~/.pi/agent/extensions/main-model-router/policy.test.ts` agora classifica “Pode executar uma revisão com dois agentes independentes” como `delegate` de risco elevado. `policy.ts` reconhece `review`/`revisão` como risco elevado. `node --experimental-strip-types --test .../*.test.ts` aprovou 27 testes e a extensão carregou com `pi --offline ... --list-models`.
- **Context:** o classificador atual analisa somente o texto; pedidos implícitos como “Pode executar” isoladamente permanecem locais por serem ambíguos.
- **Updated:** 2026-03-31

### AI-004 — Add repository-level agent instructions
- **Status:** concluída
- **Priority:** urgent
- **Goal:** create `AGENTS.md` at the repository root with project commands, conventions, validation, review, and WIP commit/push policy.
- **Evidence:** `AGENTS.md` documents the architecture, business invariants, npm commands, test-first workflow, full validation gate, verification records, commit/push constraints, and the mandatory use of `AGENT_ISSUES.md` plus `graphify-out/` as persistent project context.
- **Context:** highest-priority task requested by the user. Preserve `AGENT_ISSUES.md` as the persistent work board.
- **Updated:** 2026-03-31

## Done

### AI-002 — Deliver LabReserve React UI, E2E coverage, and documentation
- **Completed:** 2026-09-15
- **Evidence:** rodada 6 de revisão independente aprovada; entregue via PR #1 (`feat/labreserve-api`), mesclado em `main` no commit `8265e0a`.
- **Goal:** provide the planned browser interface and acceptance coverage for resource reservations.
- **Decision (2026-09-15):** o usuário escolheu a opção 1 e autorizou a execução completa.
- **Progress:** rodada 6 executada em 2026-09-15 e **aprovada** (A 95%, B 95%, zero must-fix): 413 drenado com teto de 64 MiB/5 s e regressão 2/8 MiB, E2E fora de ordem com detecção comprovada por mutação 3/3, espera pelo seletor de recurso e validação de data em português. Gate: typecheck, lint, build, `npm test` (19), `npm run test:e2e` (3), smoke. Registro em `docs/verification/ai-002-independent-review-round-6.md`. Antes: rodada 5 executada em 2026-09-15 e **reprovada** (A 84% com 1 must-fix; B 94% aprova). Ambos confirmaram as correções da rodada 4 e, independentemente, reproduziram `ECONNRESET` sem status 413 para corpos de 2–20 MiB em `src/server/app-server.ts` (corpo não drenado antes do fechamento). Should-fix: E2E de resposta fora de ordem com baixa detecção de regressão, criação antes do carregamento de recursos, mensagem `Invalid time value` crua. Registro em `docs/verification/ai-002-independent-review-round-5.md`. Anteriormente: a autoauditoria foi aprovada e registrou o manifesto de escopo, a inspeção de segurança/tipos/clareza e a validação reutilizada em `docs/verification/ai-002-local-audit.md`. A investigação local não encontrou artefatos, referências, commits ou objetos Git que comprovem as rodadas 4 e 5; a alegação anterior de quinta reprovação (84%/86%) foi removida por não ter evidência. O teste E2E de race usa uma barreira controlada: retém a primeira resposta, aguarda a segunda resposta filtrada e só então libera a obsoleta. A cobertura API transmite upload chunked em quatro escritas, verifica o limite incremental, `Content-Length` de `9007199254740992` e que logger que lança não altera a resposta 500 segura. A rodada 4 foi reprovada: ambos os revisores identificaram `toIso()` fora do `try` na UI como `must-fix`; o revisor B também identificou flakiness no helper E2E. Ambas as correções receberam regressão E2E. Gate completo repetido em 2026-03-31: typecheck, lint, build, `npm test` (18), `npm run test:e2e` (3, 2 workers) e cold-start smoke aprovados; evidência em `docs/verification/ai-002-review-findings-correction.md`.
- **Acceptance criteria:** users can create, filter, cancel, and inspect reservation history; E2E acceptance scenarios and documented validation pass.
- **Context:** Corrigidos anteriormente: histórico inexistente agora retorna 404; ISO impossível é rejeitado; API recebeu cabeçalhos de segurança, tipo de conteúdo obrigatório e limite de 1 MiB; E2E roda em 2 workers com recursos distintos e asserções vinculadas ao dado do cenário. A rodada 3 confirmou três correções necessárias; decisão em `docs/verification/ai-002-independent-review-round-3.md`. A revisão seguinte encontrou cenários chunked e closures obsoletas; ambos foram corrigidos com regressões API/E2E: corpo acima de 1 MiB responde 413 sem reset antes da resposta, fecha a conexão e usa `Content-Length`; atualizações de UI ignoram respostas obsoletas e leem filtros atuais; exceções imprevistas são registradas internamente. Gate local aprovado em 2026-03-31: smoke cold-start, typecheck, lint, build, `npm test` (17) e `npm run test:e2e` (2). O protocolo econômico de AI-002 foi registrado em `AGENTS.md`: testes focados por ciclo, um gate final e duas revisões independentes paralelas restritas ao diff. O usuário autorizou manter a alteração de metadados em `package-lock.json`. `graphify . --update` foi tentado, mas a versão local exigiu chave LLM para 23 documentos; os artefatos publicados existentes foram preservados.

### AI-006 — Optimize independent-review execution
- **Completed:** 2026-03-31
- **Evidence:** global `audit-code` now mandates a review-scope manifest; global `request-review` restricts both blind reviewers to the diff and directly affected contracts, requires reuse of recorded full-gate evidence, and permits only justified focused checks. Corrected its internal review-cap handoff from 3 to 5 rounds.

### AI-005 — Add MIT license
- **Completed:** 2026-03-31
- **Evidence:** added root `LICENSE` with the standard MIT text and copyright notice for Gabriel Speedpro.

### AI-003 — Build repository knowledge graph
- **Completed:** 2026-03-31
- **Evidence:** generated `graphify-out/graph.json` (222 nodes, 366 edges, 15 communities), `GRAPH_REPORT.md`, `graph.html`, `manifest.json`, and `cost.json`; benchmark measured 3.8x fewer tokens per query. Health warning: 22 dangling-endpoint edges, 2 self-loops, 12 directed and 15 undirected collapsed endpoint-pair edges.

### AI-001 — Reconcile LabReserve implementation with delivery plan
- **Completed:** 2026-02-07
- **Evidence:** corrected invalid-cancellation mapping and API coverage; `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass. UI/E2E remains a documented future scope.
