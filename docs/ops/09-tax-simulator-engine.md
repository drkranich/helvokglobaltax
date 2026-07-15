# Tax Simulator Engine

Entrega operacional do primeiro simulador fiscal da Helvok Tax.

## Objetivo

Transformar o painel de motor tributário em uma simulação econômica realista, cobrindo:

- produto/serviço;
- origem e destino;
- incoterm;
- custo unitário;
- embalagem e preparação;
- despacho de exportacao;
- compliance/documentacao;
- frete e seguro;
- tarifa de importação;
- excise/imposto especial;
- imposto indireto no destino;
- armazenagem e last mile;
- marketplace, marketing e pagamento;
- margem alvo e preço sugerido.

O simulador não emite documentos fiscais e ainda não substitui regras homologadas por país. Ele entrega uma estimativa versionada para decisão comercial, precificação e preparação de emissão.

## Rotas

| Metodo | Rota | Funcao |
| --- | --- | --- |
| `GET` | `/v1/tax/markets` | Lista mercados suportados pelo pacote de regras seed. |
| `POST` | `/v1/tax/simulate` | Calcula custo total, impostos, fees, margem e documentos. |
| `POST` | `/v1/tax/compare` | Compara a mesma operação em vários destinos. |

## Rule pack

Versao inicial:

```text
global-indirect-tax-seed-2026.07.15
```

O pacote de regras contém mercados para América, Europa, Ásia, Oriente Médio, Oceania e África. Cada mercado possui:

- código ISO;
- nome;
- regiao;
- moeda;
- imposto indireto principal;
- alíquota padrão seed;
- duty default seed;
- status de e-invoice/compliance;
- status da fonte;
- URL oficial quando ja cadastrada;
- notas e alertas.

## Cadeia de valor

A simulação retorna `value_chain` com as etapas:

1. Produção e origem.
2. Preparação no país de origem.
3. Exportação e documentos de origem.
4. Transporte internacional.
5. Importação no destino.
6. Armazenagem e distribuição.
7. Canal, pagamento e marketing.
8. Preço final estimado ao cliente.

Esse modelo nasceu do caso de uso de exportacao Brasil-Europa, mas foi implementado sem prender o Core a cachaca, bebidas ou Brasil.

## Comparação de mercados

O comparador executa a mesma simulação para uma lista de destinos e retorna:

- total estimado ao cliente;
- indice de custo;
- imposto indireto do destino;
- duty;
- excise;
- margem estimada;
- preço unitário sugerido;
- carga operacional;
- alertas principais;
- dados obrigatorios pendentes.

O ranking principal usa `cost_index = customer_total / commercial_subtotal`. Isso evita comparar moedas diferentes como se fossem equivalentes. Valores monetarios continuam sendo exibidos na moeda nativa do mercado ate que uma camada de FX oficial seja adicionada.

## Guardrails

- O Core calcula com conceitos neutros: duty, excise, indirect tax, fees, margin e value chain.
- NCM, ICMS, VAT, GST, Sales Tax, ISS e outros nomes continuam fora do Core semantico.
- Quando o destino exige granularidade local, o simulador devolve `warnings` e `next_required_data`.
- Emissao fiscal continua dependendo de adaptador homologado, fila/workflow, assinatura e regras publicadas.

## Validacao

Testes adicionados:

- lista global de mercados;
- simulação DDP Brasil -> Reino Unido com produto alcoólico;
- comparação da mesma exportacao em múltiplos mercados;
- erro estruturado para mercado não suportado;
- painel contem o novo simulador operacional.

Comandos:

```text
npm.cmd run typecheck
npm.cmd test
```
