# Visao de produto e MVP

## Produto

Helvok Tax e uma plataforma fiscal multiempresa, multissetorial e independente. Ela deve funcionar como Fiscal-as-a-Service por API para e-commerces, marketplaces, ERPs, CMSs, CRMs, SaaS e negocios de produtos ou servicos.

Helvok Tax nao deve ser vinculada a cachacas, bebidas, uma marca especifica ou uma empresa interna. Empresas como Maison Kranich, Flora e Seravie podem ser clientes/casos de uso, mas a plataforma precisa nascer reutilizavel.

## Tese central

Sistemas externos enviam dados factuais de uma operacao comercial para uma API unica. A plataforma devolve:

- enquadramento fiscal;
- tributos calculados;
- bases de calculo;
- retencoes;
- documentos fiscais;
- XML, PDF, DANFE ou representacao equivalente;
- guias e obrigacoes relacionadas;
- registros contabeis;
- trilha de auditoria;
- eventos e webhooks.

No Brasil, isso inclui futuramente CFOP, CST/CSOSN, ICMS, ICMS-ST, DIFAL, FCP, IPI, ISS, IBS, CBS e PIS/Cofins durante a transicao. Internacionalmente, cada pais troca seus nomes, campos, documentos e canais oficiais por meio de plugin/adaptador.

Helvok Tax nao deve prometer tributacao correta apenas por estar conectado a governos ou provedores. A promessa central e combinar fontes oficiais monitoradas, regras versionadas, calculos rastreaveis e homologacao profissional para mudancas criticas.

## Experiencia esperada

O usuario escolhe empresa, pais e operacao. O painel mostra apenas os campos e documentos relevantes para aquele contexto.

Exemplos:

- Brasil: CPF, CNPJ, IE, IM, NF-e, NFC-e, NFS-e, SEFAZ, prefeitura, XML e DANFE.
- Portugal: NIF, NIPC, VAT Number, fatura e Autoridade Tributaria.
- Alemanha: VAT ID, Steuernummer, Rechnung e XRechnung quando aplicavel.
- Franca: TVA, SIREN, SIRET e facture.

O usuario nao deve ver campos fiscais desnecessarios para o pais, documento ou operacao.

## Principios obrigatorios refinados

1. Multi-tenant desde o primeiro schema.
2. Cada tenant representa empresa, grupo economico ou plataforma cliente.
3. Cada tenant pode possuir varios CNPJs, VAT IDs, estabelecimentos e paises.
4. Regras tributarias ficam separadas do codigo comercial.
5. Nenhuma aliquota ou regra fiscal fixa no frontend.
6. Todas as regras sao versionadas por vigencia.
7. Cada calculo registra a versao da regra utilizada.
8. Provedores fiscais externos devem ser substituiveis.
9. IA generativa nao inventa tributacao.
10. Regras novas passam por homologacao antes da producao.
11. Certificados digitais e segredos permanecem criptografados.
12. Operacoes fiscais possuem auditoria imutavel.
13. A transicao IBS/CBS precisa ser suportada.
14. O emissor fiscal pode ser substituido sem reconstruir o sistema.
15. A plataforma opera como Fiscal-as-a-Service por API.
16. Fontes oficiais, provedores e IA sao evidencias ou apoio, nao regras publicadas automaticamente.
17. Cada obrigacao deve declarar nivel de automacao: integral, assistida ou orientacao operacional.

## Modulos de produto

### Organizacoes e estabelecimentos

- tenants;
- grupos economicos;
- empresas;
- CNPJs e outros IDs fiscais;
- inscricoes estaduais;
- inscricoes municipais;
- CNAEs;
- regimes tributarios;
- enderecos;
- responsaveis;
- contadores;
- ambientes de homologacao e producao;
- series e numeracao de documentos.

### Certificados e credenciais

- certificados A1 no MVP;
- A3 futuramente;
- validade;
- alertas;
- criptografia;
- rotacao;
- controle de acesso;
- historico de uso;
- credenciais de provedores;
- credenciais municipais/estaduais quando aplicavel.

Certificados nunca devem ser expostos ao navegador.

### Cadastro fiscal de produtos

Campos brasileiros esperados no adaptador Brasil:

- SKU;
- descricao;
- tipo de produto;
- NCM;
- CEST;
- GTIN;
- origem;
- unidade comercial;
- unidade tributavel;
- peso;
- composicao;
- fabricante;
- enquadramento de IPI;
- regras de ICMS;
- substituicao tributaria;
- monofasico;
- beneficio fiscal;
- rastreabilidade;
- lote;
- validade;
- registro regulatorio quando aplicavel.

No Core, esses campos devem ser tratados como classificacoes fiscais/adaptador, nao como regra global fixa.

### Cadastro fiscal de servicos

Campos brasileiros esperados no adaptador Brasil:

- codigo interno;
- item da lista de servicos;
- codigo municipal;
- CNAE relacionado;
- municipio de incidencia;
- ISS;
- retencoes;
- natureza da operacao;
- local da prestacao;
- tomador;
- prestador;
- IBS;
- CBS.

### Produtos compostos

Suportar:

- kits;
- combos;
- cestas;
- assinaturas;
- brindes;
- bonificacoes;
- mercadoria com servico;
- produtos com tratamentos fiscais diferentes.

Cada item deve manter sua propria classificacao fiscal quando necessario.

