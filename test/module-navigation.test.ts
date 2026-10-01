import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";
import { renderDashboard } from "../src/frontend/dashboard";
import { moduleNavigationScript } from "../src/frontend/module-navigation";
import { mobileScript } from "../src/frontend/mobile";

const { JSDOM } = createRequire(import.meta.url)("jsdom");
describe("three-level module navigation", () => {
  it("builds real destinations for every module and keeps desktop/mobile in sync", () => {
    const dom = new JSDOM(renderDashboard(), {url:"https://helvok.test/app",runScripts:"outside-only"});
    const w = dom.window;
    const dialog = w.document.getElementById("mobile-module-dialog");
    dialog.showModal = () => {dialog.open = true;}; dialog.close = () => {dialog.open = false;};
    w.activateView = vi.fn();
    w.eval(moduleNavigationScript + "\ninitializeModuleNavigation();");
    w.eval(mobileScript + "\ninitializeMobileExperience();");
    const views = [...w.document.querySelectorAll(".app-view")];
    const trees = [...w.document.querySelectorAll(".side-rail .module-tree")];
    expect(trees.length).toBe(views.length);
    for (const tree of trees) {
      expect(tree.querySelectorAll(".submodule-tree").length).toBeGreaterThan(0);
      for (const link of tree.querySelectorAll(".hierarchy-link")) {
        const [module, target] = link.hash.slice(1).split("/");
        expect(w.document.getElementById(target).closest(".app-view").id).toBe(module);
      }
    }
    expect(w.document.querySelectorAll(".mobile-module-links .module-tree").length).toBe(trees.length);
    const link = w.document.querySelector('.mobile-module-links a[href="#financeiro/financial-record-form"]');
    expect(link).toBeTruthy(); link.click();
    expect(w.activateView).toHaveBeenCalledWith("financeiro/financial-record-form", true);
    w.updateModuleNavigation(w.document.getElementById("financeiro"), "financial-record-form");
    expect(w.document.getElementById("module-breadcrumb").textContent).toContain("Mesa operacional financeira");
    expect(w.document.getElementById("module-breadcrumb").textContent).toContain("Preencher e salvar");
    dom.window.close();
  });

  it("opens a deep link in the right view and preserves it on reload", () => {
    const html = renderDashboard();
    const dom = new JSDOM(html, {url:"https://helvok.test/app#clientes/party-form",runScripts:"outside-only"});
    const w = dom.window;
    w.matchMedia = () => ({matches:false}); w.scrollTo = vi.fn();
    w.HTMLElement.prototype.scrollIntoView = vi.fn();
    w.setText = (selector: string, text: string) => {w.document.querySelector(selector).textContent=text;};
    w.eval(moduleNavigationScript + "\ninitializeModuleNavigation();");
    const start = html.indexOf("function activateView(viewId, updateHash)");
    const end = html.indexOf('document.querySelectorAll(".nav-button").forEach((link) => {\n        link.addEventListener', start);
    w.eval(html.slice(start, end));
    w.activateView("clientes/party-form", true);
    expect(w.document.querySelector(".app-view.active").id).toBe("clientes");
    expect(w.location.hash).toBe("#clientes/party-form");
    expect(w.document.activeElement.id).toBe("party-form");
    expect(w.document.getElementById("operations-list").closest('[data-page-hidden="true"]')).toBeTruthy();
    expect(w.document.getElementById("parties-list").closest('[data-page-hidden="true"]')).toBeTruthy();
    expect(w.document.getElementById("party-form").closest('[data-page-hidden="true"]')).toBeNull();
    w.activateView(w.location.hash.slice(1), false);
    expect(w.document.querySelector(".app-view.active").id).toBe("clientes");
    expect(w.document.getElementById("module-breadcrumb").textContent).toContain("Novo cliente");
    w.activateView("clientes", true);
    expect(w.document.getElementById("party-form").closest('[data-page-hidden="true"]')).toBeTruthy();
    expect(w.document.querySelector("#clientes > .module-overview").children.length).toBeGreaterThan(0);
    expect(w.document.querySelector("#clientes > .module-overview").closest('[data-page-hidden="true"]')).toBeNull();
    w.activateView("motor/tax-simulator-form", true);
    expect(w.document.getElementById("tax-simulator-form").closest('[data-page-hidden="true"]')).toBeNull();
    w.openModuleTarget("tax-warnings");
    expect(w.document.getElementById("tax-warnings").closest('[data-page-hidden="true"]')).toBeNull();
    expect(w.document.getElementById("tax-simulator-form").closest('[data-page-hidden="true"]')).toBeTruthy();
    dom.window.close();
  });
});
