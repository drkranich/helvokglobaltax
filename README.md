# Helvok Tax

Infraestrutura global de compliance tributario para calculo, emissao, auditoria e integracao fiscal em multiplos paises.

Este repositorio comeca na Fase 0: arquitetura, dominio, modelagem, seguranca, observabilidade, testes e roadmap. Nenhum backend, frontend, migration ou adaptador fiscal deve ser implementado antes de a arquitetura ser revisada e aprovada.

## Principio central

O Core da plataforma nunca conhece legislacoes especificas como ICMS, VAT, IVA, GST, Sales Tax, ISS, Excise, IBS ou CBS. O Core conhece apenas conceitos globais: tenants, organizacoes, partes, produtos, operacoes, documentos, regras, eventos, workflows, auditoria e storage. Cada pais implementa suas obrigacoes em um adaptador fiscal independente.

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
- Dominio provisório Cloudflare Workers: `helvokglobaltax.genialidadefilosofica.workers.dev`

## Documentacao da Fase 0

- [Indice da Fase 0](docs/README.md)
- [Arquitetura de alto nivel](docs/architecture/01-system-architecture.md)
- [Modelo de dominio](docs/architecture/02-domain-model.md)
- [Modelo relacional e estrategia Supabase](docs/architecture/03-relational-model.md)
- [Multi-tenancy](docs/architecture/04-multitenancy.md)
- [Versionamento de regras tributarias](docs/architecture/05-tax-rule-versioning.md)
- [Plugins e adaptadores por pais](docs/architecture/06-country-plugin-strategy.md)
- [APIs, eventos e workflows](docs/architecture/07-api-events-workflows.md)
- [Seguranca e observabilidade](docs/architecture/08-security-observability.md)
- [Plano de testes](docs/architecture/09-testing-plan.md)
- [Visao de produto e MVP](docs/product/01-product-vision-and-mvp.md)
- [Roadmap incremental](docs/roadmap/01-incremental-delivery-plan.md)

## Guardrails

- Nao escrever regra tributaria fixa no codigo da aplicacao.
- Nao emitir documentos fiscais diretamente pelo frontend.
- Nao sobrescrever regras tributarias; toda mudanca cria nova versao e nova vigencia.
- Nao misturar IA com decisao tributaria homologada.
- Nao criar arquitetura exclusiva para o Brasil.
- Nao avancar para backend antes da revisao da Fase 0.