### Simulador fiscal

Antes de emitir, o usuario deve simular:

- tributos;
- margem;
- preco final;
- destino;
- tipo de cliente;
- canal;
- frete;
- desconto;
- devolucao;
- revenda;
- consumidor final.

Simulacao nao consome numeracao fiscal.

### Documentos fiscais

A arquitetura deve preparar:

- NF-e;
- NFC-e;
- NFS-e;
- nota de entrada;
- devolucao;
- transferencia;
- remessa;
- retorno;
- complemento;
- ajuste;
- cancelamento;
- carta de correcao;
- inutilizacao;
- contingencia.

Contrato conceitual de provedor:

```ts
interface FiscalDocumentProvider {
  issue(input: FiscalDocumentInput): Promise<FiscalDocumentResult>;
  cancel(input: CancelInput): Promise<CancelResult>;
  correct(input: CorrectionInput): Promise<CorrectionResult>;
  query(input: QueryInput): Promise<DocumentStatus>;
}
```

O Core nao pode acoplar a aplicacao a um unico provedor.

### Central de guias e obrigacoes

- impostos por periodo;
- impostos por estado;
- impostos por municipio;
- guias;
- vencimentos;
- comprovantes;
- GNRE;
- DARE e equivalentes;
- retencoes;
- parcelamentos;
- alertas;
- exportacao para contabilidade;
- conciliacao entre guia e documento.

### Painel operacional

Menu esperado:

- Visao geral;
- Operacoes;
- Documentos fiscais;
- Simulador;
- Produtos e servicos;
- Regras fiscais;
- Guias e vencimentos;
- Empresas;
- Estabelecimentos;
- Certificados;
- Integracoes;
- Contabilidade;
- Auditoria;
- Alertas;
- Configuracoes.

### Central de emissao

Para cada venda, exibir:

- empresa emissora;
- estabelecimento;
- canal;
- cliente;
- itens;
- endereco;
- pagamento;
- frete;
- classificacao fiscal;
- impostos;
- regra utilizada;
- status da transmissao;
- mensagens da SEFAZ, prefeitura ou autoridade local;
- XML;
- DANFE ou representacao equivalente;
- guias;
- envio ao cliente;
- sincronizacao contabil.

## Bloqueios fiscais de seguranca

O sistema deve impedir expedicao, conclusao ou emissao quando houver:

- documento rejeitado;
- produto sem classificacao;
- servico sem codigo;
- certificado vencido;
- regra tributaria ausente;
- CPF, CNPJ ou identificador local invalido;
- endereco incompleto;
- inscricao estadual inconsistente;
- divergencia de total;
- duplicidade;
- erro de lote;
- falha na assinatura;
- guia obrigatoria nao gerada.

Esses bloqueios devem ser modelados como validacoes de workflow/adaptador, com evidencias e auditoria.

## Eventos minimos de produto

- `tax.simulation.completed`
- `fiscal_document.queued`
- `fiscal_document.authorized`
- `fiscal_document.rejected`
- `fiscal_document.cancelled`
- `fiscal_document.corrected`
- `guide.generated`
- `guide.due_soon`
- `certificate.expiring`
- `compliance.rule_changed`

Os nomes finais podem ser normalizados com os eventos globais da arquitetura, mas estes eventos de produto devem existir semanticamente.

## MVP inicial

O primeiro MVP deve suportar:

- multiplas empresas;
- multiplos estabelecimentos;
- produtos;
- clientes;
- pedidos;
- simulacao fiscal;
- NF-e de venda de mercadoria;
- cancelamento;
- consulta;
- XML;
- DANFE;
- certificado A1;
- integracao por API;
- webhooks;
- auditoria;
- painel de rejeicoes;
- exportacao para contabilidade.

## Decisao crucial do MVP

O MVP deve usar inicialmente um adaptador de provedor fiscal em ambiente de homologacao. Nao implementar comunicacao direta com todas as SEFAZ no primeiro MVP.

Isso reduz risco e permite validar:

- dominio;
- multiempresa;
- produto/cliente/pedido;
- calculo/simulacao;
- emissao assincrona;
- XML/DANFE;
- rejeicoes;
- webhooks;
- auditoria;
- experiencia operacional.

Depois, a comunicacao direta com governos pode ser adicionada por adaptador sem reescrever o Core.

## Entregas antes do codigo completo

Antes de construir a aplicacao completa, Helvok Tax precisa ter:

1. mapa da arquitetura;
2. modelo de dados;
3. fluxos de emissao;
4. matriz de permissoes;
5. contratos das APIs;
6. estrategia de criptografia;
7. estrutura de filas;
8. plano de integracao com provedores;
9. esquema inicial do Supabase;
10. migrations SQL;
11. RLS;
12. backend;
13. frontend;
14. testes;
15. documentacao;
16. implantacao.

## Risco juridico e operacional

A tecnologia pode unificar a experiencia. A conformidade fiscal continua exigindo validacao por especialistas locais em cada jurisdicao.

O produto deve deixar claro quando uma regra e:

- homologada;
- em revisao;
- simulada;
- fornecida por provedor externo;
- validada por especialista;
- aguardando confirmacao.

Mudancas detectadas em portais, diarios oficiais, PDFs, APIs governamentais ou provedores externos devem passar por captura de evidencia, analise de impacto, revisao e publicacao de nova versao antes de afetar calculos de producao.
