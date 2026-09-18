# Story e01s01 — Fundação reprodutível

**type:** feat  
**context:** infra  
**risk:** P1

## Requirements

#### ADDED: Ambiente local reproduzível
O projeto deve declarar versões fixas de suas dependências e oferecer scripts para teste, análise de tipos, lint, build e desenvolvimento local.

## Context

Esta história prepara a infraestrutura mínima para que os próximos comportamentos sejam implementados com TDD. Não entrega uma funcionalidade de reserva nem cria código de domínio, aplicação, servidor ou interface.

## Steps

1. Adicionar a configuração TypeScript, npm, lint e Vite com versões fixas → verify: `npm run typecheck && npm run lint && npm run build`
2. Criar um teste de sanidade executável pelo runner selecionado → verify: `npm test`
3. Documentar a versão de Node e os comandos de desenvolvimento → verify: `grep -q 'Node.js 22.13' README.md`

## Acceptance criteria

- `npm test`, `npm run typecheck`, `npm run lint` e `npm run build` terminam com código 0.
- Não há dependência usando a versão `latest`.
- O README informa Node.js 22.13+ e os comandos locais.

## Out of scope

- Qualquer regra de domínio, SQLite, API HTTP ou componente React.

## Risks

- A versão local de Node pode não atender ao requisito de `node:sqlite`; a implementação deve falhar claramente antes de depender dele.
