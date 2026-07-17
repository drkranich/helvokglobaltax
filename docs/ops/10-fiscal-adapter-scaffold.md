# Scaffold de adaptadores fiscais por país e paineis de compliance

## Objetivo

Implementar a Fase 1 do contrato descrito em
[docs/architecture/06-country-plugin-strategy.md](../architecture/06-country-plugin-strategy.md):
um registro real de adaptadores por país/jurisdição, com o mesmo contrato de
capacidades (`manifest`, `validateOperation`, `classify`, `calculateTax`,
`prepareDocument`, `signDocument`, `transmitDocument`, `cancelDocument`,
`getDocumentStatus`, `generateArtifacts`, `generateObligation`,
`explainRejection`), sem fingir emissão em nenhuma jurisdição onde ainda não
existe conector governamental real.

## O que foi implementado

- `src/fiscal/adapters/types.ts`: contrato `FiscalAdapter`, `AdapterManifest`
  e `FiscalAdapterNotConnectedError`. Toda capacidade operacional retorna
  `Promise<never>`: um adaptador stub não pode "ter sucesso", só pode lançar
  um erro nomeando exatamente o que falta (certificado, credenciamento,
  credencial de software).
- `src/fiscal/adapters/stub-adapter.ts`: implementação genérica usada por
  todo adaptador até que um conector governamental real seja conectado.
- `src/fiscal/adapters/manifests/*`: 40 adaptadores cobrindo:
  - **Brasil** (6): NF-e, NFC-e, NFS-e, CT-e, MDF-e, SAT/CF-e legado, com os
    27 estados como jurisdição (reaproveitando `BRAZIL_STATE_TAX_PROFILES` de
    `src/tax/rule-pack.ts`).
  - **EUA** (1): sales tax com os 10 estados prioritários (FL, TX, CA, NY,
    DE, NV, WY, IL, PA, NJ), nexus, marketplace facilitator e reseller
    certificate como requisitos.
  - **Canadá** (1): GST/HST/PST/QST com as 10 províncias prioritárias.
  - **Europa** (14): PT, ES, FR, DE, IT, NL, BE, IE, CH, GB, PL, SE, GR, RO —
    cada país como módulo próprio, conforme o princípio "Europa não é um
    adaptador único".
  - **América Latina** (8): México (CFDI), Chile (DTE), Argentina (Factura
    Electrónica), Colômbia (DIAN), Peru (comprobante electrónico), Uruguai
    (CFE), Paraguai (SIFEN), Equador (comprobante electrónico).
  - **Ásia-Pacífico** (7): Japão (JCT), Singapura (GST/InvoiceNow), Índia
    (GST e-invoice), China (fapiao), Coreia do Sul (VAT/e-tax invoice),
    Austrália (GST), Nova Zelândia (GST).
  - **Oriente Médio** (3): Emirados Árabes (VAT), Arábia Saudita (ZATCA),
    Qatar (VAT ainda não confirmado em produção geral).
- `src/fiscal/adapters/registry.ts`: agrega os 40 manifests e expõe
  `listAdapterManifests`, `getAdapterManifest`, `getAdapter` e
  `summarizeAdapterCoverage`.
- `src/fiscal/routes.ts`: `GET /v1/fiscal/adapters`,
  `GET /v1/fiscal/adapters/coverage` e `GET /v1/fiscal/adapters/:adapterKey`
  (aceita chaves com barra, ex. `adapters/brazil/nfe`).
- Migration `20260717010000_expand_fiscal_authorities_and_rejections.sql`:
  expande `core.fiscal_authorities` para cobrir os mesmos 40
  país/jurisdição (todos com `status = 'planned'`), e adiciona
  `core.list_fiscal_document_rejections_as_admin` /
  `..._as_current_user` mais os wrappers
  `helvok_admin_list_fiscal_rejections` /
  `helvok_current_list_fiscal_rejections` para o painel de rejeições.
- Endpoints novos: `GET /v1/admin/tenants/:tenantId/fiscal/rejections` e
  `GET /v1/tenants/:tenantId/fiscal/rejections`.
- Painéis no dashboard (`GET /` e `GET /app`): "Homologação por país"
  (lista todos os 40 adaptadores agrupados por região, com status) e
  "Painel de rejeições" (documentos fiscais rejeitados/com falha, com o
  último evento de lifecycle).

## O que continua fora do escopo desta fase (de propósito)

Nenhum destes itens foi implementado, e não devem ser fingidos por nenhum
adaptador futuro sem o requisito real por trás:

- Certificado digital A1/A3 (Brasil), eIDAS (Europa), CSD/CAF (América
  Latina) ou qualquer assinatura real de documento.
- Credenciamento real junto a SEFAZ, SAT, ZATCA, DIAN, SUNAT, GSTN, ou
  qualquer outra autoridade.
- Cliente SOAP/REST real de transmissão a autorizador (NF-e, CFDI, ZATCA
  etc.) e o tratamento de retorno de autorização/rejeição.
- Tabelas de CFOP, CST/CSOSN, NCM, CEST e regras de ICMS ST/DIFAL/FCP por
  produto e estado (o simulador fiscal já sinaliza isso como
  `manual-required` em `src/tax/rule-pack.ts`).
- Ambiente de homologação real (sandbox) de qualquer autoridade.

## Caminho recomendado a partir daqui

1. Escolher **um** documento fiscal brasileiro (NF-e ou NFS-e) e um
   município/UF piloto para sair de `planned` para `sandbox`: isso exige
   certificado A1 real, inscrição estadual/regime tributário reais e
   credenciamento na SEFAZ de homologação.
2. Só depois de o piloto brasileiro emitir em homologação real, priorizar o
   próximo adaptador (sugestão: EUA sales tax ou Portugal e-invoicing, que já
   têm o maior detalhamento de requisitos no registro).
3. Manter todo adaptador em `planned`/`sandbox` até existir certificado,
   credenciamento e revisão contábil real — nunca marcar `production_support`
   como `true` sem uma transmissão real bem-sucedida.
