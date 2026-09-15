# Autoauditoria local — AI-002

**Data:** 2026-03-31  
**Base de revisão:** `ab55560` (`git diff HEAD`; árvore de trabalho, sem commit)  
**Decisão:** **aprovada para a rodada 5** — não há achado bloqueador confirmado após as correções da rodada 4.

## Manifesto de escopo

`git diff --check` foi aprovado. O diff versionado contém 12 arquivos (445 inserções, 71 remoções); há também `LICENSE` e quatro registros de verificação não rastreados.

| Área/arquivos | Contrato diretamente afetado | Cobertura/evidência |
|---|---|---|
| `src/application/lab-reserve-service.ts`, `tests/api/reservations-api.test.ts` | `GET /api/reservations/:id/history` retorna `404 RESERVATION_NOT_FOUND` para reserva ausente | teste API de histórico inexistente |
| `src/domain/time-interval.ts`, `tests/domain/time-interval.test.ts` | ISO 8601 com fuso deve representar calendário real e intervalo válido | teste de 29/02/2026 e gate registrado |
| `src/server/app-server.ts`, `tests/api/reservations-api.test.ts`, `docs/ARCHITECTURE.md` | respostas JSON seguras; criação aceita somente JSON e limita corpo a 1 MiB; erro interno é registrado sem vazar ao cliente | testes de cabeçalhos, MIME, limite exato, excesso, chunked, `Content-Length` grande e logger que falha |
| `src/web/main.tsx`, `tests/e2e/reservations.spec.ts`, `playwright.config.ts` | atualização assíncrona só aplica a resposta mais recente; filtros e cenários E2E são isolados; período vazio/invalidado não deixa carregamento pendente | cenário Playwright com barreira de resposta fora de ordem, contagem estável antes da inspeção da lista, data vazia e dois workers |
| `package-lock.json` | metadados de lockfile, sem alteração de dependência declarada | `npm ci --ignore-scripts --dry-run` aprovado; manutenção autorizada pelo usuário |
| `AGENTS.md`, `AGENT_ISSUES.md`, `docs/verification/*.md` | processo de entrega e evidência da AI-002 | inspeção documental; não altera o produto |

**Limite aceito (rodada 6):** erros com corpo não lido descartam o restante com teto de 64 MiB, 5 s e 8 drenos simultâneos; acima desses tetos a conexão é fechada sem drenar e o cliente pode receber reset em vez do status. Aceito para uma aplicação local.

**Explicitamente fora do escopo funcional:** `LICENSE` (AI-005) e as regras globais adicionadas em `AGENTS.md` (AI-006) não alteram contratos de reserva. Os revisores devem inspecioná-los apenas como metadados do diff, sem ampliar a revisão para áreas não modificadas de domínio, persistência, cliente API, estilos ou configuração de build.

## Checklist

### Segurança e cadeia de suprimentos

- ✓ Não houve dependência nova; as dependências existentes estão marcadas `[OK]` no plano.
- ✓ Varredura do diff não encontrou segredos, `any`, `@ts-ignore` ou `eslint-disable` introduzidos.
- ✓ OWASP: entradas JSON e tamanho são validados na fronteira HTTP; JSONP/MIME não são aceitos; erros internos não expõem detalhe; respostas incluem CSP, `nosniff`, anti-framing e `Referrer-Policy`.
- ✓ `package-lock.json` foi validado por `npm ci --ignore-scripts --dry-run`; remoções de `dev` em variantes opcionais não mudam `package.json` e foram autorizadas.

### Escopo, tipos e clareza

- ✓ Alterações se limitam aos achados de revisão de AI-002, cobertura de regressão e sua evidência; não há recurso especulativo.
- ✓ O histórico de reserva preserva a regra de aplicação na camada de serviço, sem regra de negócio no handler HTTP.
- ✓ Não foram introduzidas cadeias de mensagem, tipos inseguros, código morto ou blocos comentados.
- ✓ Não há `CONVENTIONS.md` nem o script de churn indicado pelo checklist genérico; aplicaram-se `AGENTS.md`, arquitetura e plano do repositório. Os arquivos de maior risco foram revisados primeiro: `src/server/app-server.ts`, `tests/api/reservations-api.test.ts`, `src/web/main.tsx` e `tests/e2e/reservations.spec.ts`.
- ✓ As funções novas têm responsabilidades delimitadas; a leitura limitada de corpo, a classificação/log de erro e a verificação de data estão separadas. Não foi detectado smell bloqueador de Fowler (nomes misteriosos, duplicação relevante, feature envy, data clumps, primitive obsession, message chains ou middle man).

### Testes e comportamento

- ✓ Cada correção possui regressão no limite público apropriado: domínio, API ou E2E.
- ✓ A cobertura HTTP inclui limite exato, excesso por `Content-Length`, excesso chunked em quatro escritas, `Content-Length` além de `Number.MAX_SAFE_INTEGER` e logger que lança.
- ✓ A cobertura E2E bloqueia controladamente a primeira resposta, espera a resposta do filtro mais novo e só então libera a obsoleta; a lista inteira é verificada contra recurso e estado filtrados.
- ✓ Os testes verificam contratos observáveis, não estado interno da UI ou do servidor.

## Validação reutilizada

O protocolo de custo de AI-002 impede repetir o gate sem mudança de código posterior. A mesma árvore foi validada e registrada em `docs/verification/ai-002-review-findings-correction.md`:

```text
npm run typecheck  # aprovado
npm run lint       # aprovado
npm run build      # aprovado
npm test           # 18 aprovados
npm run test:e2e   # 3 aprovados, 2 workers
cold-start smoke   # recursos seed retornados
npm ci --ignore-scripts --dry-run  # aprovado nesta autoauditoria
```

## Racionalizações verificadas

Nenhuma. A ausência de `CONVENTIONS.md` e do ranking de churn foi registrada, não usada para omitir itens; as regras aplicáveis de `AGENTS.md` foram revisadas.

## Próxima ação

Enviar aos dois revisores independentes, em paralelo e sem compartilhamento, este manifesto atualizado, o objetivo da AI-002, o diff contra `ab55560`, os contratos da tabela e a evidência de gate acima. A revisão deve permanecer limitada a esse escopo e pode executar apenas verificações focadas justificadas.
