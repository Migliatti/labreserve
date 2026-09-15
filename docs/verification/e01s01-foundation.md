# Verificação — e01s01 Fundação reprodutível

## Critério implementado

O projeto declara scripts locais reproduzíveis para teste, tipos, lint, build e desenvolvimento, sem dependências de versão `latest`.

## Evidência RED

Commit `27d675d` contém apenas o teste. Executado antes da implementação:

```text
node --test tests/foundation/project-configuration.test.mjs
not ok ... package.json deve existir
false !== true
exit 1
```

## Evidência GREEN

Commit `6b7598d` adiciona configuração mínima, lockfile e documentação. Após uma correção de compatibilidade observada entre TypeScript 7 e `typescript-eslint` (peer dependency `<6.1.0`), TypeScript foi fixado em `6.0.3`.

Comandos aprovados:

```text
npm test
npm run typecheck
npm run lint
npm run build
grep -q 'Node.js 22.13' README.md
```

Todos terminaram com código 0.

## Arquivos alterados

`package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.js`, `index.html`, `.gitignore`, `src/project.ts`, `README.md` e o teste de configuração.

## Auditoria local

- Segurança e cadeia de suprimentos: aprovada; dependências têm versões fixas, `npm audit` não reportou vulnerabilidades e não há segredo, entrada externa, autenticação ou API nesta fatia.
- Tipos/lint/build: aprovados pelos comandos acima.
- Escopo e clareza: aprovados; não há regra de negócio, API, persistência ou UI de produto.
- Cheiro detectado: nenhum. A âncora `src/project.ts` é intencional para dar entrada ao compilador enquanto a primeira história de domínio não começa.

## Limitações conhecidas

A entrega não inclui SQLite, servidor, interface nem E2E; todos permanecem fora do escopo desta história. A revisão independente está pendente, pois a orientação atual solicita execução local sem delegação.
