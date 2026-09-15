# Graph Report - deskpulse  (2026-09-15)

## Corpus Check
- Corpus is ~8,127 words - fits in a single context window. You may not need a graph.

## Summary
- 222 nodes · 366 edges · 15 communities
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Build and Package Configuration
- Reservation History Contracts
- Architecture and Delivery Evidence
- Domain and Application Errors
- Repository Ports and Utilities
- HTTP API Server
- TypeScript Compiler Configuration
- React UI and API Client
- Development Toolchain Dependencies
- Temporal Domain Rules
- Foundation Delivery
- TDD Implementation Planning

## God Nodes (most connected - your core abstractions)
1. `SqliteLabReserveRepository` - 20 edges
2. `createAppServer()` - 18 edges
3. `Reservation` - 17 edges
4. `LabReserveRepository` - 16 edges
5. `compilerOptions` - 14 edges
6. `LabReserveService` - 13 edges
7. `ReservationEvent` - 12 edges
8. `Resource` - 10 edges
9. `DomainError` - 9 edges
10. `scripts` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Story e04s01 API` --semantically_similar_to--> `HTTP Reservation Contract`  [INFERRED] [semantically similar]
  specs/epics/e04-api/e04s01-api.md → docs/ARCHITECTURE.md
- `Story e03s01 Persistence` --semantically_similar_to--> `Atomic Reservation Transactions`  [INFERRED] [semantically similar]
  specs/epics/e03-persistence/e03s01-persistence.md → docs/ARCHITECTURE.md
- `TimeInterval Domain Model` --semantically_similar_to--> `Strict Interval Conflict Rule`  [INFERRED] [semantically similar]
  specs/epics/e02-domain/e02s01-domain.md → docs/ARCHITECTURE.md
- `Persistence Partial Verification` --implements--> `Story e03s01 Persistence`  [INFERRED]
  docs/verification/e03s01-persistence-partial.md → specs/epics/e03-persistence/e03s01-persistence.md
- `withServer()` --calls--> `createAppServer()`  [EXTRACTED]
  tests/api/reservations-api.test.ts → src/server/app-server.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **LabReserve Layered Delivery** — specs_epics_e02_domain_e02s01_domain_story_e02s01, specs_epics_e03_persistence_e03s01_persistence_story_e03s01, specs_epics_e04_api_e04s01_api_story_e04s01 [INFERRED 0.95]
- **Reservation Consistency Rules** — docs_architecture_strict_interval_conflict, docs_architecture_atomic_reservation_transactions, specs_epics_e02_domain_e02s01_domain_time_interval_domain_model, specs_epics_e03_persistence_e03s01_persistence_labreserve_service [INFERRED 0.85]
- **Story Task and Verification Chain** — specs_epics_e01_foundation_e01s01_foundation_story_e01s01, specs_epics_e01_foundation_e01s01_tasks_e01s01_task_ledger, docs_verification_e01s01_foundation_foundation_verification, specs_epics_e02_domain_e02s01_domain_story_e02s01, specs_epics_e02_domain_e02s01_tasks_e02s01_task_ledger, docs_verification_e02s01_domain_domain_verification [INFERRED 0.95]

## Communities (15 total, 0 thin omitted)

### Community 0 - "Build and Package Configuration"
Cohesion: 0.06
Nodes (33): dependencies, react, react-dom, vite, @vitejs/plugin-react, engines, node, name (+25 more)

### Community 1 - "Reservation History Contracts"
Cohesion: 0.10
Nodes (12): ReservationEvent, ReservationEventType, Reservation, ReservationStatus, ResourceCategory, ResourceStatus, eventFromRow(), reservationFromRow() (+4 more)

### Community 2 - "Architecture and Delivery Evidence"
Cohesion: 0.09
Nodes (26): Agent Issue Board, Repository Knowledge Graph Pipeline, LabReserve UI Delivery, Atomic Reservation Transactions, HTTP Reservation Contract, Inward Dependency Rule, LabReserve Architecture, Modular TypeScript Monolith (+18 more)

### Community 3 - "Domain and Application Errors"
Cohesion: 0.15
Nodes (10): ApplicationError, ApplicationErrorCode, DomainError, DomainErrorCode, cancelReservation(), createConfirmedReservation(), CreateReservationProps, TimeInterval (+2 more)

### Community 4 - "Repository Ports and Utilities"
Cohesion: 0.19
Nodes (5): Clock, IdGenerator, LabReserveRepository, LabReserveService, Resource

### Community 5 - "HTTP API Server"
Cohesion: 0.20
Nodes (12): CreateReservationInput, AppServerOptions, bodyOf(), createAppServer(), errorResponse(), reservationInput(), send(), ValidationError (+4 more)

### Community 6 - "TypeScript Compiler Configuration"
Cohesion: 0.12
Nodes (15): compilerOptions, esModuleInterop, exactOptionalPropertyTypes, jsx, lib, module, moduleResolution, noEmit (+7 more)

### Community 7 - "React UI and API Client"
Cohesion: 0.22
Nodes (12): react, api, ApiError, Reservation, ReservationEvent, Resource, App(), cancel() (+4 more)

### Community 8 - "Development Toolchain Dependencies"
Cohesion: 0.17
Nodes (12): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, globals, @playwright/test, tsx, @types/node (+4 more)

### Community 9 - "Temporal Domain Rules"
Cohesion: 0.33
Nodes (7): Strict Interval Conflict Rule, Domain Verification, Centralized Temporal Rules, Story e02s01 Domain, TimeInterval Domain Model, e02s01 Task Ledger, Domain Epic

### Community 10 - "Foundation Delivery"
Cohesion: 0.40
Nodes (5): Foundation Verification, Reproducible Local Environment, Story e01s01 Foundation, e01s01 Task Ledger, Foundation Epic

### Community 11 - "TDD Implementation Planning"
Cohesion: 0.67
Nodes (3): Business Rule Coverage Matrix, LabReserve Implementation Plan, TDD Delivery Cycle

## Knowledge Gaps
- **74 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+69 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 93 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SqliteLabReserveRepository` connect `Reservation History Contracts` to `Domain and Application Errors`, `Repository Ports and Utilities`, `HTTP API Server`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `react` connect `React UI and API Client` to `Build and Package Configuration`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Development Toolchain Dependencies` to `Build and Package Configuration`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `createAppServer()` (e.g. with `.cancelReservation()` and `.createReservation()`) actually correct?**
  _`createAppServer()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _74 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Build and Package Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.0553306342780027 - nodes in this community are weakly interconnected._
- **Should `Reservation History Contracts` be split into smaller, more focused modules?**
  _Cohesion score 0.10158730158730159 - nodes in this community are weakly interconnected._