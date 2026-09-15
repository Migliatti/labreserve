# Verificação parcial — e03s01 Persistência

## Comportamentos concluídos

- SQLite real em memória cria schema e seed determinístico.
- `CreateReservation` normaliza o intervalo, verifica recurso e conflito confirmado, grava reserva e evento dentro de transação.
- Intervalos consecutivos são aceitos.
- `CancelReservation` atualiza a reserva e grava evento na mesma transação; horários cancelados voltam a ficar disponíveis.
- Listagem por recurso/estado e histórico por reserva funcionam.

## RED/GREEN registrado

| Critério | RED | GREEN |
|---|---|---|
| seed SQLite | `6381e34` | `0d7d82c` |
| criação/conflito/evento | `2d69426` | `3ac4a0a` |
| cancelamento/filtros | `29ac972` | `9a88188` |

## Gate executado

```text
npm test
npm run typecheck
npm run lint
npm run build
```

Todos terminaram com código 0.

## Lacuna aberta (bloqueia conclusão da história)

Ainda falta um teste de integração escrito em RED que force falha ao gravar o evento e prove que a reserva foi revertida. A transação está implementada, mas um teste novo agora já tenderia a passar e não seria evidência vermelha válida. Por isso, a tarefa transacional permanece `failing` no ledger e a história não é declarada concluída.

A implementação também não inclui a consulta de disponibilidade agregada; ela será tratada junto ao contrato HTTP para evitar uma abstração sem consumidor.
