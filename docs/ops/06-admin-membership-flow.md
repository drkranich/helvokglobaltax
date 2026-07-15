# Admin membership flow - 2026-07-15

## Objetivo

Adicionar a ponte entre Supabase Auth e autorizacao multi-tenant do Helvok Tax. Login cria/sincroniza `core.users`; membership define o que esse usuario pode acessar dentro de um tenant.

## Banco

Migration aplicada:

```text
20260715112523_add_membership_admin_rpc
```

Funcoes criadas:

- `public.helvok_admin_list_memberships(uuid)`
- `public.helvok_admin_upsert_membership(jsonb)`

Permissoes verificadas:

```text
helvok_admin_list_memberships:
  anon: false
  authenticated: false
  service_role: true

helvok_admin_upsert_membership:
  anon: false
  authenticated: false
  service_role: true
```

Security advisor:

```text
lints: []
```

Performance advisor manteve apenas avisos informativos de indices ainda sem uso, esperados nesta fase inicial da base.

## Worker

Deploy Cloudflare:

```text
worker: helvokglobaltax
url: https://helvokglobaltax.genialidadefilosofica.workers.dev
version_id: ce993256-3c87-499e-ab8a-67d0728c7593
```

Novas rotas admin protegidas por `HELVOK_ADMIN_TOKEN`:

```text
GET /v1/admin/tenants/:tenantId/memberships
POST /v1/admin/memberships
```

Payload minimo para conceder o primeiro owner:

```json
{
  "tenant_id": "f8f16a8b-accc-47d1-a551-955381c23984",
  "email": "owner@example.com",
  "role_key": "owner"
}
```

O usuario precisa ter entrado/sincronizado pelo menos uma vez para existir em `core.users`. Isso evita criar membership para identidade nao verificada.

## Frontend

O command center recebeu a malha visual de acesso:

- usuario core;
- role efetiva;
- tenant ativo;
- total de permissoes;
- estado do owner operacional.

Quando a sessao tiver membership ativo, o cockpit passa a refletir tenants, organizacoes e permissoes retornados por `helvok_current_session()`.

## Validacao remota

Tenant foundation consultado:

```text
tenant_id: f8f16a8b-accc-47d1-a551-955381c23984
memberships: []
```

O proximo passo operacional e o primeiro usuario real entrar pelo painel. Depois disso, o endpoint admin pode conceder `owner` a esse email.
