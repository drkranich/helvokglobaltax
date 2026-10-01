export const mobileStyles = `
.mobile-nav, .mobile-tools, .mobile-module-dialog { display: none; }
@media (max-width: 1024px) {
  html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
  body { font-size: 15px; line-height: 1.55; }
  .app-shell { display: block; }
  .side-rail { display: none; }
  .content { min-width: 0; padding: calc(12px + env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) calc(92px + env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); }
  .content *, .auth-card *, .compare-modal-card * { min-width: 0; }
  .mobile-brand { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0 18px; border: 0; background: none; }
  .mobile-brand > span { width: 100%; font-size: 13px; }
  .mobile-brand strong { font-size: 23px; }
  .mobile-tools { display: flex; gap: 8px; }
  .mobile-tools button { border: 1px solid var(--line); background: white; padding: 8px 12px; border-radius: 12px; }
  .topbar, .view-head, .hero-grid, .work-grid, .tax-workbench, .members-workbench, .access-grid,
  .catalog-workbench, .catalog-form, .financial-record-form, .form-grid, .member-form, .invitation-form,
  .tax-input-grid, .tax-input-grid.two, .catalog-item-card, .financial-record-card, .member-card,
  .invitation-card, .audit-card, .copy-row, .tax-mini-card, .tax-line-card, .tax-doc-card, .tax-warning-card, .tax-chain-card {
    grid-template-columns: minmax(0, 1fr); width: 100%;
  }
  .metrics-grid, .modules-grid, .hero-strip, .catalog-meta-grid, .jurisdiction-map, .access-matrix,
  .tax-kpi-grid, .tax-market-strip, .comparison-summary, .compare-modal-summary { grid-template-columns: minmax(0, 1fr); }
  .topbar { position: static; padding: 16px; gap: 16px; }
  .breadcrumb, .top-actions, .panel-title, .file-upload-row, .financial-toolbar { flex-wrap: wrap; gap: 10px; }
  .breadcrumb strong, .session-chip, .file-upload-name { max-width: 100%; white-space: normal; overflow: visible; text-overflow: clip; overflow-wrap: anywhere; }
  .top-actions { display: grid; grid-template-columns: minmax(0, 1fr); }
  .top-actions > *, .session-chip { width: 100%; }
  .panel, .hero-panel, .status-panel { padding: 18px; border-radius: 16px; }
  .hero-title { font-size: clamp(32px, 10vw, 44px); line-height: 1.12; }
  .hero-panel { min-height: 0; }
  .hero-content { padding: 0; }
  .hero-subtitle, .view-head p, .panel p { font-size: 15px; line-height: 1.6; }
  h1, h2, h3, p, strong, code, .feed-copy, .field-block label { overflow-wrap: anywhere; }
  .glass-field, .glass-select, textarea, .select-trigger { font-size: 16px; width: 100%; min-height: 48px; }
  button, .glass-button, .nav-button, .auth-link, .glass-upload-button, .select-option { min-height: 44px; }
  .glass-button, .glass-upload-button { height: auto; white-space: normal; padding-block: 12px; text-align: center; overflow-wrap: anywhere; }
  .select-panel { max-width: 100%; max-height: 45dvh; overflow: auto; }
  .select-option { white-space: normal; }
  .financial-toolbar { grid-template-columns: minmax(0, 1fr); }
  .comparison-toolbar { grid-template-columns: minmax(0, 1fr); }
  .comparison-table { overflow: visible; }
  .comparison-row { min-width: 0; grid-template-columns: minmax(0, 1fr); padding: 16px; gap: 14px; }
  .comparison-row.header { display: none; }
  .comparison-row > [data-mobile-label]::before { content: attr(data-mobile-label); display: block; color: var(--champagne-64); font-size: 12px; font-weight: 500; margin-bottom: 3px; }
  .feed-item { grid-template-columns: auto minmax(0, 1fr); }
  .feed-time { grid-column: 2; }
  .auth-gate { padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom)); }
  .auth-card { grid-template-columns: minmax(0, 1fr); max-width: 460px; max-height: calc(100dvh - 32px); overflow-y: auto; }
  .auth-form-panel { padding: 24px 18px; min-height: 0; }
  .compare-modal { padding: 12px; }
  .compare-modal-card { width: 100%; max-height: calc(100dvh - 24px); padding: 18px; }
  .mobile-nav { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); position: fixed; inset: auto 0 0; z-index: 25; padding: 8px max(8px, env(safe-area-inset-right)) calc(8px + env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left)); background: #fff; border-top: 1px solid var(--line); box-shadow: 0 -4px 20px rgba(0,0,0,.04); }
  .mobile-nav a, .mobile-nav button { display: grid; place-items: center; gap: 3px; padding: 7px 3px; font-size: 12px; line-height: 1.3; text-decoration: none; color: var(--champagne-64); border: 0; background: none; border-radius: 12px; }
  .mobile-nav [aria-current="page"] { background: #f4f4f5; color: #0a0a0a; font-weight: 600; }
  .mobile-nav b { font-size: 19px; font-weight: 500; }
  .mobile-module-dialog[open] { display: block; width: calc(100% - 24px); max-width: 540px; max-height: calc(85dvh - env(safe-area-inset-top)); margin: auto auto 0; padding: 20px 18px calc(20px + env(safe-area-inset-bottom)); border: 1px solid var(--line); border-radius: 22px 22px 0 0; color: var(--champagne); background: white; overflow-y: auto; }
  .mobile-module-dialog::backdrop { background: rgba(0,0,0,.35); }
  .mobile-module-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
  .mobile-module-head button { background: #f4f4f5; border: 0; border-radius: 12px; padding: 8px 14px; }
  .mobile-module-links { display: grid; grid-template-columns: minmax(0, 1fr); gap: 6px; }
  .mobile-module-links .nav-button { padding: 14px; }
  .panel, .hero-panel, .status-panel, .topbar, .mobile-nav, .select-panel { backdrop-filter: none; -webkit-backdrop-filter: none; }
  .pulse-dot, .hero-panel::before, .brand-sigil::before { animation: none; }
}
`;

