# LabReserve

Sistema web local para consultar disponibilidade e reservar laboratórios e equipamentos.

## Sobre o projeto

O LabReserve é um experimento prático: **construir uma aplicação realmente funcional usando agentes de IA com boas práticas de engenharia**, em vez de gerar código sem controle. O foco não foi só o produto, mas o processo:

- **Plano antes do código:** o escopo foi quebrado em histórias pequenas em [IMPLEMENTATION_PLAN.md](docs/archive/IMPLEMENTATION_PLAN.md), cada uma com critérios de aceitação.
- **Instruções explícitas para agentes:** [CLAUDE.md](CLAUDE.md) define arquitetura, regras de negócio invariantes, comandos, fluxo de trabalho, skills do plugin `superpowers` e política de Git. Planejamento e revisões já entregues ficam arquivados em [docs/archive/](docs/archive/).
- **Contexto persistente:** [AGENT_ISSUES.md](AGENT_ISSUES.md) funciona como quadro de handoff entre sessões, e `graphify-out/` guarda um mapa de conhecimento do repositório.
- **Test-first:** cada mudança de comportamento começa com um teste falhando.
- **Gate de validação obrigatório:** typecheck, lint, build, testes unitários/integração/API, E2E e smoke test antes de declarar algo pronto.
- **Revisão independente:** duas revisões paralelas e cegas, com critério mínimo de aprovação. A entrega da interface passou por seis rodadas até aprovação; cada rodada está registrada em [docs/verification/](docs/verification/).
- **Humano no controle:** decisões de escopo, commits e publicação dependem de autorização explícita.

## Funcionalidades

- Consulta de disponibilidade por período
- Criação de reservas com detecção de conflito de horário
- Listagem com filtros por recurso e estado
- Cancelamento de reservas
- Histórico de eventos por reserva e global

Recursos iniciais: Laboratório de Química (`lab-chemistry`) e Microscópio (`equipment-microscope`).

## Regras de negócio

- O término deve ser estritamente posterior ao início.
- Datas exigem ISO 8601 com fuso explícito e são armazenadas em UTC.
- Há conflito quando `novoInício < fimExistente && novoFim > inícioExistente`; reservas consecutivas são válidas.
- Reservas canceladas não bloqueiam disponibilidade.
- Reservas nascem confirmadas, podem ser canceladas uma vez e não são editadas nem reativadas.
- Criação/cancelamento e seus eventos são atômicos.

## Stack e arquitetura

TypeScript em um monólito modular: API com `node:http`, persistência em SQLite (`node:sqlite`) e interface em React + Vite.

```text
src/domain/       Entidades, intervalos de tempo, regras de sobreposição
src/application/  Casos de uso, contratos e erros de aplicação
src/persistence/  Esquema SQLite, dados iniciais, repositório
src/server/       Rotas HTTP, validação de entrada, mapeamento de erros
src/web/          Interface React e cliente da API
```

As dependências apontam para dentro: o domínio não conhece HTTP, React nem SQLite. A API também aplica cabeçalhos de segurança (CSP, `nosniff`, anti-framing), exige `application/json` e limita o corpo a 1 MiB. Detalhes em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Como rodar

Requisitos: Node.js 22.13+ e npm 10+.

```bash
npm install
npm run dev:api   # Terminal 1: API em http://127.0.0.1:3000
npm run dev       # Terminal 2: interface em http://127.0.0.1:5173
```

## Testes e validação

```bash
npm test          # unitários, integração e API (node:test)
npm run test:e2e  # aceitação com Playwright (sobe servidores próprios em memória)
npm run typecheck
npm run lint
npm run build
```

## Limitações

Projeto local e de escopo reduzido: não há autenticação, edição ou reativação de reservas, notificações nem calendário avançado.

## Licença

[MIT](LICENSE)
