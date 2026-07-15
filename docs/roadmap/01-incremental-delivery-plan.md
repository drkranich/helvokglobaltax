# Roadmap incremental

Cada fase deve ser funcional, revisavel e preparada para producao antes da seguinte. O projeto deve evoluir em entregas pequenas, com commits, testes e deploys remotos.

## Fase 0 - Arquitetura

Entregas:

- arquitetura de alto nivel;
- diagramas;
- DDD/modelo de dominio;
- MER/DER;
- estrategia multi-tenant;
- versionamento de regras;
- contrato de plugins/adaptadores;
- seguranca;
- observabilidade;
- testes;
- roadmap.

Gate:

- documentacao revisada;
- boundaries do Core aprovados;
- nenhuma implementation drift;
- decisoes registradas em ADR.

## Fase 1 - Banco e Supabase

Entregas:

- estrutura `supabase/`;
- migrations iniciais;
- schemas;
- tabelas core;
- constraints;
- indices;
- triggers;
- views seguras;
- RLS;
- seeds para sandbox;
- advisors de seguranca/performance.

Gate:

- migrations aplicam em banco limpo;
- RLS validado;
- rollback documentado;
- sem tabelas expostas indevidamente.

## Fase 2 - Auth, RBAC, tenants e organizacoes

Entregas:

- Supabase Auth integrado;
- perfis de usuario;
- memberships;
- roles e permissions;
- tenants;
- environments;
- organizacoes;
- estabelecimentos;
- identidades fiscais;
- certificados como metadados/referencias seguras.

Gate:

- isolamento cross-tenant provado por testes;
- APIs administrativas versionadas;
- audit events para mudancas sensiveis.

## Fase 3 - Produtos, servicos, clientes e pedidos

Entregas:

- catalogo global;
- produtos e servicos variados;
- parties/clientes;
- enderecos e jurisdicoes;
- operacoes comerciais;
- itens;
- idempotencia;
- imports iniciais.

Gate:

- nenhum assumption brasileiro;
- varios tipos de produto/servico testados;
- multi-moeda e multi-pais representados.

## Fase 4 - Motor tributario

Entregas:

- rule engine fiscalmente neutro;
- rule sets;
- rule versions;
- workflow de revisao/publicacao;
- simulacoes;
- calculo com snapshots;
- deteccao de conflitos;
- auditoria de regra.

Gate:

- regra publicada imutavel;
- calculos reproduziveis;
- suite de casos por adaptador mock.

## Fase 5 - Adaptador Brasil inicial

Entregas:

- manifesto do adaptador Brasil;
- primeira familia documental em homologacao;
- adaptador inicial para provedor fiscal externo;
- NF-e de venda de mercadoria como primeiro fluxo de MVP;
- validacoes brasileiras dentro do adaptador;
- transmissao por workflow;
- assinatura/certificado quando aplicavel;
- XML/PDF/recibo/evidencias em R2;
- rejeicoes estruturadas.

Gate:

- emissao nunca pelo frontend;
- homologacao remota validada;
- nenhum detalhe brasileiro no Core;
- provedor fiscal substituivel sem reescrever Core.

## Fase 6 - Paineis

Entregas:

- dashboard;
- central de emissao;
- painel de rejeicoes;
- empresas;
- produtos;
- servicos;
- clientes;
- pedidos;
- motor tributario;
- regras;
- documentos;
- obrigacoes;
- integracoes;
- auditoria;
- logs;
- configuracoes;
- SDK/API.

Gate:

- permissoes por tela;
- estados vazios e erros claros;
- logs/traces acessiveis para suporte;
- bloqueios fiscais de seguranca visiveis antes de emissao/expedicao.

## Fase 7 - SDK, webhooks e API publica

Entregas:

- OpenAPI;
- SDK TypeScript/Node;
- webhook verifier;
- CLI inicial;
- rate limits;
- docs de API;
- exemplos remotos.

Gate:

- backwards compatibility;
- versionamento de payload;
- webhooks assinados e retentados.

## Fase 8 - Integracoes

Entregas:

- conectores base;
- Shopify;
- WooCommerce;
- Magento;
- Nuvemshop;
- Mercado Livre;
- Amazon;
- Shopee;
- Stripe;
- PayPal;
- Mercado Pago;
- ERP/CRM/CMS genericos.

Gate:

- credenciais seguras;
- sync auditavel;
- webhooks e retries;
- idempotencia externa.

## Fase 9 - Adaptadores internacionais

Entregas por onda:

1. Portugal.
2. Alemanha.
3. França.
4. Espanha.
5. Itália.
6. Holanda.
7. Estados Unidos.
8. Canada.
9. Japão.
10. Singapura.

Gate:

- cada pais como plugin;
- contrato comum aprovado;
- regras locais versionadas;
- testes de homologacao quando existir.

## Fase 10 - Marketplace de plugins

Entregas:

- registry de plugins;
- instalacao por tenant;
- capabilities por ambiente;
- compatibilidade por contract version;
- billing/plan por adaptador;
- deprecacao;
- changelog;
- validacao automatica de plugins.

Gate:

- novo pais sem alterar Core;
- rollback de versao de adaptador;
- auditoria completa de instalacao.

## Regra operacional de deploy

O dominio provisorio informado e `helvokglobaltax.genialidadefilosofica.workers.dev`. As fases implementaveis devem preferir deploy e validacao remota na Cloudflare, com smoke tests contra a plataforma, em vez de fluxo baseado em porta local.
