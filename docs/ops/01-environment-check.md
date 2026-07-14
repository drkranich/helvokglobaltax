# Environment check - 2026-07-14

## Objetivo

Confirmar se o workspace local, GitHub, Wrangler/Cloudflare e Supabase estao apontando para os recursos corretos antes de iniciar Fase 1.

## Resultado executivo

| Area | Status | Resultado |
| --- | --- | --- |
| GitHub | OK | `origin` aponta para `https://github.com/drkranich/helvokglobaltax.git`. |
| Branch | OK | `main` rastreia `origin/main`. |
| Repo local | OK | Workspace limpo antes desta checagem; ainda sem backend, frontend, Supabase config ou Wrangler config. |
| Wrangler CLI | OK | `wrangler` disponivel via `npx`, versao `4.110.0`. |
| Cloudflare auth | Parcial | Logado via OAuth na conta `CARE KRANICH`, account id `8a1a83bef8564b885a10bfb22314555a`. |
| Cloudflare Worker | Bloqueado | Wrangler nao encontrou Worker `helvokglobaltax` nessa conta. |
| Cloudflare Pages | Bloqueado | Wrangler nao encontrou Pages project `helvokglobaltax` nessa conta. |
| Workers.dev dominio | Parcial | `https://helvokglobaltax.genialidadefilosofica.workers.dev` responde `200 OK` com `Hello world`. |
| Supabase URL | OK | `https://jlvwudjgfzhhdgttrycj.supabase.co` corresponde ao projeto `jlvwudjgfzhhdgttrycj`. |
| Supabase project | OK | Projeto `HELVOK GLOBAL TAX`, region `us-west-2`, status `ACTIVE_HEALTHY`, Postgres `17.6.1.141`. |
| Supabase CLI | Parcial | CLI versao `2.104.0`, mas nao esta logado via access token local. |
| Supabase app connector | OK | Conector Supabase do Codex lista e acessa o projeto correto. |
| Supabase Edge Functions | OK | Nenhuma Edge Function existente, coerente com projeto do zero. |
| Supabase advisors | Atencao | Performance limpo; security encontrou uma funcao `public.rls_auto_enable()` com `SECURITY DEFINER` executavel por `anon` e `authenticated`. |

## GitHub

Comando validado:

```text
git remote -v
```

Resultado:

```text
origin  https://github.com/drkranich/helvokglobaltax.git
```

## Local workspace

Ainda nao existem:

- `package.json`
- `wrangler.jsonc`
- `supabase/config.toml`
- `.env`
- `.mcp.json`
- backend
- frontend
- migrations

Isso e esperado ate agora, pois a Fase 0 foi documental.

## Cloudflare / Wrangler

### CLI

Wrangler validado:

```text
4.110.0
```

### Conta autenticada

Wrangler esta logado em:

```text
Account Name: CARE KRANICH
Account ID: 8a1a83bef8564b885a10bfb22314555a
Email: carekranich@gmail.com
```

Permissoes incluem Workers, Pages, KV, Queues, R2, D1, Workflows e Secrets Store.

### Problema encontrado

O dominio:

```text
https://helvokglobaltax.genialidadefilosofica.workers.dev
```

responde publicamente:

```text
HTTP 200
Body: Hello world
```

Mas o Wrangler autenticado na conta `CARE KRANICH` retornou:

```text
Worker helvokglobaltax: This Worker does not exist on your account.
Pages project helvokglobaltax: Project not found.
```

### Interpretacao

O dominio existe e esta ativo, mas nao esta acessivel pelo Wrangler na conta atual. As causas provaveis sao:

1. O Worker/Pages foi criado em outra conta Cloudflare.
2. O Wrangler esta autenticado no perfil/conta errada.
3. O projeto Pages possui nome diferente de `helvokglobaltax`.
4. O Worker existe sob outro account id que usa o subdominio `genialidadefilosofica`.

### Acao necessaria

Antes de criar `wrangler.jsonc`, deploy, R2, KV, Queues ou Workflows:

1. Confirmar qual conta Cloudflare possui o subdominio `genialidadefilosofica.workers.dev`.
2. Fazer `wrangler login` nessa conta ou selecionar o profile correto.
3. Confirmar o nome real do Worker e do Pages project.
4. Se o recurso ainda nao existir na conta correta, criar/associar os projetos com nomes finais.

## Supabase

### Projeto confirmado

Conector Supabase confirmou:

```text
Project ref: jlvwudjgfzhhdgttrycj
Name: HELVOK GLOBAL TAX
Region: us-west-2
Status: ACTIVE_HEALTHY
Database host: db.jlvwudjgfzhhdgttrycj.supabase.co
Postgres: 17.6.1.141
```

Endpoint `auth/v1/health` respondeu `401 Unauthorized` por falta de API key, mas com header:

```text
sb-project-ref: jlvwudjgfzhhdgttrycj
```

Isso confirma que a URL informada aponta para o projeto correto.

### CLI

Supabase CLI validado:

```text
2.104.0
```

Mas `supabase projects list` retornou:

```text
Access token not provided.
```

### Acao necessaria

O Codex consegue acessar o projeto pelo conector Supabase, mas o CLI local ainda precisa de login/token para comandos de projeto:

```text
npx supabase login
```

ou variavel:

```text
SUPABASE_ACCESS_TOKEN
```

Nao registrar tokens no repo.

## Advisors Supabase

### Performance

Sem lints.

### Security

Foram encontrados dois avisos relacionados a mesma funcao:

```text
public.rls_auto_enable()
```

Problema:

- `anon` pode executar uma funcao `SECURITY DEFINER`;
- `authenticated` pode executar uma funcao `SECURITY DEFINER`.

Remediacao oficial:

- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

### Acao recomendada antes da Fase 1

Verificar se `public.rls_auto_enable()` foi criada manualmente. Se nao for uma API publica intencional, revogar `EXECUTE` de `anon`, `authenticated` e possivelmente `PUBLIC`, ou mover a funcao para schema privado com permissoes explicitas.

## Decisao de sequencia

Nao iniciar migrations nem deploys ate resolver:

1. Cloudflare: Wrangler deve apontar para a conta que possui `helvokglobaltax.genialidadefilosofica.workers.dev`.
2. Supabase CLI: login/token local se formos usar CLI para link, migrations e advisors.
3. Supabase security advisor: resolver ou justificar `public.rls_auto_enable()`.

Depois desses pontos, iniciar Fase 1:

1. criar estrutura `supabase/`;
2. linkar projeto `jlvwudjgfzhhdgttrycj`;
3. criar migrations iniciais;
4. aplicar RLS e advisors;
5. criar scaffold Cloudflare somente na conta correta.
