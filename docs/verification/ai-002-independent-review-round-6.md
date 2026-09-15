# Revisão independente — AI-002, rodada 6 (excepcional)

**Data:** 2026-09-15

## Resultado do gate

**Aprovado.** Rodada excepcional autorizada pelo usuário após a reprovação da rodada 5. Dois revisores independentes e cegos revisaram em paralelo somente o diff contra `ab55560` e os contratos do manifesto em `docs/verification/ai-002-local-audit.md`, reutilizando o gate registrado em `docs/verification/ai-002-review-findings-correction.md` (typecheck, lint, build, `npm test` 19, `npm run test:e2e` 3, smoke).

| Revisor | Pontuação | Must-fix | Should-fix | Decisão |
|---|---:|---:|---:|---|
| A | 95% | 0 | 2 | Aprovar |
| B | 95% | 0 | 1 | Aprovar |

A regra AND (zero `must-fix` e ≥ 94% para ambos) foi satisfeita.

## Correções da rodada 5 confirmadas

1. **413 com corpo grande:** ambos reproduziram 413 JSON sem `ECONNRESET` com 2 e 20 MiB, em `Content-Length` e chunked. Acima de 64 MiB o reset é o comportamento esperado do teto `MAX_DISCARD_BYTES`.
2. **E2E de resposta fora de ordem:** ambos confirmaram que remover a checagem de versão faz o teste falhar (consistente com a mutação registrada 3/3).
3. **Espera pelo seletor de recurso** antes de criar: confirmada.
4. **Data inválida:** mensagem em português, carregamento não fica pendente e aviso é limpo na consulta seguinte.

## Should-fix (não bloqueantes)

- **E2E paralelo com banco `:memory:` compartilhado** (A e B; `playwright.config.ts`): o isolamento depende de cada teste usar um recurso distinto; `--repeat-each`, retries ou um teste novo no mesmo recurso quebram contagens exatas. Documentar a regra ou voltar a `workers: 1`.
- **Drenos simultâneos sem limite global** (A; `app-server.ts`): cada 413 pode segurar a conexão até 5 s/64 MiB; memória constante, risco baixo em app local.

## Nits

- Incluir 20 MiB (ou caso acima de 64 MiB) na regressão API.
- Caminho 400 por `Content-Type` não aplica o mesmo teto de descarte (pré-existente).
- Registrar como aceito o reset acima de 64 MiB declarados.
- Copiar `refreshInputs.current` em `refresh()` para reduzir fragilidade.
- Usar `reservationsResponse` em vez de `url.includes` em dois pontos do E2E.

## Recomendações tratadas após a aprovação

Por pedido do usuário, todos os should-fix e nits foram tratados:

- E2E paralelo: regra de recurso exclusivo por teste documentada em `tests/e2e/reservations.spec.ts` e `playwright.config.ts` (mantidos 2 workers).
- `discardBody()` limita a 8 drenos simultâneos e passou a valer para qualquer erro com corpo não lido (`!request.complete`), incluindo o 400 por `Content-Type`.
- Regressão API cobre 2, 8 e 20 MiB (`Content-Length` e chunked) e 400 com corpo `text/plain` de 8 MiB.
- Limite acima dos tetos registrado como aceito em `ai-002-local-audit.md`.
- `refresh()` copia `refreshInputs.current`; o E2E usa `reservationsResponse` nos dois pontos.

Gate repetido em 2026-09-15: typecheck, lint, build, `npm test` (19), `npm run test:e2e` (3), smoke aprovados.

## Próxima ação

Commit local da AI-002; push/PR somente mediante pedido.
