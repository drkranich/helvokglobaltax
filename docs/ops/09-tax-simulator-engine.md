# Tax Simulator Engine

Entrega operacional do primeiro simulador fiscal da Helvok Tax.

## Objetivo

Transformar o painel de motor tributario em uma simulacao economica realista, cobrindo:

- produto/servico;
- origem e destino;
- incoterm;
- custo unitario;
- embalagem e preparacao;
- despacho de exportacao;
- compliance/documentacao;
- frete e seguro;
- tarifa de importacao;
- excise/imposto especial;
- imposto indireto no destino;
- armazenagem e last mile;
- marketplace, marketing e pagamento;
- margem alvo e preco sugerido.

O simulador nao emite documentos fiscais e ainda nao substitui regras homologadas por pais. Ele entrega uma estimativa versionada para decisao comercial, precificacao e preparacao de emissao.

## Rotas

| Metodo | Rota | Funcao |
| --- | --- | --- |
| `GET` | `/v1/tax/markets` | Lista mercados suportados pelo rule pack seed. |
| `POST` | `/v1/tax/simulate` | Calcula custo total, impostos, fees, margem e documentos. |

## Rule pack

Versao inicial:

```text
global-indirect-tax-seed-2026.07.15
```

O rule pack contem mercados para America, Europa, Asia, Oriente Medio, Oceania e Africa. Cada mercado possui:

- codigo ISO;
- nome;
- regiao;
- moeda;
- imposto indireto principal;
- aliquota padrao seed;
- duty default seed;
- status de e-invoice/compliance;
- status da fonte;
- URL oficial quando ja cadastrada;
- notas e alertas.

## Cadeia de valor

A simulacao retorna `value_chain` com as etapas:

1. Producao e origem.
2. Preparacao no pais de origem.
3. Exportacao e documentos de origem.
4. Transporte internacional.
5. Importacao no destino.
6. Armazenagem e distribuicao.
7. Canal, pagamento e marketing.
8. Preco final estimado ao cliente.

Esse modelo nasceu do caso de uso de exportacao Brasil-Europa, mas foi implementado sem prender o Core a cachaca, bebidas ou Brasil.

## Guardrails

- O Core calcula com conceitos neutros: duty, excise, indirect tax, fees, margin e value chain.
- NCM, ICMS, VAT, GST, Sales Tax, ISS e outros nomes continuam fora do Core semantico.
- Quando o destino exige granularidade local, o simulador devolve `warnings` e `next_required_data`.
- Emissao fiscal continua dependendo de adaptador homologado, fila/workflow, assinatura e regras publicadas.

## Validacao

Testes adicionados:

- lista global de mercados;
- simulacao DDP Brasil -> Reino Unido com produto alcoolico;
- erro estruturado para mercado nao suportado;
- painel contem o novo simulador operacional.

Comandos:

```text
npm.cmd run typecheck
npm.cmd test
```
