# Arquitetura de alto nivel

## Objetivo

Helvok Tax e uma infraestrutura global de compliance tributario. Ela fornece uma API unica para softwares, SaaS, ERPs, marketplaces, CRMs e e-commerces calcularem tributos, emitirem documentos fiscais, comunicarem-se com governos e auditarem operacoes em varios paises.

O Brasil e o primeiro adaptador fiscal, nao o centro da arquitetura.

## Nao objetivos

- Nao e ERP.
- Nao e CMS.
- Nao e emissor fiscal isolado.
- Nao e motor tributario monolitico.
- Nao deve conter legislacao hardcoded no Core.

## Principios arquiteturais

1. Core global e fiscalmente neutro.
2. Legislacao desacoplada por dados, versoes e adaptadores.
3. Adaptadores fiscais por pais, com contratos estaveis.
4. Toda emissao assincrona via filas e workflows.
5. Toda decisao fiscal rastreavel por regra, versao, fonte legal e vigencia.
6. Multi-tenancy por desenho, nao por convencao posterior.
7. Seguranca, auditoria e observabilidade desde a primeira migration.
8. APIs publicas versionadas, idempotentes e com rate limit.
9. IA separada de decisao fiscal homologada.
10. Cada fase deve ser funcional, revisavel e pronta para producao.

## Topologia logica

```mermaid
flowchart TB
  ClientApps["ERPs, SaaS, Marketplaces, E-commerces, SDKs"]
  PublicAPI["Public API\nCloudflare Workers + Hono"]
  PrivateAPI["Private/Admin API\nCloudflare Workers + Hono"]
  Auth["Supabase Auth\nJWT + App Metadata"]
  RBAC["RBAC / ABAC\nTenant + Organization + Role"]
  Core["Core Platform\nTenants, Organizations, Products,\nOperations, Documents, Rules,\nEvents, Audit, Storage"]
  RuleEngine["Rule Engine\nFiscal-neutral evaluation"]
  AdapterRouter["Adapter Router\nCountry + Jurisdiction + Document Type"]
  Plugins["Fiscal Adapter Plugins\nBrazil, Portugal, Germany,\nUSA, Canada, Japan, etc."]
  Regulatory["Regulatory Intelligence\nOfficial sources, providers,\nevidence, impact analysis"]
  Queues["Cloudflare Queues\nEmission, Webhooks, Integrations"]
  Workflows["Cloudflare Workflows\nLong-running fiscal processes"]
  Supabase["Supabase PostgreSQL\nRLS + Audit + Realtime"]
  R2["Cloudflare R2\nXML, PDF, receipts, evidence"]
  KV["Cloudflare KV\nConfig cache, rate limit hints"]
  Gov["Government Systems\nSEFAZ, municipalities, tax authorities"]
  Webhooks["Customer Webhooks"]
  Observability["OpenTelemetry + Sentry\nLogs, traces, metrics, alerts"]

  ClientApps --> PublicAPI
  PublicAPI --> Auth
  PrivateAPI --> Auth
  Auth --> RBAC
  RBAC --> Core
  Core --> RuleEngine
  RuleEngine --> AdapterRouter
  AdapterRouter --> Plugins
  Regulatory --> RuleEngine
  Regulatory --> Plugins
  Plugins --> Gov
  Core --> Supabase
  Core --> R2
  Core --> KV
  Core --> Queues
  Queues --> Workflows
  Workflows --> Plugins
  Queues --> Webhooks
  PublicAPI --> Observability
  PrivateAPI --> Observability
  Workflows --> Observability
  Plugins --> Observability
```

## Camadas

### Edge/API

- Workers com Hono para APIs publicas e privadas.
- API versionada: `/v1`.
- Idempotencia obrigatoria em operacoes mutaveis.
- Rate limit por tenant, app, chave de API e endpoint.
- Validacao de payload antes de tocar no dominio.

### Core

Responsavel por conceitos globais:

- tenants
- organizacoes
- usuarios e membros
- permissoes
- catalogo global
- clientes/partes
- operacoes comerciais
- documentos fiscais abstratos
- regras fiscais abstratas
- eventos
- workflows
- auditoria
- storage
- observabilidade
- SDK
- marketplace de plugins

O Core nao possui classes, colunas ou enums especificos de um tributo nacional.

### Fiscal Adapter Layer

Responsavel por conhecer:

- documentos fiscais locais
- tributos locais
- autoridades governamentais
- formatos XML, JSON, PDF e QR Code
- assinaturas digitais
- protocolos de comunicacao
- rejeicoes e retornos
- obrigacoes acessorias
- guias e declaracoes

Cada adaptador implementa um contrato padrao e pode possuir tabelas proprias em schema isolado.

### Data Layer

- Supabase PostgreSQL como fonte relacional.
- RLS obrigatorio nas tabelas expostas.
- Schemas separados por responsabilidade.
- Views com `security_invoker` quando forem expostas.
- R2 para documentos fiscais, artefatos assinados e evidencias.
- KV para caches efemeros e configuracoes de borda.

### Async Layer

- Emissoes, transmissao governamental, webhooks e integracoes passam por filas.
- Workflows orquestram etapas longas, retentativas, backoff e compensacoes.
- Nenhuma emissao deve depender da sessao HTTP do usuario.

