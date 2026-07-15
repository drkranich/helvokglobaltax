# Glass admin preview - 2026-07-15

## Objetivo

Publicar o primeiro frontend visivel da Helvok Tax direto no Cloudflare Worker, sem depender de servidor local.

Esta entrega e um painel operacional inicial. Ela nao substitui a futura aplicacao Next.js completa, mas fixa a direcao visual e cria uma experiencia publica para acompanhar a fundacao da plataforma enquanto a Fase 2 avanca.

## Deploy

| Item | Valor |
| --- | --- |
| Worker | `helvokglobaltax` |
| URL | `https://helvokglobaltax.genialidadefilosofica.workers.dev` |
| Versao Cloudflare | `3565b240-0be7-4417-95ab-433cb39777fa` |
| Rota principal | `/` |
| Rota alternativa | `/app` |

## Direcao visual

Padrao definido para as proximas telas:

- Glassmorphism como linguagem principal.
- Nada com aparencia de blog, pagina estatica ou painel antigo.
- Fundo vivo com grid, varredura e transparencia.
- Tons principais: Petróleo, Meia-noite, Dourado e Champagne.
- Scrollbar transparente/glass.
- Dropdowns, inputs, botoes e formularios no mesmo estilo glass.
- Layout de cockpit operacional, nao landing page.
- Movimento constante com polling, relogio, feed e medidores animados.

## Conteudo publicado

O painel inicial mostra:

- status do Cloudflare Worker;
- status publico da API v1;
- bootstrap real do tenant `helvok-tax-foundation`;
- organizacao `Helvok Tax`;
- estabelecimento `Helvok Tax Brasil`;
- cards de auditoria e outbox;
- mapa visual de adaptadores por jurisdicao;
- simulador visual do futuro motor tributario;
- feed vivo de eventos operacionais;
- previews de documentos, integracoes e SDK.

## Rotas preservadas

As rotas de API continuam ativas:

```text
GET /health
GET /v1
GET /v1/status
GET /v1/meta
GET /v1/admin/*
```

As rotas admin continuam protegidas por `HELVOK_ADMIN_TOKEN`; nenhum secret e enviado ao frontend.

## Validacoes

```text
npm run typecheck -> OK
npm test -> 7 tests passed
npx wrangler deploy --dry-run -> OK
npx wrangler deploy -> OK
GET / -> HTML Helvok Tax publicado
GET /health -> OK
GET /v1 -> foundation-ready
```

## Proximo passo

Construir a proxima camada visual com autenticacao real:

1. Tela de entrada com Supabase Auth.
2. Shell autenticado para usuario real.
3. Listagem de tenants/organizacoes via API segura.
4. Tela de usuarios, roles e memberships.
5. Extracao gradual para Next.js App Router quando a superficie de produto exigir rotas e estado de cliente mais ricos.
