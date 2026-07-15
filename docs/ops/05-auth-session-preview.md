# Auth session preview - 2026-07-15

## Objetivo

Adicionar a primeira camada real de autenticacao e sessao da Helvok Tax, mantendo o padrao glassmorphism no frontend e sem expor secrets no navegador.

## Deploy

| Item | Valor |
| --- | --- |
| Worker | `helvokglobaltax` |
| URL | `https://helvokglobaltax.genialidadefilosofica.workers.dev` |
| Versao Cloudflare | `8a8c7fd1-08cc-4cb8-af06-39222037b8ec` |

## Banco

Migrations aplicadas:

```text
20260715011906_add_current_session_rpc
20260715012114_replace_register_user_with_admin_sync
```

Funcoes criadas:

- `public.helvok_current_session()`
- `public.helvok_admin_sync_user(jsonb)`

Permissoes:

```text
helvok_current_session:
  anon: false
  authenticated: true
  service_role: true

helvok_admin_sync_user:
  anon: false
  authenticated: false
  service_role: true
```

`helvok_admin_sync_user` substitui o auto-registro direto por usuario autenticado. O fluxo correto agora e:

1. Frontend autentica no Supabase Auth com chave publica.
2. Worker valida o access token em `/auth/v1/user`.
3. Worker usa service role para sincronizar `auth.users` -> `core.users`.
4. Frontend chama sessao RLS-safe via `/v1/me`.

Security advisor:

```text
lints: []
```

## Worker

Novas rotas:

```text
GET /v1/auth/config
GET /v1/me
POST /v1/session/sync
```

Configuracao publica adicionada ao `wrangler.jsonc`:

```text
SUPABASE_PUBLISHABLE_KEY
```

Secrets preservados:

```text
HELVOK_ADMIN_TOKEN
SUPABASE_SERVICE_ROLE_KEY
```

## Frontend

O painel agora possui:

- overlay de entrada glass;
- abas `Entrar` e `Criar acesso`;
- login/cadastro via Supabase Auth REST;
- armazenamento local de access/refresh token;
- sync de sessao com o Worker;
- chip de sessao no cockpit;
- fallback para ver cockpit sem sessao;
- feed vivo para eventos de auth.

Nenhum service role token e enviado para o navegador.

## Validacoes

```text
npm run typecheck -> OK
npm test -> 10 tests passed
npx wrangler types -> OK
npx wrangler deploy --dry-run -> OK
npx wrangler deploy -> OK
GET /v1/auth/config -> 200
GET /v1/me sem token -> 401 missing_token
POST /v1/session/sync sem token -> 401 missing_token
GET /v1 -> auth/session preview
```

## Proximo passo

Criar o fluxo de convite/membership:

1. Definir email do primeiro owner operacional.
2. Criar endpoint admin para vincular `core.users` ao tenant `helvok-tax-foundation`.
3. Criar tela de usuarios e roles.
4. Mostrar tenants/organizacoes reais no dashboard autenticado.
5. Implementar convites com expiração e trilha de auditoria.
