import { BRAZIL_STATE_TAX_PROFILES } from "../../../tax/rule-pack";
import { defineAdapterManifest } from "../types";
import type { AdapterManifest, AdapterRequirement } from "../types";

const BRAZIL_JURISDICTIONS = BRAZIL_STATE_TAX_PROFILES.map((profile) => ({
  code: profile.code,
  name: profile.name,
}));

const CERTIFICATE_A1: AdapterRequirement = {
  key: "br_certificate_a1",
  label: "Certificado digital A1 (e-CNPJ) instalado no ambiente de emissão",
  category: "digital_certificate",
  required_for_production: true,
};

const CERTIFICATE_A3: AdapterRequirement = {
  key: "br_certificate_a3",
  label: "Certificado digital A3 (token/cartão) para operação de maior segurança",
  category: "digital_certificate",
  required_for_production: false,
};

const SEFAZ_ENROLLMENT: AdapterRequirement = {
  key: "br_sefaz_enrollment",
  label: "Credenciamento junto à SEFAZ da UF do estabelecimento emissor",
  category: "government_enrollment",
  required_for_production: true,
};

const INSCRICAO_ESTADUAL: AdapterRequirement = {
  key: "br_inscricao_estadual",
  label: "Inscrição estadual ativa e regime tributário definido por estabelecimento",
  category: "legal_registration",
  required_for_production: true,
};

const ACCOUNTANT_REVIEW: AdapterRequirement = {
  key: "br_accountant_review",
  label: "Revisão de CFOP, CST/CSOSN, NCM e CEST por contador/revisor antes da emissão real",
  category: "accountant_review",
  required_for_production: true,
};

const HOMOLOGACAO_NOTE =
  "Escopo Fase 0: fila de emissão (draft -> validação -> assinatura -> transmissão -> autorização/rejeição -> cancelamento/carta de correção) modelada, sem certificado nem credenciamento SEFAZ reais ainda. Nenhum documento é transmitido a um autorizador de verdade por este adaptador.";

function nfe(): AdapterManifest {
  return defineAdapterManifest({
    adapter_key: "adapters/brazil/nfe",
    country_code: "BR",
    region: "brazil",
    authority_level: "state",
    authority_name: "SEFAZ (por UF) / Ambiente Nacional NF-e",
    document_families: ["NFE"],
    tax_families: ["ICMS", "ICMS_ST", "DIFAL", "FCP", "IPI", "PIS_COFINS"],
    supported_jurisdictions: BRAZIL_JURISDICTIONS,
    supported_capabilities: ["manifest", "validateOperation", "classify", "prepareDocument"],
    requirements: [CERTIFICATE_A1, CERTIFICATE_A3, SEFAZ_ENROLLMENT, INSCRICAO_ESTADUAL, ACCOUNTANT_REVIEW],
    sandbox_support: false,
    production_support: false,
    status: "planned",
    official_sources: ["https://www.nfe.fazenda.gov.br/"],
    notes: HOMOLOGACAO_NOTE,
  });
}

function nfce(): AdapterManifest {
  return defineAdapterManifest({
    adapter_key: "adapters/brazil/nfce",
    country_code: "BR",
    region: "brazil",
    authority_level: "state",
    authority_name: "SEFAZ (por UF) / NFC-e",
    document_families: ["NFCE"],
    tax_families: ["ICMS", "ICMS_ST", "PIS_COFINS"],
    supported_jurisdictions: BRAZIL_JURISDICTIONS,
    supported_capabilities: ["manifest", "validateOperation", "classify"],
    requirements: [CERTIFICATE_A1, SEFAZ_ENROLLMENT, INSCRICAO_ESTADUAL, ACCOUNTANT_REVIEW],
    sandbox_support: false,
    production_support: false,
    status: "planned",
    official_sources: ["https://www.nfe.fazenda.gov.br/"],
    notes: HOMOLOGACAO_NOTE,
  });
}

function nfse(): AdapterManifest {
  return defineAdapterManifest({
    adapter_key: "adapters/brazil/nfse",
    country_code: "BR",
    region: "brazil",
    authority_level: "municipal",
    authority_name: "Prefeituras municipais (padrão nacional NFS-e quando aderente)",
    document_families: ["NFSE"],
    tax_families: ["ISS", "PIS_COFINS"],
    supported_jurisdictions: BRAZIL_JURISDICTIONS,
    supported_capabilities: ["manifest", "validateOperation"],
    requirements: [
      CERTIFICATE_A1,
      ACCOUNTANT_REVIEW,
      {
        key: "br_nfse_municipal_provider",
        label: "Cadastro no provedor de NFS-e do município (padrão nacional ou próprio)",
        category: "government_enrollment",
        required_for_production: true,
      },
    ],
    sandbox_support: false,
    production_support: false,
    status: "planned",
    official_sources: ["https://www.gov.br/nfse/"],
    notes:
      "NFS-e depende do município e do código de serviço; não existe autoridade única nacional para todos os municípios ainda. " +
      HOMOLOGACAO_NOTE,
  });
}

function cte(): AdapterManifest {
  return defineAdapterManifest({
    adapter_key: "adapters/brazil/cte",
    country_code: "BR",
    region: "brazil",
    authority_level: "state",
    authority_name: "SEFAZ (por UF) / CT-e",
    document_families: ["CTE"],
    tax_families: ["ICMS"],
    supported_jurisdictions: BRAZIL_JURISDICTIONS,
    supported_capabilities: ["manifest"],
    requirements: [CERTIFICATE_A1, SEFAZ_ENROLLMENT, ACCOUNTANT_REVIEW],
    sandbox_support: false,
    production_support: false,
    status: "planned",
    official_sources: ["https://www.cte.fazenda.gov.br/"],
    notes: HOMOLOGACAO_NOTE,
  });
}

function mdfe(): AdapterManifest {
  return defineAdapterManifest({
    adapter_key: "adapters/brazil/mdfe",
    country_code: "BR",
    region: "brazil",
    authority_level: "state",
    authority_name: "SEFAZ (por UF) / MDF-e",
    document_families: ["MDFE"],
    tax_families: [],
    supported_jurisdictions: BRAZIL_JURISDICTIONS,
    supported_capabilities: ["manifest"],
    requirements: [CERTIFICATE_A1, SEFAZ_ENROLLMENT],
    sandbox_support: false,
    production_support: false,
    status: "planned",
    official_sources: ["https://dfe-portal.svrs.rs.gov.br/mdfe"],
    notes: HOMOLOGACAO_NOTE,
  });
}

function cfeSat(): AdapterManifest {
  return defineAdapterManifest({
    adapter_key: "adapters/brazil/cfe-sat",
    country_code: "BR",
    region: "brazil",
    authority_level: "state",
    authority_name: "SEFAZ (por UF) / SAT-CF-e onde aplicável",
    document_families: ["CFE"],
    tax_families: ["ICMS", "PIS_COFINS"],
    supported_jurisdictions: BRAZIL_JURISDICTIONS,
    supported_capabilities: ["manifest"],
    requirements: [CERTIFICATE_A1, SEFAZ_ENROLLMENT],
    sandbox_support: false,
    production_support: false,
    status: "planned",
    official_sources: [],
    notes:
      "SAT-CF-e foi substituído por NFC-e na maior parte das UFs; manter apenas para tenants legados. " + HOMOLOGACAO_NOTE,
  });
}

export const BRAZIL_ADAPTER_MANIFESTS: AdapterManifest[] = [nfe(), nfce(), nfse(), cte(), mdfe(), cfeSat()];
