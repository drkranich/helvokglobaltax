# ADR 0001 - Limites da Fase 0

## Status

Aceita inicialmente.

## Contexto

O projeto comeca do zero e o roadmap exige que nao haja backend antes de arquitetura, diagramas, dominio, modelo relacional, estrategia de tenants, regras, plugins, seguranca, observabilidade, testes e roadmap detalhado.

## Decisao

A Fase 0 entrega somente documentacao versionada e decisoes arquiteturais. Nao cria:

- backend;
- frontend;
- migrations;
- tabelas;
- seeds;
- SDK;
- adaptadores executaveis;
- infraestrutura runtime.

## Consequencias

- A primeira entrega e revisavel antes de gerar codigo.
- A implementacao futura tera gates claros.
- Mudancas de arquitetura devem ser registradas antes de migrations ou APIs.
