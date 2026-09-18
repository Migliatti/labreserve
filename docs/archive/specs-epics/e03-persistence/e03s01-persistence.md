# Story e03s01 — Reservas transacionais contra SQLite

**type:** feat  
**context:** infra  
**risk:** P0

## Requirements

#### ADDED: Seed determinístico
Um banco novo deve criar tabelas e conter um laboratório e um equipamento operacionais com IDs documentados.

#### ADDED: Persistência atômica
Criação/cancelamento de reserva e seu evento correspondente devem ocorrer na mesma transação SQLite; uma falha reverte todas as alterações.

#### ADDED: Casos de uso de reserva
Os casos de uso devem verificar recurso, validar o domínio, impedir conflito confirmado, permitir consecutivos, liberar cancelados e disponibilizar filtros/histórico.

## Context

`SqliteLabReserveRepository` é o adaptador de infraestrutura para os contratos da aplicação. `LabReserveService` é a interface de aplicação que coordena o domínio e a transação. **Reason for Depth:** o repositório concentra SQL, schema, seed e limites transacionais; casos de uso não conhecem SQL.

## Steps

1. Adicionar teste RED e implementar schema/seed/listagem SQLite → verify: `npm test -- tests/integration/sqlite-repository.test.ts`
2. Adicionar teste RED e implementar criação transacional com evento e conflito → verify: `npm test -- tests/integration/create-reservation.test.ts`
3. Adicionar teste RED e implementar cancelamento, reutilização, filtros e histórico → verify: `npm test -- tests/integration/cancel-and-query.test.ts`
4. Executar gates completos → verify: `npm test && npm run typecheck && npm run lint && npm run build`

## Acceptance criteria

- SQLite real `:memory:` é usado pelos testes; não há mock da persistência.
- Recursos inexistentes, conflitos e cancelamento repetido são erros explícitos.
- Reservas canceladas não entram na consulta de conflito.
- Eventos de criação/cancelamento são imutáveis e ordenados por ocorrência.

## Out of scope

HTTP, React, E2E e arquivo SQLite de produção.
