import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { platformPlanCatalog, platformPlans } from '../src/billing/plans';
import { renderDashboard } from '../src/frontend/dashboard';

describe('platform plan catalogue', () => {
  it('serves public prices without claiming billing or quota enforcement', async () => {
    const response = await createApp().request('/v1/plans');
    const body = await response.json<typeof platformPlanCatalog>();
    expect(response.status).toBe(200);
    expect(body.billing_enabled).toBe(false);
    expect(body.limits_enforced).toBe(false);
    expect(body.plans).toEqual(platformPlans);
    expect(body.currency).toBe('BRL');
  });
  it('prices annual subscriptions at ten monthly payments', () => {
    for (const plan of platformPlanCatalog.plans) {
      expect(plan.annual_price_cents).toBe(plan.monthly_price_cents * 10);
      expect(plan.users).toBeGreaterThan(0);
      expect(plan.organizations).toBeGreaterThan(0);
    }
  });
  it('makes plans reachable through the shared desktop/mobile module navigation', () => {
    const html = renderDashboard();
    expect(html).toContain('href="#planos"');
    expect(html).toContain('data-view="planos"');
    expect(html).toContain('Compare os planos');
    expect(html).toContain('Contratação online em preparação');
  });
});
