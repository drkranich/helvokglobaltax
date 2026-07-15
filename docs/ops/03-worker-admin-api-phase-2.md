# Worker admin API - Phase 2 partial - 2026-07-15

## Objetivo

Registrar a primeira entrega da Fase 2: APIs administrativas no Cloudflare Worker para operar a fundacao multi-tenant criada no Supabase.

Esta entrega ainda nao expõe frontend nem fluxo de usuario final. Ela cria o caminho server-side para bootstrap de tenants e organizacoes.

## Deploy

| Item | Valor |
| --- | --- |
| Worker | `helvokglobaltax` |
| URL | `https://helvokglobaltax.genialidadefilosofica.workers.dev` |
| Versao Cloudflare | `5295e8e5-4812-4c7f-84b7-1cd5c73607c3` |
| Perfil Wrangler | `genialidadefilosofica` |

## Rotas adicionadas

Todas as rotas abaixo ficam sob:

```text
/v1/admin
```

Rotas:

- `GET /v1/admin/health`
- `GET /v1/admin/tenants`
- `POST /v1/admin/tenants`
- `GET /v1/admin/tenants/:tenantId/organizations`
- `POST /v1/admin/organizations`

## Autenticacao administrativa

As rotas aceitam token administrativo por:

```text
Authorization: Bearer <token>
```

ou:

```text
x-helvok-admin-token: <token>
```

O token e comparado por hash SHA-256 com comparacao constante em tempo para reduzir vazamento por timing.

O Worker normaliza tokens com `trim()` antes da comparacao para evitar falhas causadas por quebras de linha em secrets gravados via CLI.

## Secrets configurados

O Worker possui os secrets necessarios configurados por nome. `wrangler secret list` retornou:

```text
HELVOK_ADMIN_TOKEN
SUPABASE_SERVICE_ROLE_KEY
```

Valores configurados:

- `HELVOK_ADMIN_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY`

Esses valores nunca devem entrar em:

- `wrangler.jsonc`
- `.env` versionado
- docs
- logs
- commits

Observacao operacional:

- O valor de `HELVOK_ADMIN_TOKEN` foi rotacionado como secret do Worker e nao e recuperavel depois da escrita.
- Antes de novo uso manual das rotas admin, rotacionar `HELVOK_ADMIN_TOKEN` para um valor guardado fora do repositorio.
- O valor de `SUPABASE_SERVICE_ROLE_KEY` tambem esta gravado apenas como secret do Worker.
- O cliente Supabase normaliza `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` com `trim()` antes de montar headers.
- O cliente Supabase chama `fetch` por wrapper proprio para evitar `Illegal invocation` em Cloudflare Workers.

Comandos seguros para rotacionar:

```text
npx wrangler secret put HELVOK_ADMIN_TOKEN
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

## Supabase RPCs criadas

Migration aplicada:

```text
20260715000146_add_admin_rpc_functions
```

Funcoes:

- `public.helvok_admin_list_tenants()`
- `public.helvok_admin_create_tenant(jsonb)`
- `public.helvok_admin_list_organizations(uuid)`
- `public.helvok_admin_create_organization(jsonb)`

Permissoes validadas:

```text
anon_can_execute: false
authenticated_can_execute: false
service_role_can_execute: true
```

Security advisor:

```text
lints: []
```

## Smoke tests remotos

Rotas publicas:

```text
GET /v1 -> tenants: admin-api-preview, organizations: admin-api-preview
```

Rota admin sem token de requisicao:

```text
GET /v1/admin/health -> 401 unauthorized
```

Esse resultado e esperado quando `HELVOK_ADMIN_TOKEN` existe no Worker, mas a requisicao nao envia o token administrativo.

Rota admin com token rotacionado:

```text
GET /v1/admin/health -> 200 ok
GET /v1/admin/tenants -> 200 ok
```

Bootstrap real criado via Worker publico:

| Recurso | Valor |
| --- | --- |
| Tenant slug | `helvok-tax-foundation` |
| Tenant ID | `f8f16a8b-accc-47d1-a551-955381c23984` |
| Organizacao | `Helvok Tax` |
| Organizacao ID | `ccca1d3a-b7f6-4a72-871a-90d13ae252ba` |
| Estabelecimento | `Helvok Tax Brasil` |
| Estabelecimento ID | `02d8b2df-7372-4880-b0dd-9b1962ea20e3` |

Validacao no Supabase:

```text
tenants: 1
organizations: 1
establishments: 1
audit_events bootstrap: 2
outbox_events bootstrap: 2
security advisor: []
```

## Validacoes locais

```text
npm run typecheck -> OK
npm test -> 6 tests passed
npx wrangler deploy --dry-run -> OK
npx wrangler deploy -> OK
```

## Proximo passo

Continuar a Fase 2 com autenticacao de usuarios e RBAC aplicado aos usuarios reais:

1. Conectar Supabase Auth ao modelo `core.users`.
2. Criar RPCs seguras para convite/ativacao de usuario.
3. Criar memberships por tenant/organizacao.
4. Expor endpoints Worker para usuarios, membros e roles.
5. Validar RLS/RBAC por usuario autenticado.
