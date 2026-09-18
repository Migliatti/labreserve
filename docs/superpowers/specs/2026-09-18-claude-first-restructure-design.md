# Reestruturação Claude-first e processo de skills — Design

**Data:** 2026-09-18
**Status:** aprovado, pendente de implementação

## Contexto

O LabReserve usava `AGENTS.md` como fonte única de instruções para agentes,
`AGENT_ISSUES.md` como quadro de handoff manual, e `specs/epics/` +
`IMPLEMENTATION_PLAN.md` como histórico de planejamento da entrega já
concluída (AI-002, PR #1). Não havia `CLAUDE.md`, nem convenção de onde o
Claude Code deveria salvar novas specs/planos, nem mapeamento de quais
skills do plugin `superpowers` se aplicam a quais situações neste projeto.

Dois problemas motivaram a reestruturação:

1. **Não era "Claude first".** `CLAUDE.md` é o arquivo que o Claude Code
   carrega automaticamente; sem ele, as instruções do projeto dependiam de
   um agente ler `AGENTS.md` por convenção externa, não por comportamento
   nativo da ferramenta.
2. **`AGENT_ISSUES.md` estava contaminado.** Continha entradas (AI-007 a
   AI-010) sobre um projeto não relacionado ("Pi agent", "main-model-router",
   `~/.pi/agent/extensions/`) misturadas com o histórico real do LabReserve
   (AI-002, AI-004, AI-006).

## Decisões

### 1. `CLAUDE.md` como fonte da verdade

- Todo o conteúdo atual de `AGENTS.md` migra para `CLAUDE.md` (raiz do
  projeto): visão geral, arquitetura, regras de negócio, comandos, fluxo
  de trabalho, gate de validação e política de Git.
- `AGENTS.md` passa a ser um redirecionamento curto para `CLAUDE.md`,
  mantido só para compatibilidade com ferramentas externas que leem esse
  nome de arquivo por convenção.
- `CLAUDE.md` ganha uma seção nova, **"Skills e processo"** (ver seção 4).
- Leitura obrigatória documentada em `CLAUDE.md` passa a ser apenas:
  `README.md`, `docs/ARCHITECTURE.md`, `AGENT_ISSUES.md`. `IMPLEMENTATION_PLAN.md`
  sai dessa lista (ver seção 3).

### 2. `AGENT_ISSUES.md` no formato da skill `context-issues`

- Limpar o arquivo: remover AI-007 a AI-010 (não pertencem ao LabReserve).
- Manter apenas o histórico real do LabReserve, renumerado sequencialmente:
  - AI-001 — Add repository-level agent instructions (era AI-004)
  - AI-002 — Optimize independent-review execution (era AI-006)
  - AI-003 — Deliver LabReserve React UI, E2E coverage, and documentation (era AI-002, PR #1)
- Reformatar para a estrutura exata que a skill espera: seções
  `## To-do`, `## In progress`, `## Done`; campos `Priority`, `Next`,
  `Depends on`, `Acceptance`, `Context`, `Updated` (ou `Evidence` para
  itens em `Done`).
- Todas as três tarefas herdadas vão para `## Done` (já entregues e
  validadas); `## To-do` e `## In progress` começam vazias.

### 3. Material antigo movido para `docs/archive/`

Para evitar que um agente leia contexto obsoleto por engano ao explorar o
repositório, e para parar de listá-lo como leitura obrigatória:

- `IMPLEMENTATION_PLAN.md` → `docs/archive/IMPLEMENTATION_PLAN.md`
- `specs/epics/` → `docs/archive/specs-epics/` (renomeado; sinaliza que é
  histórico, não o local de specs ativas)
- `docs/verification/` permanece onde está — já é claramente um registro
  de evidências de revisão, nunca foi citado como leitura obrigatória.
- `CLAUDE.md` menciona `docs/archive/` como referência histórica opcional
  (útil para entender decisões passadas), não como algo a ler por padrão.

### 4. Seção "Skills e processo" em `CLAUDE.md`

Mapeamento de quando usar cada skill do plugin `superpowers` neste
projeto, encaixado **por cima** do protocolo de revisão independente já
existente (o protocolo AI-002 de duas revisões cegas continua obrigatório
para entregas que pedem revisão externa — não é substituído):

| Situação | Skill |
|---|---|
| Mudança de comportamento ou feature nova | `superpowers:brainstorming` primeiro (classifica bounded/architectural); `superpowers:writing-plans` depois, se architectural |
| Bug ou teste falhando | `superpowers:systematic-debugging` antes de propor correção |
| Implementação de qualquer plano | `superpowers:test-driven-development` |
| Início de qualquer tarefa não-trivial | ler `AGENT_ISSUES.md` (convenção da skill `context-issues`) |
| Antes de declarar pronto ou commitar | `superpowers:verification-before-completion` + o gate completo já documentado (typecheck/lint/build/test/e2e) + as duas revisões independentes quando aplicável |
| Fim de branch de feature | `superpowers:finishing-a-development-branch` |

Novas specs de brainstorming vão para `docs/superpowers/specs/`; novos
planos de `writing-plans` vão para `docs/superpowers/plans/` (convenção
padrão das skills, adotada a partir de agora — não retroativa).

## Estrutura final

```text
CLAUDE.md                          # fonte da verdade para agentes (novo)
AGENTS.md                          # redirecionamento curto para CLAUDE.md
AGENT_ISSUES.md                    # quadro de handoff, formato context-issues
README.md
docs/
  ARCHITECTURE.md
  verification/                    # inalterado — registro de evidências
  archive/                         # histórico, não é leitura obrigatória
    IMPLEMENTATION_PLAN.md
    specs-epics/                   # era specs/epics/
  superpowers/
    specs/                         # novas specs de brainstorming (a partir de agora)
    plans/                         # novos planos de writing-plans (a partir de agora)
```

## Fora de escopo

- Não migra retroativamente `specs/epics/` para o formato de spec/plano do
  superpowers — fica arquivado como está, apenas renomeado/movido.
- Não altera o protocolo de duas revisões independentes já documentado.
- Não adiciona `.claude/agents/` nem skills de projeto customizadas — não
  foi solicitado e não há necessidade identificada além do mapeamento de
  skills existentes.
