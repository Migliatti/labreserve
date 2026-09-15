# Verificação — Correção dos achados da AI-002

**Data:** 2026-03-31

## Correções implementadas

- `GET /api/reservations/:id/history` agora verifica a existência da reserva e devolve `404 RESERVATION_NOT_FOUND` quando o ID não existe.
- `TimeInterval` rejeita calendários impossíveis mesmo quando o texto segue o padrão ISO 8601 (por exemplo, `2026-02-29`). A API preserva `400 INVALID_TIME_RANGE`.
- As respostas HTTP incluem CSP restritiva, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` e `Referrer-Policy: no-referrer`. A criação exige `Content-Type: application/json`; o corpo é limitado a 1 MiB.
- Os dois cenários Playwright executam paralelamente e usam recursos diferentes (`lab-chemistry` e `equipment-microscope`), sem depender dos dados criados pelo outro. As asserções de histórico vinculam o evento à reserva criada no próprio cenário.

## Cobertura adicionada

- API: histórico de ID inexistente, cabeçalhos de segurança, tipos de conteúdo inválidos (incluindo `application/jsonp`), limite de corpo e data de calendário inexistente.
- Domínio: rejeição de data ISO 8601 inexistente.
- E2E: execução paralela e filtro limitado ao recurso isolado do cenário.

## Evidência de validação

```text
npm run typecheck        # aprovado
npm run lint             # aprovado
npm run build            # aprovado
npm test                 # 16 aprovados
npm run test:e2e         # 2 aprovados, 2 workers
cold-start smoke         # GET /api/resources retornou lab-chemistry e equipment-microscope
```

## Correções da rodada 3

- `POST /api/reservations` usa `Content-Length` (inclusive valores inteiros grandes) como atalho para recusar corpo acima de 1 MiB com `413 PAYLOAD_TOO_LARGE`; durante transferência chunked, pausa a leitura e fecha a conexão somente após enviar a resposta. O contrato cobre o limite exato, o excesso e o fluxo chunked.
- A UI versiona cada atualização assíncrona e lê filtros/período de uma referência atual: somente a resposta da atualização mais recente altera recursos, reservas, histórico e estado de carregamento. Os cenários E2E aguardam a resposta de cada filtro, forçam resposta antiga atrasada e verificam que a lista não vazia inteira pertence ao recurso e estado filtrados.
- Erros não previstos são registrados somente no backend (com ponto de extensão resiliente para o registrador) e a resposta permanece `500 INTERNAL_ERROR`, sem detalhes internos.

## Evidência de validação — rodada 3

```text
npm run typecheck  # aprovado
npm run lint       # aprovado
npm run build      # aprovado
npm test           # 17 aprovados
npm run test:e2e   # 2 aprovados, 2 workers
cold-start smoke   # GET /api/resources retornou os dois recursos seed
```

## Gate final repetido

Em 2026-03-31, após as correções adicionais de transferência chunked, `Content-Length` grande, logger resiliente e respostas E2E fora de ordem, o gate foi repetido uma única vez:

```text
npm run typecheck  # aprovado
npm run lint       # aprovado
npm run build      # aprovado
npm test           # 18 aprovados
npm run test:e2e   # 2 aprovados, 2 workers
cold-start smoke   # GET /api/resources retornou lab-chemistry e equipment-microscope
```

A saída de teste contém o stack trace esperado da simulação de logger, enquanto o teste confirma que a resposta HTTP segue segura.

## Correções da rodada 4

- `refresh()` agora converte o período dentro do `try`; uma data vazia ou inválida gera aviso na interface e o `finally` remove o estado de carregamento da atualização atual.
- `expectAllReservationsFor()` aguarda a quantidade esperada antes de capturar a lista e validar cada item, removendo a janela entre a lista anterior e o commit React do filtro novo.
- Foi incluído cenário E2E que limpa o início, consulta o período e confirma aviso mais ausência de carregamento pendente.

## Gate final repetido após a rodada 4

Em 2026-03-31, após as duas correções acima:

```text
npm run typecheck  # aprovado
npm run lint       # aprovado
npm run build      # aprovado
npm test           # 18 aprovados
npm run test:e2e   # 3 aprovados, 2 workers
cold-start smoke   # recursos seed retornados
```

A saída de `npm test` inclui o stack trace esperado da simulação de logger; os 18 testes aprovam.

## Correções da rodada 5

- `src/server/app-server.ts`: após detectar corpo acima de 1 MiB (por `Content-Length` ou durante leitura chunked), o servidor descarta o restante com `discardBody()` — teto de 64 MiB e 5 s — antes de enviar o 413 com `connection: close`. `Content-Length` declarado acima do teto responde de imediato sem drenar. Regressão API envia 2 MiB e 8 MiB por `Content-Length` e chunked e exige status 413 legível; antes da correção falhava com `ECONNRESET`.
- `tests/e2e/reservations.spec.ts`: o cenário fora de ordem registra, via init script, cada `Response.json()` consumido pela página e só afirma a lista depois que a resposta obsoleta foi consumida e dois frames foram renderizados. Mutação removendo a checagem de versão em `main.tsx` falhou 3/3 (`--repeat-each 3`).
- Os cenários que criam reservas aguardam o seletor de recurso ter valor antes de enviar.
- `src/web/main.tsx`: `toIso()` valida a data e lança mensagem em português (“Informe uma data e hora válidas para o início.”); os botões de consulta limpam o aviso anterior. O E2E de data vazia verifica a mensagem e que o aviso some após consulta válida.

## Gate final repetido após a rodada 5

Em 2026-09-15, após as correções acima:

```text
npm run typecheck  # aprovado
npm run lint       # aprovado
npm run build      # aprovado
npm test           # 19 aprovados
npm run test:e2e   # 3 aprovados, 2 workers
cold-start smoke   # porta 3100: lab-chemistry, equipment-microscope
```

## Limitações e próxima ação

Gate local e rodada 6 aprovados (ver `ai-002-independent-review-round-6.md`). A AI-002 foi entregue via PR #1 (`feat/labreserve-api`) e mesclada em `main` no commit `8265e0a`.
