# Verificação — Interface React e E2E

## Critérios validados

- A interface carrega recursos, permite criar e cancelar reservas, aplica filtros e mostra o histórico global.
- A API continua como autoridade das regras de disponibilidade e conflito.
- O fluxo E2E cobre criação, conflito, intervalo consecutivo, cancelamento, histórico e filtros.

## Correções encontradas durante o gate

- `index.html` não carregava `src/web/main.tsx`; a página ficava em branco. Foi adicionado o entry point Vite.
- A consulta de reservas enviava `status=` quando o filtro estava vazio, que o contrato HTTP rejeita. `src/web/api.ts` agora omite filtros vazios.
- O runtime Chromium do Playwright foi instalado localmente com `npx playwright install chromium`.

## Gate executado

```text
Smoke: node --import tsx src/server/main.ts + GET /api/resources
npm run typecheck
npm run lint
npm run build
npm test
npm run test:e2e
```

Todos terminaram com código 0. A suíte de testes tem 13 testes unitários/API e 2 cenários Playwright aprovados.

## Limitações conhecidas

A revisão independente e a auditoria de código ainda não foram executadas.
