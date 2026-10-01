export const moduleNavigationStyles = `
.module-tree { border-bottom: 1px solid var(--line); padding-bottom: 6px; }
.module-tree > summary, .submodule-tree > summary { cursor: pointer; padding: 12px; font-size: 14px; line-height: 1.4; overflow-wrap: anywhere; }
.module-tree > summary { font-weight: 600; }
.module-tree .nav-button { margin: 4px 0; }
.submodule-tree { margin: 4px 0 4px 10px; border-left: 1px solid var(--line); }
.submodule-tree > summary { color: var(--champagne-80); }
.hierarchy-link { display: block; margin: 3px 8px 3px 18px; padding: 9px 12px; border-radius: 10px; color: var(--champagne-64); font-size: 13px; line-height: 1.5; text-decoration: none; overflow-wrap: anywhere; }
.hierarchy-link:hover, .hierarchy-link[aria-current="location"] { background: #f4f4f5; color: #0a0a0a; }
.module-breadcrumb { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 4px 0; font-size: 13px; color: var(--champagne-64); }
.module-breadcrumb a { padding: 6px 0; text-decoration: underline; text-underline-offset: 3px; }
.module-breadcrumb [aria-current] { color: #0a0a0a; font-weight: 500; }
.module-section-index { display: flex; flex-wrap: wrap; gap: 8px; }
[data-page-hidden="true"] { display: none !important; }
.tab-panel.page-active-branch { display: block !important; }
.page-active-branch.work-grid, .page-active-branch.hero-grid, .page-active-branch.access-grid, .page-active-branch.members-workbench, .page-active-branch.catalog-workbench, .page-active-branch.tax-workbench { grid-template-columns: minmax(0, 1fr); }
.module-overview { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.module-overview a { display: grid; align-content: start; gap: 10px; padding: 24px; background: white; border: 1px solid var(--line); border-radius: 16px; text-decoration: none; }
.module-overview strong { font-size: 18px; }
.module-overview span { color: var(--champagne-64); font-size: 14px; }
.module-page-links { display: flex; flex-wrap: wrap; gap: 10px; }
.module-page-links a { padding: 10px 14px; border: 1px solid var(--line); border-radius: 12px; font-size: 14px; }
.module-page-links [aria-current] { background: #f4f4f5; color: #0a0a0a; }

.module-section-index a { padding: 10px 14px; border: 1px solid var(--line); border-radius: 12px; font-size: 14px; text-decoration: none; }
[data-module-section] { scroll-margin-top: 24px; }
@media (max-width: 1024px) {
  .module-tree > summary, .submodule-tree > summary, .hierarchy-link, .module-section-index a { min-height: 44px; }
  .module-section-index, .module-overview { display: grid; grid-template-columns: minmax(0, 1fr); }
  .module-breadcrumb { font-size: 13px; }
}
`;

