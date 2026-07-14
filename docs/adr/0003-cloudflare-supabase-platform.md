# ADR 0003 - Plataforma Cloudflare e Supabase

## Status

Aceita inicialmente.

## Contexto

O ambiente alvo informado usa Supabase PostgreSQL/Auth e Cloudflare Workers/Pages. O dominio provisório de validacao e `helvokglobaltax.genialidadefilosofica.workers.dev`. O fluxo desejado evita testes centrados em localhost.

## Decisao

A plataforma sera desenhada para:

- Cloudflare Workers + Hono nas APIs;
- Cloudflare Queues para processamento assincrono;
- Cloudflare Workflows para processos longos;
- Cloudflare R2 para documentos e evidencias;
- Cloudflare KV para cache/configuracoes leves;
- Supabase PostgreSQL para dados relacionais;
- Supabase Auth para autenticacao;
- Supabase Realtime quando houver necessidade de atualizacao em painel.

## Consequencias

- Validacoes de integracao devem rodar em ambientes remotos controlados.
- Service role e segredos ficam somente em runtime server-side.
- RLS e RBAC sao parte central do desenho.
- Workflows fiscais nao dependem de sessao HTTP nem de frontend.
