# Fase 0 - Arquitetura

Esta fase transforma o roadmap em uma arquitetura executavel, revisavel e preparada para producao. O objetivo e reduzir ambiguidade antes de criar migrations, backend, frontend ou adaptadores fiscais.

## Entregaveis obrigatorios

1. Arquitetura completa.
2. Diagramas de alto nivel.
3. Modelo de dominio.
4. Modelo relacional.
5. Estrategia de multi-tenancy.
6. Estrategia de versionamento das regras tributarias.
7. Estrategia de plugins por pais.
8. Plano de seguranca.
9. Plano de observabilidade.
10. Plano de testes.
11. Roadmap detalhado por entregas incrementais.

## Arquivos

| Tema | Arquivo |
| --- | --- |
| Arquitetura completa e diagramas | [01-system-architecture.md](architecture/01-system-architecture.md) |
| DDD e dominio | [02-domain-model.md](architecture/02-domain-model.md) |
| MER/DER e Supabase | [03-relational-model.md](architecture/03-relational-model.md) |
| Multi-tenancy | [04-multitenancy.md](architecture/04-multitenancy.md) |
| Regras e versionamento | [05-tax-rule-versioning.md](architecture/05-tax-rule-versioning.md) |
| Plugins por pais | [06-country-plugin-strategy.md](architecture/06-country-plugin-strategy.md) |
| APIs, eventos, workflows | [07-api-events-workflows.md](architecture/07-api-events-workflows.md) |
| Seguranca e observabilidade | [08-security-observability.md](architecture/08-security-observability.md) |
| Testes | [09-testing-plan.md](architecture/09-testing-plan.md) |
| Inteligencia regulatoria | [10-regulatory-intelligence.md](architecture/10-regulatory-intelligence.md) |
| Visao de produto e MVP | [01-product-vision-and-mvp.md](product/01-product-vision-and-mvp.md) |
| Checagem de ambiente | [01-environment-check.md](ops/01-environment-check.md) |
| Fundacao Supabase Fase 1 | [02-supabase-phase-1-foundation.md](ops/02-supabase-phase-1-foundation.md) |
| Worker admin API Fase 2 | [03-worker-admin-api-phase-2.md](ops/03-worker-admin-api-phase-2.md) |
| Admin membership flow | [06-admin-membership-flow.md](ops/06-admin-membership-flow.md) |
| User role membership workbench | [07-user-role-membership-workbench.md](ops/07-user-role-membership-workbench.md) |
| Membership invitations | [08-membership-invitations.md](ops/08-membership-invitations.md) |
| Roadmap incremental | [01-incremental-delivery-plan.md](roadmap/01-incremental-delivery-plan.md) |

## Decisoes registradas

- [ADR 0001 - Limites da Fase 0](adr/0001-phase-0-boundaries.md)
- [ADR 0002 - Core desacoplado de legislacao](adr/0002-core-adapter-boundary.md)
- [ADR 0003 - Plataforma Cloudflare e Supabase](adr/0003-cloudflare-supabase-platform.md)

## Criterios de saida da Fase 0

- A arquitetura permite multiplos paises sem alterar o Core.
- O modelo relacional cobre tenants, organizacoes, catalogo, operacoes, regras, documentos, eventos, auditoria e integracoes.
- A estrategia de RLS e permissoes esta definida antes das migrations.
- O contrato de plugins fiscais esta definido antes do adaptador Brasil.
- Os fluxos de emissao passam por filas/workflows, nao pelo frontend.
- O roadmap permite entregar valor incremental e revisavel em producao.
