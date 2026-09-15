# Story e04s01 — Contrato HTTP de reservas

**type:** feat  
**context:** api  
**risk:** P1

## Requirements

#### ADDED: Adaptador HTTP
A API deve expor recursos, criação/listagem/cancelamento de reservas e histórico como JSON. Ela valida entrada, delega ao caso de uso e não contém regra de conflito ou transição de domínio.

#### ADDED: Erros uniformes
Erros previstos devem usar `code`, `message` e `details` opcional, com 400 para validação, 404 para inexistência e 409 para conflito/transição inválida. Falhas inesperadas retornam `INTERNAL_ERROR` sem detalhe interno.

## Context

`createAppServer` compõe SQLite e a aplicação; rotas são adaptadores finos. **Reason for Depth:** o servidor esconde parsing HTTP, rotas e tradução de erros atrás de `listen`/`close`, preservando a aplicação independente de HTTP.

## Steps

1. Adicionar teste RED e implementar `GET /api/resources` e `POST /api/reservations` → verify: `npm test -- tests/api/reservations-api.test.ts`
2. Adicionar teste RED e implementar filtros, cancelamento e histórico → verify: `npm test -- tests/api/reservations-api.test.ts`
3. Executar gates completos → verify: `npm test && npm run typecheck && npm run lint && npm run build`

## Acceptance criteria

- Corpo inválido, ID ausente e timestamp não-ISO retornam `VALIDATION_ERROR`/400.
- Conflito devolve `RESERVATION_CONFLICT`/409 e detalhes seguros.
- Rota de cancelamento devolve reserva atualizada; histórico inclui criação e cancelamento.

## Out of scope

Autenticação, frontend, CORS de produção, deploy e E2E.
