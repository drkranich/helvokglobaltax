# Worker admin API - Phase 2 partial - 2026-07-15

## Objetivo

Registrar a primeira entrega da Fase 2: APIs administrativas no Cloudflare Worker para operar a fundacao multi-tenant criada no Supabase.

Esta entrega ainda nao expõe frontend nem fluxo de usuario final. Ela cria o caminho server-side para bootstrap de tenants e organizacoes.

## Deploy

| Item | Valor |
| --- | --- |
| Worker | `helvokglobaltax` |
| URL | `https://helvokglobaltax.genialidadefilosofica.workers.dev` |
| Versao Cloudflare | `5480e2a1-fa7c-451f-9239-cdb99418c6f7` |
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

- O valor de `HELVOK_ADMIN_TOKEN` foi gravado como secret do Worker e nao e recuperavel depois da escrita.
- Antes de uso manual das rotas admin, rotacionar `HELVOK_ADMIN_TOKEN` para um valor guardado fora do repositorio.
- O valor de `SUPABASE_SERVICE_ROLE_KEY` tambem esta gravado apenas como secret do Worker.

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

## Validacoes locais

```text
npm run typecheck -> OK
npm test -> 5 tests passed
npx wrangler deploy --dry-run -> OK
npx wrangler deploy -> OK
```

## Proximo passo

Rotacionar `HELVOK_ADMIN_TOKEN` para um valor operacional guardado fora do repositorio e executar smoke test real:

1. `GET /v1/admin/health` com token.
2. `POST /v1/admin/tenants`.
3. `POST /v1/admin/organizations`.
4. Validar audit/outbox no Supabase.
