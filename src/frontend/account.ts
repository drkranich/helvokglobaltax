export const accountMarkup = `
<section class="app-view" id="minha-conta" data-view="minha-conta" aria-label="Minha conta">
  <div class="view-head"><div><span class="view-kicker">Seu acesso</span><h1>Minha conta</h1><p>Atualize seu e-mail e sua senha de acesso à Helvok.</p></div></div>
  <article class="panel"><div class="panel-title"><h2>Trocar e-mail</h2></div>
    <p>E-mail atual: <strong id="account-current-email">Entre para consultar</strong></p>
    <p>A alteração pode exigir confirmação no e-mail atual e no novo endereço. Seus acessos às empresas são preservados.</p>
    <form id="account-email-form" class="stacked-form">
      <div class="field-block"><label for="account-new-email">Novo e-mail</label><input class="glass-field" id="account-new-email" type="email" autocomplete="email" required maxlength="254" /></div>
      <div class="field-block"><label for="account-email-password">Senha atual</label><input class="glass-field" id="account-email-password" type="password" autocomplete="current-password" required /></div>
      <button class="glass-button primary" type="submit">Alterar e-mail</button>
    </form><p id="account-email-message" role="status" aria-live="polite"></p>
  </article>
  <article class="panel"><div class="panel-title"><h2>Trocar senha</h2></div>
    <form id="account-password-form" class="stacked-form">
      <div class="field-block"><label for="account-current-password">Senha atual</label><input class="glass-field" id="account-current-password" type="password" autocomplete="current-password" required /></div>
      <div class="field-block"><label for="account-new-password">Nova senha</label><input class="glass-field" id="account-new-password" type="password" autocomplete="new-password" minlength="8" required /><small>Use pelo menos 8 caracteres.</small></div>
      <div class="field-block"><label for="account-confirm-password">Confirmar nova senha</label><input class="glass-field" id="account-confirm-password" type="password" autocomplete="new-password" minlength="8" required /></div>
      <button class="glass-button primary" type="submit">Salvar nova senha</button>
    </form><p id="account-password-message" role="status" aria-live="polite"></p>
  </article>
</section>`;

