import { describe, expect, it, vi } from 'vitest';
import { runInNewContext } from 'node:vm';
import { renderDashboard } from '../src/frontend/dashboard';
import { createApp } from '../src/app';

function recovery(fetch: any, refresh: any, token = 'opaque-token') {
  const html = renderDashboard();
  const script = html.slice(html.indexOf('      let sessionRefreshPromise'), html.indexOf('      function getActiveTenantId'));
  const storage = new Map([['refresh', 'refresh-token']]);
  const context: any = { fetch, callSupabaseAuth: refresh, window: { localStorage: { getItem: (key: string) => storage.get(key) } }, authStorage: { refresh: 'refresh' }, getStoredAccessToken: () => token, storeAuthSession: (payload: any) => { token = payload.access_token; }, showAuthGate: vi.fn(), clearAuthSession: vi.fn(), renderSession: vi.fn(), authState: {}, atob, Date };
  runInNewContext(script + ';globalThis.load = loadSession;', context);
  return context;
}

describe('session recovery and favicon', () => {
  it('serves the browser favicon', async () => {
    const response = await createApp().request('/favicon.ico');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(100);
  });
  it('refreshes a rejected token once and retries with the new token', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'jwt_expired' } }), { status: 403 })).mockResolvedValueOnce(new Response(JSON.stringify({ session: { user: {} } })));
    const refresh = vi.fn().mockResolvedValue({ access_token: 'new-token' });
    const c = recovery(fetch, refresh);
    await c.load();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[1][1].headers.authorization).toBe('Bearer new-token');
  });
  it('does not refresh or bypass a permission denial', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'supabase_rpc_error', message: 'permission denied' } }), { status: 403 }));
    const refresh = vi.fn();
    await expect(recovery(fetch, refresh).load()).rejects.toThrow('permission denied');
    expect(refresh).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('shows only date and time instead of the provider label', () => {
    expect(renderDashboard()).not.toContain('Cloudflare ao vivo');
    expect(renderDashboard()).toContain('new Date().toLocaleString("pt-BR")');
  });
});