export const moduleNavigationScript = `
const moduleSections = new Map();
function initializeModuleNavigation() {
  const nav = document.querySelector(".side-rail .nav-stack");
  const breadcrumb = document.createElement("nav");
  breadcrumb.className = "module-breadcrumb"; breadcrumb.id = "module-breadcrumb";
  breadcrumb.setAttribute("aria-label", "Caminho do módulo");
  document.querySelector(".topbar").after(breadcrumb);
  [...nav.querySelectorAll(".nav-button")].forEach(link => {
    const viewId = link.hash.slice(1), view = document.getElementById(viewId);
    if (!view) return;
    const tree = document.createElement("details"); tree.className = "module-tree"; tree.dataset.module = viewId;
    if (link.hasAttribute("data-platform-admin")) { tree.setAttribute("data-platform-admin", ""); tree.hidden = true; }
    const summary = document.createElement("summary"); summary.textContent = link.querySelector("span").textContent;
    link.before(tree); tree.append(summary, link);
    link.querySelector("span").textContent = "Visão geral";
    const index = document.createElement("nav"); index.className = "module-section-index"; index.setAttribute("aria-label", "Seções de " + summary.textContent);
    const headings = [...view.querySelectorAll("h2"), ...view.querySelectorAll(".feed h3")];
    headings.forEach((heading, position) => {
      const sectionId = viewId + "-section-" + (position + 1);
      heading.id = heading.id || sectionId; heading.setAttribute("data-module-section", "");
      const panel = heading.closest("article, aside, .panel, .status-panel") || heading.parentElement;
      const sub = document.createElement("details"); sub.className = "submodule-tree";
      const title = document.createElement("summary"); title.textContent = heading.textContent.trim(); sub.append(title);
      const destinations = [{ id: heading.id, label: "Visão da seção" }];
      panel.querySelectorAll("form[id], [id$='-list'], [id$='-table'], [id$='-result']").forEach(target => {
        if (target.closest(".app-view") !== view || target === heading) return;
        const label = target.tagName === "FORM" ? "Preencher e salvar" : /result$/.test(target.id) ? "Resultado" : /table$/.test(target.id) ? "Comparativo" : "Registros e ações";
        destinations.push({ id: target.id, label }); target.setAttribute("data-module-section", "");
      });
      destinations.forEach(destination => {
        moduleSections.set(viewId + "/" + destination.id, { module: summary.textContent, section: title.textContent, label: destination.label, headingId: heading.id, panel, targetId: destination.id });
        const item = document.createElement("a"); item.className = "hierarchy-link"; item.href = "#" + viewId + "/" + destination.id; item.textContent = destination.label; item.dataset.moduleTarget = ""; sub.append(item);
      });
      tree.append(sub);
      const shortcut = document.createElement("a"); shortcut.href = "#" + viewId + "/" + heading.id; shortcut.textContent = title.textContent; shortcut.dataset.moduleTarget = ""; index.append(shortcut);
    });
    if (index.children.length) (view.querySelector(".view-head") || view.firstElementChild).after(index);
  });
  document.addEventListener("click", event => {
    const link = event.target.closest && event.target.closest("[data-module-target]");
    if (!link || link.closest(".mobile-module-links")) return;
    event.preventDefault(); activateView(link.hash.slice(1), true);
  });
}
function openModuleTarget(targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const view = target.closest(".app-view");
  const direct = moduleSections.get(view.id + "/" + targetId);
  const selected = direct || [...moduleSections.values()].find(value => value.panel.contains(target));
  if (selected) activateView(view.id + "/" + (direct ? targetId : selected.headingId), true);
}
function renderModulePage(view, selected) {
  view.querySelectorAll("[data-page-hidden]").forEach(node => { node.removeAttribute("data-page-hidden"); node.inert = false; });
  view.querySelectorAll(".page-active-branch").forEach(node => node.classList.remove("page-active-branch"));
  let overview = view.querySelector(":scope > .module-overview");
  if (!overview) { overview = document.createElement("nav"); overview.className = "module-overview"; overview.setAttribute("aria-label", "Subpáginas do módulo"); view.append(overview); }
  let pageLinks = view.querySelector(":scope > .module-page-links");
  if (!pageLinks) { pageLinks = document.createElement("nav"); pageLinks.className = "module-page-links"; pageLinks.setAttribute("aria-label", "Páginas desta seção"); view.append(pageLinks); }
  const hide = node => { node.setAttribute("data-page-hidden", "true"); node.inert = true; };
  const sections = [...moduleSections.entries()].filter(([key, value]) => key.startsWith(view.id + "/") && key.endsWith("/" + value.headingId));
  if (!selected) {
    [...view.children].forEach(node => { if (!node.classList.contains("view-head") && node !== overview) hide(node); });
    overview.replaceChildren();
    sections.forEach(([key, value]) => {
      const card = document.createElement("a"); card.href = "#" + key; card.dataset.moduleTarget = "";
      const title = document.createElement("strong"); title.textContent = value.section;
      const label = document.createElement("span"); label.textContent = "Abrir página →"; card.append(title, label); overview.append(card);
    });
    return;
  }
  hide(overview);
  const panel = selected.panel;
  let branch = panel;
  while (branch && branch !== view) {
    branch.classList.add("page-active-branch");
    const parent = branch.parentElement;
    [...parent.children].forEach(sibling => {
      if (sibling !== branch && !(parent === view && (sibling.classList.contains("view-head") || sibling === pageLinks))) hide(sibling);
    });
    branch = parent;
  }
  const destination = document.getElementById(selected.targetId);
  if (selected.targetId !== selected.headingId && destination && panel.contains(destination)) {
    panel.querySelectorAll("form[id], [id$='-list'], [id$='-table'], [id$='-result']").forEach(sibling => {
      if (sibling !== destination && !sibling.contains(destination) && !destination.contains(sibling)) hide(sibling);
    });
  }
  pageLinks.replaceChildren();
  const back = document.createElement("a"); back.href = "#" + view.id; back.textContent = "← " + (view.getAttribute("aria-label") || "Módulo"); back.dataset.moduleTarget = ""; pageLinks.append(back);
  [...moduleSections.entries()].filter(([key, value]) => key.startsWith(view.id + "/") && value.headingId === selected.headingId).forEach(([key, value]) => {
    const link = document.createElement("a"); link.href = "#" + key; link.textContent = value.label; link.dataset.moduleTarget = "";
    if (value.targetId === selected.targetId) link.setAttribute("aria-current", "page"); pageLinks.append(link);
  });
}
function updateModuleNavigation(view, sectionId) {
  const key = view.id + (sectionId ? "/" + sectionId : "");
  const selected = moduleSections.get(key);
  renderModulePage(view, selected);
  document.querySelectorAll(".module-tree").forEach(tree => { if (tree.dataset.module === view.id) tree.open = true; });
  document.querySelectorAll(".hierarchy-link").forEach(link => {
    if (link.hash === "#" + key) { link.setAttribute("aria-current", "location"); link.closest(".submodule-tree").open = true; }
    else link.removeAttribute("aria-current");
  });
  const breadcrumb = document.getElementById("module-breadcrumb"); if (!breadcrumb) return;
  breadcrumb.replaceChildren();
  const module = document.createElement("a"); module.href = "#" + view.id; module.dataset.moduleTarget = ""; module.textContent = view.getAttribute("aria-label") || view.id; breadcrumb.append(module);
  if (selected) {
    breadcrumb.append(document.createTextNode(" / "));
    const section = document.createElement("a"); section.href = "#" + view.id + "/" + selected.headingId; section.dataset.moduleTarget = ""; section.textContent = selected.section; breadcrumb.append(section, document.createTextNode(" / "));
    const leaf = document.createElement("span"); leaf.textContent = selected.label; leaf.setAttribute("aria-current", "location"); breadcrumb.append(leaf);
  } else module.setAttribute("aria-current", "page");
}
`;