export const accountScript = `
let accountUpdateBusy = false;
function renderAccountEmail(email) {
  setText("#account-current-email", email || "Entre para consultar");
}
async function accountAuthRequest(method, attributes, token, retried = false) {
  const config = await getAuthConfig();
  const redirect = method === "PUT" && attributes && attributes.email ? "?redirect_to=" + encodeURIComponent(window.location.origin + "/app") : "";
  const response = await fetch(config.supabase_url + "/auth/v1/user" + redirect, {
    method, cache: "no-store",
    headers: { apikey: config.supabase_publishable_key, authorization: "Bearer " + token, ...(method === "PUT" ? {"content-type": "application/json"} : {}) },
    ...(method === "PUT" ? { body: JSON.stringify(attributes) } : {})
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (method === "GET" && response.status === 401 && !retried && await refreshStoredSession()) return accountAuthRequest(method, attributes, getStoredAccessToken(), true);
    const messages = {
      email_exists: "Este e-mail já está associado a outra conta.",
      weak_password: "Escolha uma senha mais forte para atender às regras de segurança.",
      same_password: "A nova senha precisa ser diferente da atual.",
      over_email_send_rate_limit: "Aguarde alguns minutos antes de solicitar outro e-mail.",
      reauthentication_needed: "Entre novamente e repita a alteração.",
      session_not_found: "Sua sessão terminou. Entre novamente.",
      jwt_expired: "Sua sessão expirou. Entre novamente."
    };
    throw new Error(messages[body.code || body.error_code] || "Não foi possível atualizar sua conta. Confira os dados e tente novamente.");
  }
  return body;
}
async function reauthenticateAccount(password) {
  if (!getStoredAccessToken()) throw new Error("Entre na sua conta antes de alterar seus dados.");
  const user = await accountAuthRequest("GET", null, getStoredAccessToken());
  if (!user.id || !user.email) throw new Error("Não foi possível confirmar sua identidade. Entre novamente.");
  let session;
  try { session = await callSupabaseAuth("/auth/v1/token?grant_type=password", { email: user.email, password }); }
  catch { throw new Error("Não foi possível confirmar a senha atual. Confira a senha e tente novamente."); }
  if (!session.access_token || !session.user || session.user.id !== user.id) throw new Error("Não foi possível confirmar a mesma conta. Entre novamente.");
  storeAuthSession(session);
  return { token: session.access_token, user };
}
async function submitAccountUpdate(event, kind) {
  event.preventDefault();
  if (accountUpdateBusy) return;
  const form = event.currentTarget;
  const message = "#account-" + kind + "-message";
  const button = form.querySelector("button[type='submit']");
  const passwordInput = qs(kind === "email" ? "#account-email-password" : "#account-current-password");
  let value = kind === "email" ? qs("#account-new-email").value.trim().toLowerCase() : qs("#account-new-password").value;
  const confirm = kind === "password" ? qs("#account-confirm-password").value : "";
  if (!passwordInput.value) { setText(message, "Informe sua senha atual."); return; }
  if (kind === "password" && (value.length < 8 || value !== confirm || value === passwordInput.value)) {
    setText(message, value !== confirm ? "As senhas não coincidem." : value === passwordInput.value ? "Escolha uma senha diferente da atual." : "Use pelo menos 8 caracteres na nova senha."); return;
  }
  if (kind === "email" && !qs("#account-new-email").checkValidity()) { setText(message, "Informe um e-mail válido."); return; }
  accountUpdateBusy = true;
  button.disabled = true;
  setText(message, "Confirmando sua identidade...");
  try {
    const { token, user } = await reauthenticateAccount(passwordInput.value);
    if (kind === "email" && value === user.email.toLowerCase()) throw new Error("Informe um e-mail diferente do atual.");
    const updated = await accountAuthRequest("PUT", kind === "email" ? { email: value } : { password: value }, token);
    form.reset();
    if (kind === "password") {
      clearAuthSession();
      setAuthMessage("Senha alterada. Entre com sua nova senha.", "good");
      setText(message, "Senha alterada com sucesso.");
    } else if (updated.email && updated.email.toLowerCase() === value) {
      window.localStorage.setItem(authStorage.email, updated.email);
      renderAccountEmail(updated.email);
      setText(message, "E-mail alterado com sucesso.");
      try { await syncSession(); } catch { setText(message, "E-mail alterado. Entre novamente para atualizar sua sessão."); }
    } else {
      setText(message, "Solicitação enviada. Confirme os links recebidos no e-mail atual e no novo endereço, conforme solicitado. Até lá, seu e-mail de acesso continua o mesmo.");
    }
  } catch (error) {
    setText(message, error instanceof Error ? error.message : "Não foi possível alterar seus dados. Tente novamente.");
  } finally {
    passwordInput.value = "";
    if (kind === "password") { qs("#account-new-password").value = ""; qs("#account-confirm-password").value = ""; }
    button.disabled = false;
    accountUpdateBusy = false;
  }
}
function detectEmailChangeReturn() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (params.get("type") !== "email_change") return false;
  const accessToken = params.get("access_token"), refreshToken = params.get("refresh_token");
  window.history.replaceState(null, "", window.location.pathname + window.location.search + "#minha-conta");
  if (!accessToken || !refreshToken) return false;
  storeAuthSession({ access_token: accessToken, refresh_token: refreshToken });
  return true;
}
function initializeAccount() {
  qs("#account-email-form").addEventListener("submit", event => submitAccountUpdate(event, "email"));
  qs("#account-password-form").addEventListener("submit", event => submitAccountUpdate(event, "password"));
}
`;
