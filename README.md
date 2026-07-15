# Helvok Tax

Infraestrutura global de compliance tributário para cálculo, emissão, auditoria e integração fiscal em múltiplos países.

Este repositório começou pela Fase 0: arquitetura, domínio, modelagem, segurança, observabilidade, testes e roadmap.

Estado atual:

- Worker público publicado na Cloudflare.
- API foundation em Hono/TypeScript.
- Supabase PostgreSQL com schema core/audit, RLS e migrations iniciais.
- Bootstrap real do tenant `helvok-tax-foundation`.
- Primeiro painel visual glassmorphism publicado na rota `/`.
- Auth/session preview com Supabase Auth, `core.users` e RLS.
- Admin membership flow para vincular usuários autenticados a tenants e roles.
- Workbench autenticado de usuários, roles e memberships para owners.
- Convites de usuários com token hasheado, expiração, aceite, reenvio e revogação.
- Simulador fiscal operacional com pacote de regras global seed, cadeia de valor, impostos, fees, margem e preço sugerido.

## Principio central

O Core da plataforma nunca conhece legislações específicas como ICMS, VAT, IVA, GST, Sales Tax, ISS, Excise, IBS ou CBS. O Core conhece apenas conceitos globais: tenants, organizações, partes, produtos, operações, documentos, regras, eventos, workflows, auditoria e storage. Cada país implementa suas obrigações em um adaptador fiscal independente.

## Stack alvo

- Frontend: Next.js, App Router, TypeScript, Tailwind, React Query.
- Backend: Cloudflare Workers, Hono, TypeScript.
- Banco: Supabase PostgreSQL.
- Auth: Supabase Auth.
- Storage: Cloudflare R2.
- Cache: Cloudflare KV.
- Filas: Cloudflare Queues.
- Processamentos: Cloudflare Workflows.
- Realtime: Supabase Realtime.
- Logs e tracing: OpenTelemetry e Sentry.
- CI/CD: GitHub Actions e Cloudflare Deploy.

## Ambiente informado

- Supabase: `https://jlvwudjgfzhhdgttrycj.supabase.co`
- GitHub: `https://github.com/drkranich/helvokglobaltax`
- Cloudflare Workers: `https://helvokglobaltax.genialidadefilosofica.workers.dev`

## Rotas publicadas

- Painel visual: `GET /`
- Painel visual alternativo: `GET /app`
- Health check: `GET /health`
- API metadata: `GET /v1`
- API status: `GET /v1/status`
- API meta: `GET /v1/meta`
- Mercados do simulador fiscal: `GET /v1/tax/markets`
- Simulação fiscal: `POST /v1/tax/simulate`
- Comparação de mercados: `POST /v1/tax/compare`
- Auth config: `GET /v1/auth/config`
- Sessão atual: `GET /v1/me`
- Sync de usuário autenticado: `POST /v1/session/sync`
- Workbench de acesso do tenant: `GET /v1/tenants/:tenantId/access`
- Salvar membership autenticado: `POST /v1/tenants/:tenantId/memberships`
- Criar convite autenticado: `POST /v1/tenants/:tenantId/invitations`
- Reenviar convite autenticado: `POST /v1/tenants/:tenantId/invitations/:invitationId/resend`
- Revogar convite autenticado: `POST /v1/tenants/:tenantId/invitations/:invitationId/revoke`
- Aceitar convite autenticado: `POST /v1/invitations/accept`
- Listar memberships do tenant: `GET /v1/admin/tenants/:tenantId/memberships`
- Conceder/atualizar membership: `POST /v1/admin/memberships`
- Admin API protegida: `GET/POST /v1/admin/*`

## Documentação

- [Indice da Fase 0](docs/README.md)
- [Arquitetura de alto nivel](docs/architecture/01-system-architecture.md)
- [Modelo de domínio](docs/architecture/02-domain-model.md)
- [Modelo relacional e estrategia Supabase](docs/architecture/03-relational-model.md)
- [Multi-tenancy](docs/architecture/04-multitenancy.md)
- [Versionamento de regras tributárias](docs/architecture/05-tax-rule-versioning.md)
- [Plugins e adaptadores por país](docs/architecture/06-country-plugin-strategy.md)
- [APIs, eventos e workflows](docs/architecture/07-api-events-workflows.md)
- [Seguranca e observabilidade](docs/architecture/08-security-observability.md)
- [Plano de testes](docs/architecture/09-testing-plan.md)
- [Visao de produto e MVP](docs/product/01-product-vision-and-mvp.md)
- [Checagem de ambiente](docs/ops/01-environment-check.md)
- [Supabase Phase 1 foundation](docs/ops/02-supabase-phase-1-foundation.md)
- [Worker admin API Phase 2](docs/ops/03-worker-admin-api-phase-2.md)
- [Glass admin preview](docs/ops/04-glass-admin-preview.md)
- [Auth session preview](docs/ops/05-auth-session-preview.md)
- [Admin membership flow](docs/ops/06-admin-membership-flow.md)
- [User role membership workbench](docs/ops/07-user-role-membership-workbench.md)
- [Membership invitations](docs/ops/08-membership-invitations.md)
- [Tax simulator engine](docs/ops/09-tax-simulator-engine.md)
- [Roadmap incremental](docs/roadmap/01-incremental-delivery-plan.md)

## Guardrails

- Não escrever regra tributária fixa no código da aplicação.
- Não emitir documentos fiscais diretamente pelo frontend.
- Não sobrescrever regras tributárias; toda mudança cria nova versão e nova vigência.
- Não misturar IA com decisão tributária homologada.
- Não criar arquitetura exclusiva para o Brasil.
- Manter cada fase funcional, revisável e preparada para produção antes da fase seguinte.
