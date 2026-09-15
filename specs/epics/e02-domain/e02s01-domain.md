# Story e02s01 — Intervalos e cancelamento de reservas

**type:** feat  
**context:** domain  
**risk:** P1

## Requirements

#### ADDED: Intervalo temporal válido
O domínio deve rejeitar início ou término inválidos e todo intervalo cujo término não seja estritamente posterior ao início. Valores válidos são normalizados para UTC.

#### ADDED: Conflito estrito
O domínio deve considerar dois intervalos em conflito somente quando `novoInicio < fimExistente` e `novoFim > inicioExistente`; limites consecutivos não conflitam.

#### ADDED: Cancelamento irreversível
Uma reserva nasce confirmada, pode ser cancelada uma única vez e não pode ser reativada.

## Context

O domínio oferece uma interface pequena: criar e comparar `TimeInterval`, criar uma reserva confirmada e solicitar seu cancelamento. Ele não recebe repositório, relógio, HTTP, React ou SQLite. **Reason for Depth:** `TimeInterval` concentra parsing, normalização e a regra de sobreposição, para que camadas externas não reimplementem comparações temporais.

## Steps

1. Adicionar teste RED e implementar criação/normalização de intervalo válido → verify: `npm test -- tests/domain/time-interval.test.ts`
2. Adicionar teste RED e implementar rejeição de intervalo inválido → verify: `npm test -- tests/domain/time-interval.test.ts`
3. Adicionar teste RED e implementar sobreposição estrita e limites consecutivos → verify: `npm test -- tests/domain/time-interval.test.ts`
4. Adicionar teste RED e implementar cancelamento único → verify: `npm test -- tests/domain/reservation.test.ts`
5. Executar a suíte e análise estática → verify: `npm test && npm run typecheck && npm run lint`

## Acceptance criteria

- Datas ISO com offset são normalizadas para UTC.
- Término igual ou anterior ao início gera `INVALID_TIME_RANGE`.
- Intervalos consecutivos não conflitam; interseções parciais, contidas e envolventes conflitam.
- Reserva confirmada cancelada recebe data de cancelamento; segundo cancelamento gera `RESERVATION_ALREADY_CANCELLED`.

## Out of scope

- IDs, relógio, persistência, criação de evento, API e interface.

## Risks

- `Date.parse` aceita formatos não-ISO de modo permissivo; o domínio deve validar explicitamente o formato e offset antes de normalizar.
