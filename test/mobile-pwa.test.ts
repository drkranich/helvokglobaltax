import { createRequire } from "node:module";
import { Script, runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import { renderDashboard } from "../src/frontend/dashboard";
import { mobileScript } from "../src/frontend/mobile";
import { serviceWorker } from "../src/frontend/pwa";

const { JSDOM } = createRequire(import.meta.url)("jsdom");
const env = { APP_NAME: "Helvok Tax", APP_ENV: "test", API_VERSION: "v1" };

describe("mobile navigation and PWA", () => {
  it("keeps every desktop module reachable from the mobile menu", () => {
    const dom = new JSDOM(renderDashboard(), { url: "https://helvok.test/app", runScripts: "outside-only" });
    const w = dom.window;
    const dialog = w.document.getElementById("mobile-module-dialog");
    dialog.showModal = vi.fn(() => { dialog.open = true; });
    dialog.close = vi.fn(() => { dialog.open = false; });
    w.activateView = vi.fn();
    w.eval(mobileScript + "\ninitializeMobileExperience();");
    const desktopLinks = [...w.document.querySelectorAll(".side-rail .nav-button")].map((link: any) => link.hash);
    const mobileLinks = [...w.document.querySelectorAll(".mobile-module-links a")].map((link: any) => link.hash);
    expect(mobileLinks).toEqual(desktopLinks);
    w.document.querySelector("[data-mobile-menu]").click();
    expect(dialog.open).toBe(true);
    w.document.querySelector('.mobile-module-links a[href="#financeiro"]').click();
    expect(w.activateView).toHaveBeenCalledWith("financeiro", true);
    expect(dialog.open).toBe(false);
    expect(w.document.querySelector(".comparison-row:not(.header) > :nth-child(2)").getAttribute("data-mobile-label")).toBe("Total cliente");
    dom.window.close();
  });

  it("retains accessible zoom and parses the generated browser script", () => {
    const html = renderDashboard();
    expect(html).not.toMatch(/user-scalable=no|maximum-scale=1/);
    expect(html).toContain("viewport-fit=cover");
    const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    expect(script).toBeTruthy();
    expect(() => new Script(script!)).not.toThrow();
  });

  it("serves a standalone manifest, genuine PNG icons and an updating worker", async () => {
    const app = createApp();
    const manifest = await app.request("/manifest.webmanifest", {}, env);
    expect(manifest.headers.get("content-type")).toBe("application/manifest+json");
    expect(await manifest.json()).toMatchObject({ display: "standalone", start_url: "/app" });
    for (const size of [192, 512]) {
      const icon = await app.request(`/pwa-icon-${size}.png`, {}, env);
      expect(icon.status).toBe(200);
      expect(icon.headers.get("content-type")).toBe("image/png");
      expect([...new Uint8Array(await icon.arrayBuffer()).slice(0, 8)]).toEqual([137,80,78,71,13,10,26,10]);
    }
    const sw = await app.request("/sw.js", {}, env);
    expect(sw.headers.get("cache-control")).toBe("no-cache");
    expect(sw.headers.get("content-type")).toBe("application/javascript");
  });

  it("never intercepts authenticated APIs, mutations or external resources", () => {
    const handlers: Record<string, (event: any) => void> = {};
    runInNewContext(serviceWorker, { self: { location: {origin:"https://helvok.test"}, addEventListener: (name: string, fn: any) => {handlers[name] = fn;} }, URL, Response });
    for (const request of [
      {url:"https://helvok.test/v1/me",method:"GET",mode:"cors"},
      {url:"https://helvok.test/app",method:"POST",mode:"navigate"},
      {url:"https://supabase.test/auth/v1/user",method:"GET",mode:"cors"},
    ]) {
      const respondWith = vi.fn(); handlers.fetch!({request,respondWith}); expect(respondWith).not.toHaveBeenCalled();
    }
  });

  it("returns an honest offline page when a navigation has no network", async () => {
    let handleFetch: any;
    runInNewContext(serviceWorker, { self: {location:{origin:"https://helvok.test"},addEventListener:(name: string, fn: any) => {if(name === "fetch")handleFetch=fn;}}, URL, Response, fetch:()=>Promise.reject(new Error("offline")) });
    let result: Promise<Response> | undefined;
    handleFetch({request:{url:"https://helvok.test/app",method:"GET",mode:"navigate"},respondWith:(response: Promise<Response>)=>{result=response;}});
    const response = await result!;
    expect(response.status).toBe(503);
    expect(await response.text()).toContain("Você está sem conexão");
  });
});
