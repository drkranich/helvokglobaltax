# Supabase Phase 1 foundation - 2026-07-14

## Objetivo

Registrar a primeira entrega funcional de banco da Helvok Tax no Supabase remoto `jlvwudjgfzhhdgttrycj`.

Esta entrega cria a fundacao multi-tenant antes de qualquer regra fiscal, produto, documento fiscal ou adaptador de pais.

## Projeto remoto

| Item | Valor |
| --- | --- |
| Project ref | `jlvwudjgfzhhdgttrycj` |
| Project name | `HELVOK GLOBAL TAX` |
| Postgres | `17.6` |
| Execucao | Conector Supabase do Codex |
| CLI local | `2.104.0`, ainda sem access token local |

## Migrations aplicadas

| Versao remota | Arquivo local | Conteudo |
| --- | --- | --- |
| `20260714234954` | `supabase/migrations/20260714234954_20260714233942_initial_core_foundation.sql` | Schemas `core` e `audit`, tabelas base, constraints, RLS, RBAC seed, views publicas seguras, triggers e correcao de `public.rls_auto_enable()`. |
| `20260714235221` | `supabase/migrations/20260714235221_add_core_fk_composite_indexes.sql` | Indices compostos para FKs tenant-scoped. |
| `20260714235335` | `supabase/migrations/20260714235335_add_outbox_explicit_deny_policy.sql` | Policy explicita de negacao para `audit.outbox_events`. |

## Schemas criados

| Schema | Uso |
| --- | --- |
| `core` | Tenants, environments, users, roles, permissions, memberships, organizations, relationships, establishments, fiscal identities and certificate metadata. |
| `audit` | Audit events append-only and reliable outbox events. |

## Tabelas criadas

### `core`

- `core.tenants`
- `core.tenant_environments`
- `core.users`
- `core.roles`
- `core.permissions`
- `core.role_permissions`
- `core.memberships`
- `core.organizations`
- `core.organization_relationships`
- `core.establishments`
- `core.fiscal_identities`
- `core.certificates`

### `audit`

- `audit.audit_events`
- `audit.outbox_events`

## Views publicas

As views publicas foram criadas com `security_invoker = true`:

- `public.current_user_tenants`
- `public.current_user_permissions`

`anon` nao recebeu acesso a essas views.

## RLS

Todas as 14 tabelas criadas possuem:

- RLS habilitado;
- `force row level security`;
- policy tenant-aware quando a tabela pode ser lida por usuario autenticado;
- policy explicita de negacao em `audit.outbox_events`, pois outbox e gerenciado pelo servico.

Resultado validado:

```text
rls_forced_tables: 14
total_tables: 14
total_policies: 14
```

Smoke test de isolamento:

```text
authenticated sem JWT -> core.tenants visiveis: 0
```

## RBAC seed

Roles de sistema:

- `owner`
- `admin`
- `fiscal_manager`
- `accountant`
- `developer`
- `support`
- `auditor`
- `viewer`

Permissoes criadas:

```text
permission_count: 18
role_permission_count: 65
```

## Segurança

A migration revogou acesso publico da funcao `public.rls_auto_enable()`:

```text
anon_can_execute: false
authenticated_can_execute: false
```

Security advisor depois das migrations:

```text
lints: []
```

Referencias:

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/database-linter
- https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically

## Performance

A varredura de FKs sem indice retornou vazia apos a segunda migration.

Performance advisor retornou apenas lints `unused_index`.

Interpretacao:

- esperado em banco recem-criado, sem trafego e sem consultas reais;
- nao remover indices agora, pois eles foram criados para FKs, filtros tenant/status, snapshots JSONB e operacoes futuras ja previstas no DER;
- revisitar apos dados e workloads reais.

Remediacao de referencia:

- https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index

## Decisoes

1. Schemas `core` e `audit` ficam privados por padrao.
2. `public` recebe apenas views explicitamente seguras.
3. Outbox nao e acessado diretamente por clientes; Workers com `service_role` serao a fronteira de execucao.
4. Certificados nao armazenam bytes ou segredos em texto no banco; apenas metadados e `storage_ref`.
5. Identidades fiscais guardam valor criptografado e/ou hash, nunca valor claro.
6. Regras fiscais, documentos, catalogo e operacoes comerciais ficam para migrations posteriores.

## Pendencias

1. Configurar login/token local do Supabase CLI se quisermos `db push`, `db pull`, `migration list` remoto e `db advisors` via terminal.
2. Criar seed de tenant sandbox somente quando definirmos usuario owner inicial no Supabase Auth.
3. Na Fase 2, implementar APIs administrativas no Worker para criar tenant, environment, organization, memberships e audit events com service role em segredo.
