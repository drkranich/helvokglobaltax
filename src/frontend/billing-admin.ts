import { platformPlans } from '../billing/plans';
export const billingAdminMarkup = `<section class="app-view" id="admin-planos" data-view="admin-planos" aria-label="Administração dos planos" data-platform-admin hidden>
<div class="view-head"><div><span class="view-kicker">Admin da plataforma</span><h1>Preços e Stripe</h1><p>Atualize o catálogo e vincule os preços recorrentes do Stripe.</p></div></div>
<article class="panel"><div class="panel-title"><h2>Editar planos</h2></div><p>Para mudar um valor vinculado ao Stripe, crie um novo preço no Stripe e informe o novo Price ID. A alteração do catálogo não modifica assinaturas já contratadas.</p>
<p id="billing-admin-status" role="status" aria-live="polite">Carregando planos...</p>
${platformPlans.map(plan => `<form class="stacked-form billing-plan-form" data-plan-id="${plan.id}"><h3>${plan.name}</h3>
<div class="tax-input-grid two"><div class="field-block"><label for="${plan.id}-monthly">Mensal (R$)</label><input class="glass-field" id="${plan.id}-monthly" name="monthly" inputmode="decimal" placeholder="149,00" required /></div><div class="field-block"><label for="${plan.id}-annual">Anual total (R$)</label><input class="glass-field" id="${plan.id}-annual" name="annual" inputmode="decimal" required /></div>
<div class="field-block"><label for="${plan.id}-stripe-monthly">Price ID mensal</label><input class="glass-field" id="${plan.id}-stripe-monthly" name="stripe_monthly" placeholder="price_..." autocomplete="off" /></div><div class="field-block"><label for="${plan.id}-stripe-annual">Price ID anual</label><input class="glass-field" id="${plan.id}-stripe-annual" name="stripe_annual" placeholder="price_..." autocomplete="off" /></div></div>
<button type="submit" class="glass-button primary" disabled>Validar e salvar ${plan.name}</button><p class="billing-plan-message" role="status" aria-live="polite"></p></form>`).join('')}</article></section>`;
export const billingAdminScript = `
function setBillingAdminVisible(visible) {
  document.querySelectorAll("[data-platform-admin]").forEach(node => { node.hidden = !visible; });
  if (!visible) document.querySelectorAll(".billing-plan-form button").forEach(button => { button.disabled = true; });
}
async function loadPublishedPlans() {
  try {
    const response = await fetch("/v1/plans", {cache: "no-store"});
    if (!response.ok) throw new Error("Valores indisponíveis neste momento.");
    const body = await response.json();
    setText("#published-plans-status", "Valores por tenant, em reais.");
    (body.plans || []).forEach(plan => {
      const money = cents => new Intl.NumberFormat("pt-BR", {style: "currency", currency: "BRL"}).format(cents / 100);
      const monthly = document.querySelector('[data-plan-monthly="' + plan.id + '"]');
      const annual = document.querySelector('[data-plan-annual="' + plan.id + '"]');
      if (monthly) monthly.textContent = money(plan.monthly_price_cents);
      if (annual) annual.textContent = money(plan.annual_price_cents);
    });
  } catch { setText("#published-plans-status", "Valores indisponíveis neste momento. Verifique sua conexão e tente novamente."); }
}
function fillBillingPlan(plan) {
  const form = document.querySelector('.billing-plan-form[data-plan-id="' + plan.id + '"]');
  if (!form) return;
  form.elements.namedItem("monthly").value = (plan.monthly_price_cents / 100).toFixed(2).replace(".", ",");
  form.elements.namedItem("annual").value = (plan.annual_price_cents / 100).toFixed(2).replace(".", ",");
  form.elements.namedItem("stripe_monthly").value = plan.stripe_monthly_price_id || "";
  form.elements.namedItem("stripe_annual").value = plan.stripe_annual_price_id || "";
  form.dataset.revision = plan.revision;
  form.querySelector("button").disabled = false;
}
async function initializeBillingAdmin() {
  const token = getStoredAccessToken();
  if (!token) { setBillingAdminVisible(false); return; }
  try {
    const headers = {authorization: "Bearer " + token};
    const access = await fetch("/v1/billing/admin-access", {headers, cache: "no-store"});
    const body = await access.json();
    if (token !== getStoredAccessToken()) return;
    setBillingAdminVisible(access.ok && body.platform_admin === true);
    if (!body.platform_admin) return;
    const response = await fetch("/v1/billing/admin/plans", {headers, cache: "no-store"});
    const plans = await response.json();
    if (token !== getStoredAccessToken()) return;
    if (!response.ok) throw new Error(plans.error?.message || "Não foi possível carregar os planos.");
    plans.plans.forEach(fillBillingPlan);
    setText("#billing-admin-status", "Preços salvos no banco. Os Price IDs são validados no Stripe ao salvar.");
  } catch (error) { setText("#billing-admin-status", error.message || "Admin indisponível."); }
}
function billingMoneyToCents(value) {
  if (!/^\\d{1,7}([.,]\\d{1,2})?$/.test(value.trim())) throw new Error("Informe o valor sem separador de milhar, por exemplo 149,00.");
  return Math.round(Number(value.trim().replace(",", ".")) * 100);
}
function initializeBillingForms() {
  document.querySelectorAll(".billing-plan-form").forEach(form => form.addEventListener("submit", async event => {
    event.preventDefault();
    const button = form.querySelector("button"), message = form.querySelector(".billing-plan-message");
    if (button.disabled) return;
    button.disabled = true;
    try {
      const value = name => form.elements.namedItem(name).value.trim();
      const payload = {monthly_price_cents: billingMoneyToCents(value("monthly")), annual_price_cents: billingMoneyToCents(value("annual")), stripe_monthly_price_id: value("stripe_monthly") || null, stripe_annual_price_id: value("stripe_annual") || null, revision: Number(form.dataset.revision)};
      message.textContent = "Validando e salvando...";
      const response = await fetch("/v1/billing/admin/plans/" + form.dataset.planId, {method: "PUT", headers: {authorization: "Bearer " + getStoredAccessToken(), "content-type": "application/json"}, body: JSON.stringify(payload)});
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Não foi possível salvar.");
      fillBillingPlan(body.plan);
      message.textContent = "Plano atualizado e publicado com sucesso.";
      await loadPublishedPlans();
    } catch (error) { message.textContent = error.message || "Não foi possível salvar."; }
    finally { button.disabled = false; }
  }));
}
`;
