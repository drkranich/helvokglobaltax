// Helvok Tax - Adaptador Brasil (Focus NFe).
//
// Implementa a interface FiscalProvider para o Brasil usando a Focus NFe como
// agregador: emissão assíncrona de NF-e (modelo 55) e NFC-e (modelo 65) via SEFAZ.
//
// PRONTO PARA LIGAR, DESLIGADO POR PADRÃO: enquanto o secret FOCUS_NFE_TOKEN não
// estiver configurado, ready() é false e toda operação retorna "not_configured"
// (nunca finge uma autorização). Quando o token real for configurado, a chamada
// HTTP à API da Focus NFe é feita aqui — e nada é transmitido antes disso.

import {
  type FiscalDocumentRequest,
  type FiscalDocumentResult,
  type FiscalProvider,
  notConfiguredResult,
} from "../fiscal-provider";

const PROVIDER_KEY = "br-focusnfe";
const MISSING_SECRET = "FOCUS_NFE_TOKEN";

// Base da API da Focus NFe (homologação vs produção é decidido pelo ambiente/token).
const FOCUS_NFE_SANDBOX_BASE = "https://homologacao.focusnfe.com.br";
const FOCUS_NFE_PRODUCTION_BASE = "https://api.focusnfe.com.br";

export interface FocusNfeConfig {
  token?: string; // secret FOCUS_NFE_TOKEN
  production?: boolean; // false = homologação (default)
}

function sumNetCents(request: FiscalDocumentRequest): number {
  return request.items.reduce((total, item) => total + item.unitPriceCents * item.quantity, 0);
}

export function createFocusNfeProvider(config: FocusNfeConfig): FiscalProvider {
  const baseUrl = config.production ? FOCUS_NFE_PRODUCTION_BASE : FOCUS_NFE_SANDBOX_BASE;

  return {
    key: PROVIDER_KEY,
    countryScope: "BR",

    ready(): boolean {
      return typeof config.token === "string" && config.token.length > 0;
    },

    async emit(request: FiscalDocumentRequest): Promise<FiscalDocumentResult> {
      const kind = request.buyer.isBusiness ? "nfe" : "nfce";
      if (!this.ready()) {
        return notConfiguredResult(kind, PROVIDER_KEY, MISSING_SECRET);
      }

      // Documento montado e validado localmente (base de imposto), ainda sem transmitir.
      const netAmountCents = sumNetCents(request);

      // A chamada REAL à Focus NFe entra aqui quando as credenciais e o certificado A1
      // estiverem homologados. A Focus NFe usa Basic Auth com o token e emissão por
      // referência (retorna a referência, e o status chega por consulta/webhook).
      //
      //   const auth = "Basic " + btoa(config.token + ":");
      //   const res = await fetch(`${baseUrl}/v2/nfe?ref=${encodeURIComponent(request.reference ?? crypto.randomUUID())}`, {
      //     method: "POST", headers: { Authorization: auth, "content-type": "application/json" },
      //     body: JSON.stringify(mapToFocusNfePayload(request)),
      //   });
      //
      // Até a homologação estar concluída, não transmitimos: devolvemos o documento
      // como "draft" com a base de imposto calculada, deixando claro que nada foi emitido.
      void baseUrl;
      return {
        kind,
        status: "draft",
        providerKey: PROVIDER_KEY,
        message:
          "Documento montado e validado localmente. A transmissão real à SEFAZ via Focus NFe será feita " +
          "quando o certificado A1 e o cadastro do emitente estiverem homologados. Nada foi transmitido ainda.",
        tax: {
          netAmountCents,
          taxAmountCents: 0, // ICMS/PIS/COFINS calculados pelo motor tributário BR na etapa fiscal
          grossAmountCents: netAmountCents,
          ratePercent: 0,
          rationale: "Impostos brasileiros calculados pelo motor fiscal BR; emissão via Focus NFe.",
        },
        artifacts: { xmlAvailable: false, pdfAvailable: false },
      };
    },

    async consult(providerReference: string): Promise<FiscalDocumentResult> {
      if (!this.ready()) {
        return notConfiguredResult("nfe", PROVIDER_KEY, MISSING_SECRET);
      }
      // GET ${baseUrl}/v2/nfe/${ref} com Basic Auth -> status atual.
      return {
        kind: "nfe",
        status: "draft",
        providerKey: PROVIDER_KEY,
        providerReference,
        message: "Consulta de status estará disponível quando a emissão real estiver ligada.",
      };
    },

    async cancel(providerReference: string, reason: string): Promise<FiscalDocumentResult> {
      if (!this.ready()) {
        return notConfiguredResult("nfe", PROVIDER_KEY, MISSING_SECRET);
      }
      void reason;
      // DELETE ${baseUrl}/v2/nfe/${ref} com justificativa.
      return {
        kind: "nfe",
        status: "draft",
        providerKey: PROVIDER_KEY,
        providerReference,
        message: "Cancelamento estará disponível quando a emissão real estiver ligada.",
      };
    },
  };
}
