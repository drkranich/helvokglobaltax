import { platformPlans } from '../billing/plans';
const money = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(cents / 100);
export function renderPlatformPlans(): string {
  return `<section class="app-view" id="planos" data-view="planos" aria-label="Planos da plataforma">
    <div class="view-head"><div><span class="view-kicker">Cresça com a Helvok</span><h1>Planos da plataforma</h1><p>A mesma plataforma, no tamanho da sua operação.</p></div></div>
    <article class="panel"><div class="panel-title"><h2>Compare os planos</h2><span>Valores por tenant</span></div>
      <div class="platform-plan-grid">${platformPlans.map(plan => `<div class="platform-plan-card"><h3>${plan.name}</h3><p>${plan.description}</p><strong class="platform-plan-price">${money(plan.monthly_price_cents)}<small>/mês</small></strong><p>Anual: ${money(plan.annual_price_cents)}, pago à vista. Dois meses de economia.</p><ul><li>Até ${plan.organizations} ${plan.organizations === 1 ? 'empresa' : 'empresas'}</li><li>Até ${plan.users} usuários</li><li>Todos os módulos disponíveis</li><li>Desktop e aplicativo PWA</li></ul></div>`).join('')}</div>
    </article>
    <article class="panel"><div class="panel-title"><h2>Condições de uso</h2><span>Transparência</span></div><p>Os valores são por tenant. Empresas são organizações cadastradas dentro desse tenant; usuários são pessoas com acesso ativo, incluindo o responsável.</p><p>Emissões e serviços de provedores fiscais, certificados digitais e consultoria são cobrados separadamente. Funcionalidades em desenvolvimento não são prometidas como parte da contratação.</p><p>Para operações acima de 20 empresas ou 30 usuários, o plano é sob consulta.</p><p>Contratação online em preparação. Nenhuma assinatura ou cobrança é iniciada nesta página.</p></article>
  </section>`;
}
export const platformPlanStyles = `
.platform-plan-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:20px; }
.platform-plan-card { min-width:0; border:1px solid var(--line); border-radius:18px; padding:24px; overflow-wrap:anywhere; }
.platform-plan-card h3 { margin:0 0 10px; font-size:20px; }
.platform-plan-card p { color:var(--champagne-64); line-height:1.6; }
.platform-plan-price { display:block; font-size:32px; margin:18px 0; }
.platform-plan-price small { font-size:14px; font-weight:400; }
.platform-plan-card ul { padding-left:20px; line-height:1.9; }
@media(max-width:1024px) { .platform-plan-grid { grid-template-columns:1fr; } }
`;
