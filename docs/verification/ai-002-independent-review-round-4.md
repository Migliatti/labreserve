# Revisão independente — AI-002, rodada 4

**Data:** 2026-03-31

## Resultado do gate

**Reprovado.** Dois revisores independentes e cegos revisaram em paralelo somente o diff contra `ab55560` e os contratos diretamente afetados. Ambos reutilizaram o gate local registrado e não executaram comandos de teste.

| Revisor | Pontuação | Must-fix | Should-fix | Decisão |
|---|---:|---:|---:|---|
| A | 95% | 1 | 0 | Reprovar |
| B | 85,7% | 1 | 1 | Reprovar |

A regra AND exige zero `must-fix` e pontuação mínima de 94% para ambos.

## Achado confirmado para correção

1. **Conversão de data fora do tratamento de erro na UI:** em `src/web/main.tsx`, `toIso()` é chamada antes do `try` em `refresh()`. Um campo `datetime-local` vazio ou inválido pode lançar `RangeError` fora do tratamento ao consultar ou filtrar. Como a versão da atualização já foi incrementada, uma requisição anterior também pode deixar `loading` ativo indefinidamente. Mover a conversão/validação para o `try` e adicionar regressão E2E ou de UI para entrada vazia/inválida.

## Achado should-fix confirmado

1. **Janela de flakiness no helper E2E:** `expectAllReservationsFor()` usa `locator.all()` depois de verificar apenas que a lista não está vazia. Durante a resposta fora de ordem, pode capturar a lista anterior antes do commit React. Aguardar uma condição estável compatível com o cenário, como a quantidade esperada, antes de validar todos os itens.

## Considerações não bloqueadoras

- Isolar a alteração temporária de `SqliteLabReserveRepository.prototype` dos testes de erro por injeção de dependência se a concorrência desses testes for introduzida.
- Avaliar mensagem mais geral para data/calendário inválido em `TimeInterval`.

## Próxima ação

Corrigir os dois achados confirmados, executar somente as regressões focadas durante o ciclo, repetir o gate completo porque haverá mudança de código e então executar a rodada 5 com dois revisores independentes em paralelo.
