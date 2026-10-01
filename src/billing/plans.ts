/** Commercial catalogue only. Never use browser selection as authorization. */
export const platformPlans = [
  { id: 'essential', name: 'Essencial', monthly_price_cents: 14900, annual_price_cents: 149000, organizations: 1, users: 3, description: 'Uma empresa, decisões mais claras e uma operação organizada.' },
  { id: 'professional', name: 'Profissional', monthly_price_cents: 39900, annual_price_cents: 399000, organizations: 5, users: 10, description: 'Para equipes e negócios que administram várias empresas.' },
  { id: 'business', name: 'Business', monthly_price_cents: 99900, annual_price_cents: 999000, organizations: 20, users: 30, description: 'Para grupos empresariais e escritórios com uma operação maior.' },
] as const;

export const platformPlanCatalog = {
  currency: 'BRL', billing_enabled: false, limits_enforced: false,
  annual_months_charged: 10,
  plans: platformPlans,
  included: ['Módulos disponíveis da plataforma', 'Acesso desktop e PWA mobile', 'Permissões e isolamento por tenant'],
  exclusions: ['Custos de provedores fiscais e emissões', 'Certificados digitais', 'Consultoria contábil ou jurídica', 'Integrações ainda não disponíveis'],
};
