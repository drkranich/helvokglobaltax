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
.module-section-index a { padding: 10px 14px; border: 1px solid var(--line); border-radius: 12px; font-size: 14px; text-decoration: none; }
[data-module-section] { scroll-margin-top: 24px; }
@media (max-width: 1024px) {
  .module-tree > summary, .submodule-tree > summary, .hierarchy-link, .module-section-index a { min-height: 44px; }
  .module-section-index { display: grid; grid-template-columns: minmax(0, 1fr); }
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
    const summary = document.createElement("summary"); summary.textContent = link.querySelector("span").textContent;
    link.before(tree); tree.append(summary, link);
    link.querySelector("span").textContent = "Visão geral";
    const index = document.createElement("nav"); index.className = "module-section-index"; index.setAttribute("aria-label", "Seções de " + summary.textContent);
    const headings = [...view.querySelectorAll("h2")];
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
        moduleSections.set(viewId + "/" + destination.id, { module: summary.textContent, section: title.textContent, label: destination.label, headingId: heading.id });
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
function updateModuleNavigation(view, sectionId) {
  const key = view.id + (sectionId ? "/" + sectionId : "");
  const selected = moduleSections.get(key);
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
