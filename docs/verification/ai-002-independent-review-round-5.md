# Revisão independente — AI-002, rodada 5

**Data:** 2026-09-15

## Resultado do gate

**Reprovado.** Dois revisores independentes e cegos revisaram em paralelo somente o diff contra `ab55560` e os contratos listados em `docs/verification/ai-002-local-audit.md`. Ambos reutilizaram o gate registrado e executaram apenas verificações focadas, sem alterar arquivos.

| Revisor | Pontuação | Must-fix | Should-fix | Decisão |
|---|---:|---:|---:|---|
| A | 84% | 1 | 2 | Reprovar |
| B | 94% | 0 | 3 | Aprovar |

A regra AND exige zero `must-fix` e pontuação mínima de 94% para ambos. Esta era a última rodada permitida; a continuação depende de decisão do usuário.

## Correções da rodada 4

Ambos confirmaram que estão corretas e completas: `toIso()` agora está dentro do `try` em `refresh()` (`src/web/main.tsx`), e `expectAllReservationsFor()` aguarda `toHaveCount` antes de `locator.all()`.

## Achado confirmado pelos dois revisores

1. **413 perdido com corpo realmente grande** (`src/server/app-server.ts`): ao rejeitar por `Content-Length` ou pausar a leitura chunked, o servidor responde com `shouldKeepAlive = false` sem drenar o corpo restante; o fechamento do socket com dados não lidos gera RST e o cliente recebe `ECONNRESET` sem status. Revisor A (must-fix): 12/12 tentativas com 2–20 MiB. Revisor B (should-fix): `node:http` com ~1,11 MiB, chunked 2 e 16 MiB, e `fetch` com 8 MiB. Os testes atuais só cobrem casos-limite. Correção sugerida: após o 413, descartar o restante (`request.resume()`) com teto de bytes/tempo antes de fechar; adicionar regressões com 2 MiB e 8 MiB em `Content-Length` e chunked verificando o status recebido.

## Should-fix

1. **Baixa detecção de regressão no E2E de resposta fora de ordem** (A e B; `tests/e2e/reservations.spec.ts`): `waitForResponse` resolve antes do processamento da resposta obsoleta pela UI; removendo a checagem de versão em `main.tsx`, o teste tende a continuar passando. Aguardar o processamento da resposta liberada antes de afirmar a lista estável.
2. **Criação antes do carregamento de recursos** (A; teste 1 do E2E): pode enviar `resourceId` vazio sob carga. Aguardar o valor do seletor de recurso.
3. **Mensagem crua do motor e aviso persistente** (B; `src/web/main.tsx`): data vazia exibe `Invalid time value` (texto do V8) e o aviso não é limpo após sucesso; o E2E depende dessa mensagem. Validar datas antes de `toIso` com mensagem própria em português.

## Nits

- Offset de fuso sem validação de faixa em `TimeInterval` (depende de `Date` retornar `NaN`).
- Falha dupla em `catch` de `app-server.ts` se `send`/`console.error` lançar (pré-existente, baixo risco).
- E2E compartilha banco `:memory:` entre workers; contagens quebram com `retries` ou `--repeat-each`.

## Próxima ação

**Decisão do usuário (2026-09-15):** opção 1 — corrigir o achado de 413 e os should-fix, repetir o gate completo e executar uma rodada 6 excepcional com dois revisores independentes. Execução pendente de início.
