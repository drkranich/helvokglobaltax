import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv } from '../env';
import { jsonResponse } from '../response';
import { SupabaseAuthenticatedClient, SupabaseAuthError } from '../supabase';
import { platformPlanCatalog, platformPlans } from './plans';
import { BillingError, planStore, readPlanCatalog, validatePlanUpdate, verifyStripePrices } from './catalog';
export function isPlatformAdmin(user: Record<string, unknown>, ids = ''): boolean {
  const metadata = user.app_metadata as Record<string, unknown> | undefined;
  return metadata?.helvok_platform_admin === true || (typeof user.id === 'string' && ids.split(',').map(id => id.trim()).filter(Boolean).includes(user.id));
}
async function currentUser(c: Context<AppEnv>) {
  const authorization = c.req.header('authorization') || '';
  if (!/^Bearer \S+$/i.test(authorization)) throw new SupabaseAuthError(401, 'Entre na sua conta.');
  return new SupabaseAuthenticatedClient(c.env, authorization.split(' ')[1]!).getUser();
}
function errorResponse(c: Context<AppEnv>, error: unknown) {
  if (error instanceof BillingError) return jsonResponse(c, { error: { code: 'billing_configuration_error', message: error.message } }, error.status);
  if (error instanceof SupabaseAuthError) return jsonResponse(c, { error: { code: 'auth_error', message: 'Sessão inválida. Entre novamente.' } }, 401);
  return jsonResponse(c, { error: { code: 'billing_unavailable', message: 'Planos indisponíveis. Tente novamente.' } }, 503);
}
export function createBillingRouter() {
  const router = new Hono<AppEnv>();
  router.get('/plans', async c => {
    try { return jsonResponse(c, { ...platformPlanCatalog, plans: await readPlanCatalog(c.env), catalog_source: 'database' }); }
    catch (error) {
      if (c.env.SUPABASE_SERVICE_ROLE_KEY) return errorResponse(c, error);
      return jsonResponse(c, { ...platformPlanCatalog, catalog_source: 'default' });
    }
  });
  router.get('/billing/admin-access', async c => {
    try { return jsonResponse(c, { platform_admin: isPlatformAdmin(await currentUser(c), c.env.HELVOK_PLATFORM_ADMIN_USER_IDS) }); }
    catch { return jsonResponse(c, { platform_admin: false }); }
  });
  router.use('/billing/admin/*', async (c, next) => {
    try {
      const user = await currentUser(c);
      if (!isPlatformAdmin(user, c.env.HELVOK_PLATFORM_ADMIN_USER_IDS)) return jsonResponse(c, { error: { code: 'forbidden', message: 'Apenas o administrador da plataforma pode editar planos.' } }, 403);
      c.set('billingAdminId', String(user.id));
    } catch (error) { return errorResponse(c, error); }
    await next();
  });
  router.get('/billing/admin/plans', async c => {
    try { return jsonResponse(c, { plans: await readPlanCatalog(c.env) }); } catch (error) { return errorResponse(c, error); }
  });
  router.put('/billing/admin/plans/:id', async c => {
    try {
      const id = c.req.param('id');
      if (!platformPlans.some(plan => plan.id === id)) throw new BillingError(400, 'Plano desconhecido.');
      const body = await c.req.json().catch(() => null);
      const plan = validatePlanUpdate(body);
      await verifyStripePrices(c.env, plan);
      const rows = await planStore(c.env, '?id=eq.' + id + '&revision=eq.' + plan.revision, 'PATCH', {
        monthly_price_cents: plan.monthly_price_cents, annual_price_cents: plan.annual_price_cents,
        stripe_monthly_price_id: plan.stripe_monthly_price_id, stripe_annual_price_id: plan.stripe_annual_price_id,
        updated_by: c.get('billingAdminId'), revision: plan.revision + 1, updated_at: new Date().toISOString()
      });
      if (!rows.length) throw new BillingError(409, 'Outro administrador alterou este plano. Recarregue antes de salvar.');
      return jsonResponse(c, { plan: rows[0] });
    } catch (error) { return errorResponse(c, error); }
  });
  return router;
}
