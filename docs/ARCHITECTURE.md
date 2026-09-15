# LabReserve — Arquitetura

## Decisões

- **Runtime:** Node.js 22.13+ para usar `node:sqlite` estável, sem driver SQLite externo.
- **Monólito modular TypeScript:** API Node e frontend React/Vite no mesmo pacote npm.
- **Persistência:** SQLite; dados de produção em arquivo local configurável e testes de integração em `:memory:`.
- **HTTP:** servidor baseado em `node:http`; a camada HTTP traduz entrada/saída e não contém regras de negócio.
- **UI:** React + Vite, uma tela responsiva e acessível; sem biblioteca de componentes.
- **Testes:** `node:test` cobre domínio, integração e API; Playwright cobre os fluxos E2E de reserva.

As versões serão fixadas no `package.json` e consolidadas no `package-lock.json`; `latest` não será usado.

## Estrutura atual e planejada

```text
src/
  domain/          # entidades, intervalo, sobreposição, transições
  application/     # casos de uso, contratos de repositório, erros de aplicação
  persistence/     # schema, seed e adaptador SQLite
  server/          # composição, rotas, validação HTTP e tratamento de erro
  web/             # React, cliente HTTP e estilos
scripts/           # inicialização de desenvolvimento
 tests/
  domain/
  integration/
  api/
  e2e/
docs/
```

Dependências seguem para dentro: `web` e `server` dependem de `application`; `application` depende de `domain` e de contratos; `persistence` implementa contratos. O domínio não importa módulos HTTP, React ou SQLite.

## Modelo persistido

- `resources(id, name, category, status)`
- `reservations(id, resource_id, start_at, end_at, status, created_at, cancelled_at)`
- `reservation_events(id, reservation_id, type, occurred_at)`

Datas serão aceitas somente como ISO 8601 com offset/fuso explícito, normalizadas com `toISOString()` e armazenadas em UTC.

O seed idempotente e determinístico cria, no mínimo:

- `lab-chemistry` — laboratório operacional;
- `equipment-microscope` — equipamento operacional.

## Contratos HTTP planejados

| Método e rota | Resultado |
|---|---|
| `GET /api/resources?startAt=&endAt=` | recursos; quando ambos os limites forem informados, inclui disponibilidade |
| `POST /api/reservations` | cria uma reserva confirmada (`201`) |
| `GET /api/reservations?resourceId=&status=` | lista reservas com filtros opcionais |
| `POST /api/reservations/:id/cancel` | cancela uma reserva confirmada |
| `GET /api/reservations/:id/history` | eventos da reserva |
| `GET /api/history` | linha do tempo global |

Respostas de sucesso usam `{ "data": ... }`. Falhas previstas usam:

```json
{
  "code": "RESERVATION_CONFLICT",
  "message": "O recurso já está reservado nesse período.",
  "details": { "conflictingReservationId": "..." }
}
```

Mapeamento inicial: `VALIDATION_ERROR` e `INVALID_TIME_RANGE` → 400; recursos/reservas ausentes → 404; conflito e reserva já cancelada → 409; falha inesperada → 500 sem detalhe interno.

## Atomicidade e conflitos

Criação insere reserva e evento `RESERVATION_CREATED` em uma única transação. Cancelamento atualiza a reserva e grava `RESERVATION_CANCELLED` na mesma transação. Uma falha em qualquer etapa reverte tudo.

A consulta de conflito considera somente reservas `CONFIRMED` do mesmo recurso e usa:

```text
newStart < existingEnd && newEnd > existingStart
```

Logo, limites iguais são permitidos e uma reserva cancelada não bloqueia o intervalo.
