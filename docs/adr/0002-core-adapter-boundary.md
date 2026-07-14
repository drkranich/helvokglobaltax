# ADR 0002 - Core desacoplado de legislacao

## Status

Aceita inicialmente.

## Contexto

A plataforma precisa atender varios paises. O Brasil sera o primeiro adaptador, mas nao pode contaminar o Core com conceitos locais como ICMS, ISS, NCM, CFOP, VAT, GST ou Sales Tax.

## Decisao

O Core sera fiscalmente neutro. Ele controla tenants, auth, permissoes, operacoes, documentos abstratos, regras versionadas, eventos, workflows, storage e auditoria. Adaptadores por pais interpretam legislacao, formatos, tributos, autoridades, assinaturas, rejeicoes e obrigacoes.

## Consequencias

- Novos paises entram como plugins/adaptadores.
- Regras locais ficam em dados versionados e modulos de adaptador.
- O Core pode evoluir sem redeploy obrigatorio de todos os paises.
- O modelo de banco precisa separar entidades globais e schemas de adaptadores.
