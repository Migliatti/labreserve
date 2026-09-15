# Verificação — e02s01 Intervalos e cancelamento

## Critérios implementados

- Normalização UTC para timestamps ISO 8601 com fuso explícito.
- Rejeição de término igual/anterior ao início e de formato inválido com `INVALID_TIME_RANGE`.
- Sobreposição estrita; intervalos consecutivos permitidos.
- Reserva criada confirmada e cancelável uma única vez, com `RESERVATION_ALREADY_CANCELLED` na segunda tentativa.

## Evidência RED

| Comportamento | Commit RED | Falha observada |
|---|---|---|
| normalização UTC | `9dbbd19` | módulo `time-interval` ausente |
| intervalo não positivo | `5a99947` | export `DomainError` ausente |
| ISO com fuso | `3e4b0af` | `RangeError: Invalid time value`, não erro de domínio |
| conflito estrito | `02b201c` | `overlaps is not a function` |
| cancelamento único | `1889aee` | módulo `reservation` ausente |

## Evidência GREEN

Commits correspondentes: `7bf936e`, `14a175f`, `e3026cc`, `47bc8ef` e `eb62dfd`.

Comandos aprovados:

```text
npm test
npm run typecheck
npm run lint
npm run build
```

Todos terminaram com código 0.

## Arquivos alterados

- `src/domain/domain-error.ts`
- `src/domain/time-interval.ts`
- `src/domain/reservation.ts`
- `tests/domain/time-interval.test.ts`
- `tests/domain/reservation.test.ts`

## Limitações e revisão

Persistência, eventos, HTTP e UI não fazem parte desta história. A revisão independente permanece pendente pela restrição vigente de não delegação.