export const mobileMarkup = `
<nav class="mobile-nav" aria-label="Navegação mobile">
  <a href="#dashboard"><b aria-hidden="true">⌂</b><span>Início</span></a>
  <a href="#motor"><b aria-hidden="true">≋</b><span>Simulador</span></a>
  <a href="#documentos"><b aria-hidden="true">▤</b><span>Documentos</span></a>
  <button type="button" data-mobile-menu aria-controls="mobile-module-dialog" aria-haspopup="dialog"><b aria-hidden="true">☰</b><span>Módulos</span></button>
</nav>
<dialog class="mobile-module-dialog" id="mobile-module-dialog" aria-labelledby="mobile-module-title">
  <div class="mobile-module-head"><h2 id="mobile-module-title">Todos os módulos</h2><button type="button" id="mobile-module-close">Fechar</button></div>
  <nav class="mobile-module-links" aria-label="Todos os módulos"></nav>
</dialog>`;

export const mobileScript = `
function initializeMobileExperience() {
  const dialog = document.getElementById("mobile-module-dialog");
  const links = dialog.querySelector(".mobile-module-links");
  document.querySelectorAll(".side-rail .nav-stack > *").forEach(item => links.append(item.cloneNode(true)));
  document.querySelectorAll("[data-mobile-menu]").forEach(button => button.addEventListener("click", () => dialog.showModal()));
  document.getElementById("mobile-module-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientY < rect.top || event.clientX < rect.left || event.clientX > rect.right) dialog.close(); } });
  document.querySelectorAll(".mobile-nav a, .mobile-module-links a").forEach(link => link.addEventListener("click", event => {
    event.preventDefault(); dialog.close(); activateView(link.hash.slice(1), true);
  }));
  const labelComparisons = () => document.querySelectorAll(".comparison-table").forEach(table => {
    const headers = [...table.querySelectorAll(".comparison-row.header > *")].map(cell => cell.textContent.trim());
    table.querySelectorAll(".comparison-row:not(.header)").forEach(row => [...row.children].forEach((cell, index) => {
      if (headers[index]) cell.setAttribute("data-mobile-label", headers[index]);
    }));
  });
  labelComparisons();
  document.querySelectorAll(".comparison-table").forEach(table => new MutationObserver(labelComparisons).observe(table, {childList: true, subtree: true}));
  let installPrompt;
  const installButton = document.getElementById("mobile-install");
  window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); installPrompt = event; installButton.hidden = false; });
  installButton.addEventListener("click", async () => { if (installPrompt) { await installPrompt.prompt(); installPrompt = null; installButton.hidden = true; } });
  window.addEventListener("appinstalled", () => { installButton.hidden = true; });
  window.addEventListener("resize", () => { if (window.innerWidth > 1024 && dialog.open) dialog.close(); });
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
`;
