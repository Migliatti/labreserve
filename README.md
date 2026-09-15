# LabReserve

Sistema web local para consultar e reservar laboratórios e equipamentos.

## Requisitos

- Node.js 22.13 ou superior (o projeto usa `node:sqlite` nas histórias de persistência).
- npm 10 ou superior.

## Comandos

```bash
npm install
# Terminal 1: API em http://127.0.0.1:3000
npm run dev:api
# Terminal 2: interface em http://127.0.0.1:5173
npm run dev
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

O sistema oferece consulta de disponibilidade, criação, listagem, filtros, cancelamento e histórico de reservas. O banco local cria os recursos iniciais `lab-chemistry` e `equipment-microscope`; não há autenticação, edição/reativação, notificações ou calendário avançado. Consulte [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para as decisões e [docs/verification/e05s01-interface-e2e.md](docs/verification/e05s01-interface-e2e.md) para o gate executado.
