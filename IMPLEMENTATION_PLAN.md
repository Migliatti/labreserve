# Plano de implementação — LabReserve

**Status:** fundação, domínio, persistência, contrato HTTP, interface React e E2E implementados; gate de validação executado e revisão independente em andamento.
**Escopo:** exclusivamente a primeira versão aprovada em 2026-09-15.

## Premissas verificadas

O repositório contém a implementação TypeScript do backend, configuração reproduzível e testes de domínio, integração e API. A continuação deve preservar esses artefatos e tratar este plano como histórico e roteiro das etapas pendentes.

## Dependências propostas (slopcheck)

- `typescript`, `tsx`, `@types/node` — **[OK]**: compilação e execução TypeScript local.
- `react`, `react-dom`, `vite`, `@vitejs/plugin-react` — **[OK]**: UI React local com bundler mínimo.
- `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `globals` — **[OK]**: lint estático TypeScript/React.
- `@playwright/test` — **[OK]**: automação E2E em navegador real.
- `node:sqlite` — módulo nativo do Node, sem pacote adicional; exige Node 22.13+.

Não serão adicionados ORM, framework HTTP, biblioteca de componentes, cache, fila ou dependência de IA: não há necessidade explícita nesta versão.

## Ordem de execução

Cada item é uma mudança pequena. Para cada critério: escrever o teste, executar e registrar a falha esperada, implementar o mínimo, executar o teste verde, refatorar, executar a suíte relevante, submeter o diff a revisão independente e registrar o resultado.

### 1. Fundação reprodutível — P1

- Criar pacote TypeScript com versões fixas, configuração de lint, Vite, scripts e `.gitignore`.  
  **Verificar:** `npm run typecheck && npm run lint && npm run build`
- Documentar a versão mínima do Node e comandos vazios de desenvolvimento/teste.  
  **Verificar:** `npm test`

### 2. Domínio puro — P1

- **Critério:** término igual ou anterior ao início é rejeitado com `INVALID_TIME_RANGE`.  
  **Teste:** teste unitário de `TimeInterval` falha antes da implementação.  
  **Verificar:** `npm test -- tests/domain/time-interval.test.ts`
- **Critério:** a fórmula de sobreposição rejeita qualquer interseção e aceita intervalos consecutivos.  
  **Teste:** casos parcial, contido, envolvente e limites iguais.  
  **Verificar:** `npm test -- tests/domain/time-interval.test.ts`
- **Critério:** a reserva nasce `CONFIRMED`, pode ser cancelada uma vez e não pode ser reativada/editada.  
  **Teste:** transições de estado puras.  
  **Verificar:** `npm test -- tests/domain/reservation.test.ts`

### 3. SQLite, schema e dados iniciais — P1

- **Critério:** um banco novo contém sempre um laboratório e um equipamento operacionais com IDs fixos.  
  **Teste:** integração contra SQLite `:memory:`.  
  **Verificar:** `npm test -- tests/integration/sqlite-repository.test.ts`
- **Critério:** consultas de conflito ignoram reservas canceladas e permitem limites consecutivos.  
  **Teste:** integração contra SQLite real descartável.  
  **Verificar:** `npm test -- tests/integration/sqlite-repository.test.ts`
- **Critério:** transação reverte reserva e evento se uma das gravações falhar.  
  **Teste:** falha induzida na segunda gravação, sem mocks de persistência.  
  **Verificar:** `npm test -- tests/integration/transaction.test.ts`

### 4. Casos de uso — P0

- Implementar `CreateReservation`: recurso existente, intervalo válido, conflito, reserva confirmada e evento atômico.  
  **Verificar:** `npm test -- tests/integration/create-reservation.test.ts`
- Implementar `CancelReservation`: existência, cancelamento único, evento e reutilização do intervalo.  
  **Verificar:** `npm test -- tests/integration/cancel-reservation.test.ts`
- Implementar `ListAvailability`, `ListReservations` e `GetReservationHistory`, incluindo filtros por recurso/estado.  
  **Verificar:** `npm test -- tests/integration/query-use-cases.test.ts`

### 5. Contrato HTTP — P1

- Validar JSON, IDs, enums e ISO 8601 com fuso; traduzir os erros para o formato uniforme e códigos HTTP definidos.  
  **Verificar:** `npm test -- tests/api/validation.test.ts`
- Expor todas as rotas planejadas e garantir contratos de sucesso, conflito, inexistência e histórico.  
  **Verificar:** `npm test -- tests/api/reservations-api.test.ts`
- Registrar erro inesperado somente no backend e devolver `INTERNAL_ERROR` sem stack trace.  
  **Verificar:** `npm test -- tests/api/error-handling.test.ts`

### 6. Interface única — P1

- Exibir recursos e disponibilidade para um período consultado; fornecer formulário acessível de criação.  
  **Verificar:** `npm run build` e `npm run test:e2e -- --grep "cria uma reserva"`
- Exibir resultado e erros esperados; listar reservas, filtros e ação de cancelamento apenas para `CONFIRMED`.  
  **Verificar:** `npm run test:e2e -- --grep "conflito|filtros|cancelamento"`
- Exibir histórico global em ordem cronológica, com data, tipo e identificador da reserva.  
  **Verificar:** `npm run test:e2e -- --grep "histórico"`

### 7. E2E, documentação e gate final — P0

- Cobrir o roteiro de aceitação: criação, sobreposição recusada, intervalo consecutivo, cancelamento, reutilização, filtros e histórico.  
  **Verificar:** `npm run test:e2e`
- Atualizar README com arquitetura, decisões, dados iniciais, comandos, testes, limitações e roteiro manual.  
  **Verificar:** `npm run typecheck && npm run lint && npm run build && npm test && npm run test:e2e`
- Executar revisão independente após `audit-code`; corrigir somente achados confirmados e repetir o gate final.  
  **Verificar:** registrar saída dos comandos e decisão do revisor em `docs/verification/`.

## Matriz de regras de negócio

| Regra | Cobertura principal |
|---|---|
| fim posterior ao início | domínio + API |
| sem sobreposição confirmada | domínio + integração + API + E2E |
| consecutivas permitidas | domínio + integração + E2E |
| criação confirmada | domínio + integração |
| cancelamento único | domínio + integração + API |
| canceladas não bloqueiam | integração + E2E |
| sem edição/reativação | domínio + API (rotas ausentes) |
| evento por criação/cancelamento | integração + API + E2E |
| ISO 8601 e UTC | domínio + API + integração |
| backend autoritativo | API + integração |

## Entregável por incremento

Cada entrega deve registrar em `docs/verification/`:

1. critério implementado;
2. comando e evidência do teste vermelho;
3. implementação mínima e arquivos alterados;
4. comandos verdes executados;
5. limitações conhecidas;
6. decisão do revisor independente.

## Exclusões mantidas

Sem autenticação, autorização, pagamentos, notificações, filas, cache, microsserviços, Docker, nuvem, edição/reativação, calendário avançado, drag-and-drop ou IA no produto.
