import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';
import { accountMarkup, accountScript } from '../src/frontend/account';
import { renderDashboard } from '../src/frontend/dashboard';
const { JSDOM } = createRequire(import.meta.url)('jsdom');
function setup() {
  const dom = new JSDOM(accountMarkup, { url: 'https://helvok.test/app', runScripts: 'outside-only' });
  const w = dom.window;
  w.qs = (selector: string) => w.document.querySelector(selector);
  w.setText = (selector: string, text: string) => { w.qs(selector).textContent = text; };
  w.getAuthConfig = vi.fn().mockResolvedValue({ supabase_url: 'https://project.supabase.co', supabase_publishable_key: 'public' });
  w.getStoredAccessToken = vi.fn(() => 'existing-token');
  w.callSupabaseAuth = vi.fn().mockResolvedValue({ access_token: 'fresh-token', user: { id: 'own-user', email: 'old@example.com' } });
  w.storeAuthSession = vi.fn();
  w.clearAuthSession = vi.fn();
  w.setAuthMessage = vi.fn();
  w.syncSession = vi.fn();
  w.authStorage = { email: 'stored-email' };
  w.refreshStoredSession = vi.fn().mockResolvedValue(false);
  w.fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ id: 'own-user', email: 'old@example.com' }))).mockResolvedValueOnce(new Response(JSON.stringify({ id: 'own-user', email: 'old@example.com', new_email: 'new@example.com' })));
  w.eval(accountScript);
  return w;
}
describe('self-service account settings', () => {
  it('revalidates the same user before requesting an email change without marking pending email as active', async () => {
    const w = setup();
    w.qs('#account-new-email').value = 'new@example.com';
    w.qs('#account-email-password').value = 'current-password';
    await w.submitAccountUpdate({ preventDefault() {}, currentTarget: w.qs('#account-email-form') }, 'email');
    expect(w.fetch).toHaveBeenCalledTimes(2);
    const update = w.fetch.mock.calls[1];
    expect(update[0]).toContain('/auth/v1/user?redirect_to=');
    expect(update[1].headers.authorization).toBe('Bearer fresh-token');
    expect(JSON.parse(update[1].body)).toEqual({ email: 'new@example.com' });
    expect(w.localStorage.getItem('stored-email')).toBeNull();
    expect(w.qs('#account-email-message').textContent).toContain('Confirme');
    expect(w.qs('#account-email-password').value).toBe('');
    w.close();
  });
  it('refuses an incorrect current password before updating', async () => {
    const w = setup();
    w.callSupabaseAuth.mockRejectedValue(new Error('invalid credentials'));
    w.qs('#account-new-email').value = 'new@example.com';
    w.qs('#account-email-password').value = 'wrong-password';
    await w.submitAccountUpdate({ preventDefault() {}, currentTarget: w.qs('#account-email-form') }, 'email');
    expect(w.fetch).toHaveBeenCalledTimes(1);
    expect(w.storeAuthSession).not.toHaveBeenCalled();
    expect(w.qs('#account-email-message').textContent).toContain('senha atual');
    w.close();
  });
  it('requires a signed-in user', async () => {
    const w = setup();
    w.getStoredAccessToken.mockReturnValue('');
    w.qs('#account-new-email').value = 'new@example.com';
    w.qs('#account-email-password').value = 'current-password';
    await w.submitAccountUpdate({ preventDefault() {}, currentTarget: w.qs('#account-email-form') }, 'email');
    expect(w.fetch).not.toHaveBeenCalled();
    expect(w.qs('#account-email-message').textContent).toContain('Entre na sua conta');
    w.close();
  });
  it('refuses a different identity and never submits the update', async () => {
    const w = setup();
    w.callSupabaseAuth.mockResolvedValue({ access_token: 'foreign-token', user: { id: 'another-user' } });
    w.qs('#account-new-email').value = 'new@example.com';
    w.qs('#account-email-password').value = 'current-password';
    await w.submitAccountUpdate({ preventDefault() {}, currentTarget: w.qs('#account-email-form') }, 'email');
    expect(w.fetch).toHaveBeenCalledTimes(1);
    expect(w.storeAuthSession).not.toHaveBeenCalled();
    w.close();
  });
  it('rejects mismatched password confirmation without network requests', async () => {
    const w = setup();
    w.qs('#account-current-password').value = 'old-password';
    w.qs('#account-new-password').value = 'new-password';
    w.qs('#account-confirm-password').value = 'different-password';
    await w.submitAccountUpdate({ preventDefault() {}, currentTarget: w.qs('#account-password-form') }, 'password');
    expect(w.fetch).not.toHaveBeenCalled();
    expect(w.qs('#account-password-message').textContent).toContain('não coincidem');
    w.close();
  });
  it('changes only the authenticated password and requests a fresh login', async () => {
    const w = setup();
    w.qs('#account-current-password').value = 'old-password';
    w.qs('#account-new-password').value = 'new-password';
    w.qs('#account-confirm-password').value = 'new-password';
    await w.submitAccountUpdate({ preventDefault() {}, currentTarget: w.qs('#account-password-form') }, 'password');
    expect(JSON.parse(w.fetch.mock.calls[1][1].body)).toEqual({ password: 'new-password' });
    expect(w.clearAuthSession).toHaveBeenCalledTimes(1);
    expect(w.setAuthMessage).toHaveBeenCalledWith('Senha alterada. Entre com sua nova senha.', 'good');
    expect(w.qs('#account-new-password').value).toBe('');
    w.close();
  });
  it('removes confirmation tokens from the address and uses the correct return page', () => {
    const w = setup();
    w.history.replaceState(null, '', '/app#type=email_change&access_token=token&refresh_token=refresh');
    expect(w.detectEmailChangeReturn()).toBe(true);
    expect(w.location.hash).toBe('#minha-conta');
    expect(w.storeAuthSession).toHaveBeenCalledWith({ access_token: 'token', refresh_token: 'refresh' });
    expect(renderDashboard()).toContain('href="#minha-conta"');
    w.close();
  });
});
