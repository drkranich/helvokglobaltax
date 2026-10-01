export const pwaManifest = {
  id: "/app",
  name: "Helvok Tax",
  short_name: "Helvok Tax",
  description: "Operações fiscais e financeiras no seu celular.",
  lang: "pt-BR",
  start_url: "/app",
  scope: "/",
  display: "standalone",
  background_color: "#fafafa",
  theme_color: "#fafafa",
  icons: [192, 512].flatMap(size => [
    { src: `/pwa-icon-${size}.png`, sizes: `${size}x${size}`, type: "image/png", purpose: "any" },
    { src: `/pwa-icon-${size}.png`, sizes: `${size}x${size}`, type: "image/png", purpose: "maskable" },
  ]),
  shortcuts: [
    { name: "Simulador", url: "/app#motor" },
    { name: "Documentos", url: "/app#documentos" },
    { name: "Financeiro", url: "/app#financeiro" },
  ],
};

// Online fiscal operations must never be replayed or cached on shared devices.
export const serviceWorker = `
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || event.request.mode !== "navigate" || url.origin !== self.location.origin || !["/", "/app"].includes(url.pathname)) return;
  event.respondWith(fetch(event.request).catch(() => new Response(
    '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Helvok Tax — sem conexão</title><style>body{margin:0;padding:32px;font:16px/1.6 system-ui;background:#fafafa;color:#0a0a0a}main{max-width:420px;margin:15vh auto}a{display:inline-block;padding:12px 20px;background:#0a0a0a;color:white;border-radius:12px;text-decoration:none}</style><main><h1>Você está sem conexão</h1><p>Conecte-se à internet para acessar suas operações fiscais e financeiras com segurança.</p><a href="/app">Tentar novamente</a></main></html>',
    {status: 503, headers: {"Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store"}}
  )));
});
`;
