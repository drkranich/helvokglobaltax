import Stripe from 'stripe';
import type { AppBindings } from '../env';
import { platformPlans } from './plans';
export type StoredPlan = { id: string; monthly_price_cents: number; annual_price_cents: number; stripe_monthly_price_id: string | null; stripe_annual_price_id: string | null; revision: number };
export class BillingError extends Error {
  constructor(public status: 400 | 409 | 502 | 503, message: string) { super(message); }
}
export async function planStore(env: AppBindings, suffix: string, method = 'GET', body?: unknown): Promise<StoredPlan[]> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new BillingError(503, 'Banco dos planos não configurado.');
  const response = await fetch(env.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/helvok_platform_plans' + suffix, {
    method, headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'content-type': 'application/json', Prefer: 'return=representation' },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  if (!response.ok) throw new BillingError(503, 'Não foi possível acessar os planos. Verifique a migração do banco.');
  return await response.json<StoredPlan[]>();
}
export async function readPlanCatalog(env: AppBindings) {
  const rows = await planStore(env, '?select=id,monthly_price_cents,annual_price_cents,stripe_monthly_price_id,stripe_annual_price_id,revision');
  if (rows.length !== platformPlans.length) throw new BillingError(503, 'Catálogo incompleto. Verifique a migração do banco.');
  return platformPlans.map(plan => {
    const row = rows.find(row => row.id === plan.id);
    if (!row) throw new BillingError(503, 'Plano ausente no banco.');
    return { ...plan, ...row };
  });
}
export function validatePlanUpdate(value: unknown): StoredPlan {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BillingError(400, 'Informe os valores do plano.');
  const b = value as Record<string, unknown>;
  for (const key of ['monthly_price_cents', 'annual_price_cents']) {
    if (!Number.isSafeInteger(b[key]) || Number(b[key]) < 100 || Number(b[key]) > 100000000) throw new BillingError(400, 'Informe valores válidos em centavos, entre R$ 1 e R$ 1.000.000.');
  }
  if (!Number.isSafeInteger(b.revision) || Number(b.revision) < 0) throw new BillingError(400, 'Recarregue o plano antes de salvar.');
  const priceId = (key: string) => {
    const id = b[key];
    if (id === null || id === '') return null;
    if (typeof id !== 'string' || !/^price_[A-Za-z0-9]{3,200}$/.test(id)) throw new BillingError(400, 'Informe um Stripe Price ID válido (price_...).');
    return id;
  };
  return { id: '', monthly_price_cents: Number(b.monthly_price_cents), annual_price_cents: Number(b.annual_price_cents), stripe_monthly_price_id: priceId('stripe_monthly_price_id'), stripe_annual_price_id: priceId('stripe_annual_price_id'), revision: Number(b.revision) };
}
export async function verifyStripePrices(env: Pick<AppBindings, 'STRIPE_SECRET_KEY'>, plan: StoredPlan): Promise<void> {
  const pairs = [[plan.stripe_monthly_price_id, plan.monthly_price_cents, 'month'], [plan.stripe_annual_price_id, plan.annual_price_cents, 'year']] as const;
  if (!pairs.some(([id]) => id)) return;
  if (!env.STRIPE_SECRET_KEY) throw new BillingError(503, 'Configure a chave Stripe no Worker antes de vincular Price IDs.');
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-08-26.dahlia', httpClient: Stripe.createFetchHttpClient(), maxNetworkRetries: 1, timeout: 10000 });
  let productId: string | null = null;
  for (const [id, amount, interval] of pairs) {
    if (!id) continue;
    let price: Stripe.Price;
    try { price = await stripe.prices.retrieve(id); }
    catch { throw new BillingError(400, 'Price ID não encontrado ou sem acesso na conta Stripe configurada.'); }
    const product = typeof price.product === "string" ? price.product : price.product.id;
    if (productId && productId !== product) throw new BillingError(400, "Os preços mensal e anual precisam pertencer ao mesmo produto Stripe.");
    productId = product;
    const live = /^(sk|rk)_live_/.test(env.STRIPE_SECRET_KEY);
    if (!price.active || price.type !== 'recurring' || price.billing_scheme !== 'per_unit' || price.currency !== 'brl' || price.unit_amount !== amount || price.recurring?.interval !== interval || price.recurring.interval_count !== 1 || price.recurring.usage_type !== 'licensed' || price.transform_quantity || price.livemode !== live) {
      throw new BillingError(400, 'O Price ID precisa estar ativo, em BRL, com o valor exato e recorrência mensal/anual correspondente. Para mudar o valor no Stripe, crie um novo Price ID.');
    }
  }
}
