import { describe, expect, it, vi, afterEach } from 'vitest';
import { createApp } from '../src/app';
import { isPlatformAdmin } from '../src/billing/routes';
import { validatePlanUpdate, verifyStripePrices } from '../src/billing/catalog';
const env = { APP_NAME: 'Helvok Tax', APP_ENV: 'production', API_VERSION: 'v1', SUPABASE_URL: 'https://jlvwudjgfzhhdgttrycj.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'public', SUPABASE_SERVICE_ROLE_KEY: 'service-role', STRIPE_SECRET_KEY: 'rk_test_example' } as const;
const payload = { monthly_price_cents: 19900, annual_price_cents: 199000, stripe_monthly_price_id: 'price_monthly', stripe_annual_price_id: 'price_annual', revision: 0 };
const user = { id: '11111111-1111-4111-8111-111111111111', app_metadata: { helvok_platform_admin: true } };
const headers = { authorization: 'Bearer user-token', 'content-type': 'application/json' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
afterEach(() => vi.restoreAllMocks());
describe('platform pricing administration', () => {
  it('never treats tenant roles or editable user metadata as platform administration', () => {
    expect(isPlatformAdmin({ user_metadata: { helvok_platform_admin: true }, app_metadata: { role: 'owner' } })).toBe(false);
    expect(isPlatformAdmin(user)).toBe(true);
    expect(isPlatformAdmin({ id: 'trusted-id' }, 'trusted-id')).toBe(true);
    expect(isPlatformAdmin({ id: 'other-id' }, 'trusted-id')).toBe(false);
  });
  it('requires authentication before allowing plan edits', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    const response = await createApp().request('/v1/billing/admin/plans/essential', { method: 'PUT', body: JSON.stringify(payload) }, env);
    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('denies tenant owners before reading or modifying plan data', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json({ id: user.id, user_metadata: { helvok_platform_admin: true } }));
    const response = await createApp().request('/v1/billing/admin/plans/essential', { method: 'PUT', headers, body: JSON.stringify(payload) }, env);
    expect(response.status).toBe(403);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('rejects invalid amounts and non-price identifiers', () => {
    expect(() => validatePlanUpdate({ ...payload, monthly_price_cents: 199.5 })).toThrow();
    expect(() => validatePlanUpdate({ ...payload, stripe_monthly_price_id: 'prod_example' })).toThrow();
  });
  it('rejects Stripe mismatches before persisting prices', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json(user)).mockResolvedValueOnce(json({ id: 'price_monthly', active: true, product: 'prod_common', currency: 'usd', unit_amount: 19900, type: 'recurring', billing_scheme: 'per_unit', recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed' }, livemode: false }));
    const response = await createApp().request('/v1/billing/admin/plans/essential', { method: 'PUT', headers, body: JSON.stringify(payload) }, env);
    expect(response.status).toBe(400);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('persists edits with optimistic concurrency and the authenticated actor', async () => {
    const update = { ...payload, stripe_monthly_price_id: null, stripe_annual_price_id: null };
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json(user)).mockResolvedValueOnce(json([{ ...update, id: 'essential', revision: 1 }]));
    const response = await createApp().request('/v1/billing/admin/plans/essential', { method: 'PUT', headers, body: JSON.stringify(update) }, env);
    expect(response.status).toBe(200);
    const saved = JSON.parse(String(fetch.mock.calls[1]![1]!.body));
    expect(saved.updated_by).toBe(user.id);
    expect(saved.revision).toBe(1);
    expect(String(fetch.mock.calls[1]![0])).toContain('revision=eq.0');
  });
  it('rejects concurrent changes rather than overwriting another administrator', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json(user)).mockResolvedValueOnce(json([]));
    const response = await createApp().request('/v1/billing/admin/plans/essential', { method: 'PUT', headers, body: JSON.stringify({ ...payload, stripe_monthly_price_id: null, stripe_annual_price_id: null }) }, env);
    expect(response.status).toBe(409);
  });
  it('validates matching monthly and annual Stripe prices in the configured mode', async () => {
    const common = { active: true, product: 'prod_common', currency: 'brl', type: 'recurring', billing_scheme: 'per_unit', livemode: false };
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json({ ...common, unit_amount: 19900, recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed' } })).mockResolvedValueOnce(json({ ...common, unit_amount: 199000, recurring: { interval: 'year', interval_count: 1, usage_type: 'licensed' } }));
    await expect(verifyStripePrices(env, validatePlanUpdate(payload))).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
