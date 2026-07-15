# Membership invitations - 2026-07-15

## Objetivo

Adicionar convite real de usuarios para o Helvok Tax sem exigir que o convidado ja exista em `core.users`.

O fluxo agora e:

1. owner/admin com `members.manage` gera convite por email;
2. Worker cria token bruto no edge;
3. Worker grava apenas `token_hash` no Supabase;
4. painel devolve o link `/app?invite=...` uma unica vez;
5. convidado entra com Supabase Auth;
6. Worker sincroniza `core.users`;
7. RPC aceita o convite e cria/ativa o membership;
8. auditoria e outbox registram a transicao.

## Banco

Migrations aplicadas:

```text
20260715120214_add_membership_invitations
20260715120931_add_membership_invitations_explicit_deny_policy
```

Nova tabela:

```text
core.membership_invitations
```

Campos principais:

- `tenant_id`
- `invitee_email`
- `role_id`
- `scope_type`
- `scope_id`
- `token_hash`
- `status`
- `expires_at`
- `invited_by_user_id`
- `accepted_by_user_id`
- `revoked_by_user_id`
- `last_sent_at`

Status suportados:

- `pending`
- `accepted`
- `revoked`
- `expired`

Wrappers publicos para Data API:

```text
public.helvok_current_create_membership_invitation(jsonb)
public.helvok_current_rotate_membership_invitation(jsonb)
public.helvok_current_revoke_membership_invitation(uuid)
public.helvok_current_accept_membership_invitation(text)
```

Modelo de seguranca:

- `anon` nao executa os RPCs;
- wrappers publicos sao `SECURITY INVOKER`;
- operacoes privilegiadas ficam em `core` com `SECURITY DEFINER`;
- cada funcao valida `auth.uid()`;
- criar, reenviar e revogar exigem `members.manage`;
- apenas owner pode convidar/reenviar/revogar convite de role `owner`;
- aceite exige token valido, nao expirado e email igual ao usuario autenticado;
- tabela tem RLS forçado e policy explicita de deny para `anon` e `authenticated`;
- token bruto nao e persistido, somente hash SHA-256 base64url.

## Worker

Deploy Cloudflare:

```text
worker: helvokglobaltax
url: https://helvokglobaltax.genialidadefilosofica.workers.dev
version_id: 1b28d15c-1bad-4b10-98dc-8a020ec54c7d
```

Novas rotas autenticadas por Bearer token de usuario:

```text
POST /v1/tenants/:tenantId/invitations
POST /v1/tenants/:tenantId/invitations/:invitationId/resend
POST /v1/tenants/:tenantId/invitations/:invitationId/revoke
POST /v1/invitations/accept
```

Detalhes:

- token bruto e gerado com Web Crypto;
- hash e calculado no Worker antes do RPC;
- `invitation_url` e retornada apenas em create/resend;
- aceite sincroniza o Supabase Auth user no `core.users` antes do RPC.

## Frontend

A area `Usuarios` recebeu:

- formulario para gerar convite por email;
- seletor de role;
- seletor de expiracao: 3, 7, 14 ou 30 dias;
- card com link unico para copiar;
- lista de convites pendentes/aceitos/revogados/expirados;
- botoes de reenviar link e revogar convite;
- deteccao de `/app?invite=TOKEN`;
- botao de aceite no gate de login.

## Validacoes

```text
npm run typecheck -> OK
npm test -> 17 tests passed
Supabase RPC create + accept testado em transacao com rollback -> OK
Supabase security advisor -> somente auth_leaked_password_protection permanece como WARN global
```

Resultado da validacao SQL com rollback:

```text
create_event: invitation.created
create_status: pending
pending_after_create: 1
accept_event: invitation.accepted
membership_status: active
membership_role: viewer
```

## Limite atual

O envio automatico de email ainda nao foi ligado. A plataforma gera o link real e auditado, pronto para ser enviado manualmente agora e para receber uma camada transacional depois.

Proxima etapa natural: Cloudflare Email Service ou provedor transacional para enviar, reenviar e rastrear entregas de convite.