## Topologia de deploy

```mermaid
flowchart LR
  GH["GitHub\nmain branch"] --> CI["GitHub Actions\nlint, tests, migrations check"]
  CI --> CFPages["Cloudflare Pages\nAdmin Console / Docs"]
  CI --> CFWorkers["Cloudflare Workers\nAPI + adapters"]
  CFWorkers --> CFSvc["Cloudflare services\nQueues, Workflows, KV, R2"]
  CFWorkers --> SB["Supabase\nPostgreSQL + Auth + Realtime"]
  CFWorkers --> Sentry["Sentry"]
  CFWorkers --> OTel["OTel Collector / backend"]
```

## Modulos principais

| Modulo | Responsabilidade | Fase inicial |
| --- | --- | --- |
| Identity | Auth, usuarios, membros, app metadata | Fase 2 |
| Tenancy | tenants, ambientes, isolamento | Fase 2 |
| Organizations | grupos, empresas, filiais, estabelecimentos | Fase 2 |
| Catalog | produtos, servicos, classificacoes globais | Fase 3 |
| Parties | clientes, fornecedores, enderecos, IDs fiscais | Fase 3 |
| Commerce | pedidos, itens, operacoes, moedas | Fase 3 |
| Tax Rules | regras, versoes, vigencias, fontes legais | Fase 4 |
| Tax Calculation | simulacoes e calculo fiscal | Fase 4 |
| Fiscal Documents | ciclo de vida abstrato de documentos | Fase 5 |
| Brazil Adapter | NF-e inicial e homologacao | Fase 5 |
| Regulatory Intelligence | fontes oficiais, provedores, evidencias, impacto e homologacao | Fase 4+ |
| Audit | trilha imutavel e eventos de dominio | Fase 1 |
| Integrations | webhooks, API keys, conectores | Fases 7-8 |
| AI Assist | explicacoes e inconsistencias, sem decidir imposto | Fase posterior |

## Fluxo de calculo tributario

```mermaid
sequenceDiagram
  participant Client as Cliente/SDK
  participant API as Public API
  participant Core as Core
  participant Rules as Rule Engine
  participant Adapter as Fiscal Adapter
  participant DB as Supabase

  Client->>API: POST /v1/tax/calculations
  API->>Core: valida tenant, permissao, idempotencia
  Core->>Rules: monta contexto fiscal neutro
  Rules->>DB: busca regras efetivas por jurisdicao/vigencia
  Rules->>Adapter: delega interpretacao especifica do pais
  Adapter->>Rules: retorna linhas de imposto e evidencias
  Rules->>DB: grava resultado, versoes e fontes
  Core->>API: resposta versionada
  API->>Client: calculo + trace_id + rule_snapshot
```

## Fluxo de emissao fiscal

```mermaid
sequenceDiagram
  participant Client as Cliente/SDK
  participant API as Public API
  participant DB as Supabase
  participant Queue as Queue
  participant WF as Workflow
  participant Adapter as Fiscal Adapter
  participant Gov as Governo
  participant R2 as R2

  Client->>API: POST /v1/fiscal-documents
  API->>DB: cria documento em draft/queued
  API->>Queue: publica emission.requested
  API->>Client: 202 Accepted + document_id
  Queue->>WF: inicia workflow de emissao
  WF->>Adapter: valida, assina, serializa
  Adapter->>Gov: transmite documento
  Gov-->>Adapter: autorizacao/rejeicao
  Adapter->>R2: armazena XML/PDF/recibo/evidencias
  WF->>DB: atualiza status e snapshots
  WF->>Queue: publica invoice.authorized ou invoice.rejected
```

## Boundaries do Core

O Core pode:

- escolher adaptador por pais, jurisdicao e tipo de documento;
- validar permissao e ownership;
- persistir estado e auditoria;
- garantir idempotencia;
- controlar lifecycle de documentos;
- orquestrar workflows;
- expor eventos e webhooks.

O Core nao pode:

- calcular ICMS, VAT, Sales Tax ou qualquer imposto especifico;
- conhecer campos fiscais nacionais como CFOP, NCM, CST, CNPJ, EIN, VAT ID como regra de negocio central;
- serializar XML fiscal local;
- decidir protocolo governamental;
- sobrescrever regras sem versao.

## Regulatory Intelligence

Helvok Tax pode consultar governos, bases oficiais e provedores externos, mas essas fontes entram como evidencias controladas. Mudancas criticas passam por analise de impacto, revisao profissional, testes de regressao e publicacao de nova versao antes de afetar producao.

Obrigacoes e transmissoes devem declarar se suportam automacao integral, automacao assistida ou apenas orientacao operacional. Isso impede que o produto prometa transmissao automatica onde a autoridade, o provedor ou a lei exige operador habilitado, certificado, representante local ou submissao externa.

## Ambiente e dominios

O dominio provisório informado para testes diretos na plataforma e:

`helvokglobaltax.genialidadefilosofica.workers.dev`

Durante fases implementaveis, validacoes devem preferir deploys Cloudflare e checks remotos. Localhost e portas locais nao sao o fluxo principal de validacao deste projeto.
