# User role membership workbench - 2026-07-15

## Objetivo

Transformar o owner real do Helvok Tax em uma tela operacional de usuarios, roles e memberships, sem expor `HELVOK_ADMIN_TOKEN` ou `SUPABASE_SERVICE_ROLE_KEY` no navegador.

## Banco

Migration aplicada:

```text
20260715114812_add_authenticated_membership_management
```

Funcoes privadas adicionadas em `core`:

- `core.user_has_permission(uuid, text)`
- `core.current_user_is_tenant_owner(uuid)`
- `core.get_tenant_access(uuid)`
- `core.upsert_membership_as_current_user(jsonb)`

Wrappers publicos para Data API:

- `public.helvok_current_tenant_access(uuid)`
- `public.helvok_current_upsert_membership(jsonb)`

Modelo de seguranca:

- wrappers publicos sao `SECURITY INVOKER`;
- funcoes privilegiadas ficam no schema `core`;
- toda leitura/escrita valida `auth.uid()`;
- gestao de membros exige `members.manage`;
- apenas owner pode criar/alterar membership `owner`;
- o ultimo owner ativo nao pode ser revogado;
- usuario nao pode revogar/desativar a si mesmo;
- cada alteracao gera `audit.audit_events` e `audit.outbox_events`.

## Worker

Deploy Cloudflare:

```text
worker: helvokglobaltax
url: https://helvokglobaltax.genialidadefilosofica.workers.dev
version_id: c936948b-9c3c-4159-875d-d81169ec7576
```

Novas rotas autenticadas por Bearer token de usuario:

```text
GET /v1/tenants/:tenantId/access
POST /v1/tenants/:tenantId/memberships
```

Essas rotas usam a chave publica do Supabase e o access token do usuario. Elas nao usam o token admin no navegador.

## Frontend

O command center recebeu a area `Usuarios` com:

- lista real de memberships;
- role efetiva de cada usuario;
- formulario para salvar membership;
- roles disponiveis;
- contagem de permissoes por role;
- trilha de auditoria de acesso.

Limite superado na entrega seguinte:

- convite por link com token hasheado, aceite e expiracao foi entregue em [08-membership-invitations.md](08-membership-invitations.md).

## Validacoes

```text
npm run typecheck -> OK
npm test -> 15 tests passed
npx wrangler deploy --dry-run -> OK
npx wrangler deploy -> OK
GET /health -> 200
GET /v1 -> members: authenticated-rbac-preview
GET /v1/tenants/:tenantId/access sem token -> 401 missing_token
HEAD /app -> 200
```

Validacao SQL simulando o owner `helvokhelvok@gmail.com`:

```text
actor.is_owner: true
actor.can_manage_members: true
memberships: 1
roles: 8
owner permissions: 18
```

## Advisor

Supabase security advisor retornou um aviso global:

```text
auth_leaked_password_protection: WARN
```

Recomendacao: habilitar leaked password protection no Supabase Auth antes de abrir cadastro publico amplo.
