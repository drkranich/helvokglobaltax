# Mobile e PWA

Até 1024 px, o painel usa navegação inferior (Início, Simulador, Documentos e Módulos), com todos os links do desktop disponíveis em um diálogo. O diálogo usa foco e Escape nativos do navegador. A partir de 1025 px, permanece o layout anterior.

Formulários e comparativos passam para uma coluna. Os comparativos recebem rótulos por célula, inclusive após atualização dos resultados. Os campos usam fonte de 16 px e controles de toque maiores. O viewport respeita as áreas seguras do aparelho e mantém o zoom acessível.

No mobile, efeitos de blur e animações decorativas foram reduzidos. O polling de status passa de 8 para 30 segundos e pausa quando a página está oculta ou sem conexão. A atualização decorativa de métricas a cada segundo é omitida no mobile.

## Instalação

O manifesto é servido em `/manifest.webmanifest`, com ícones PNG de 192 e 512 px. O service worker é servido em `/sw.js` e a aplicação instalada abre em `/app`.

No Android, o botão Instalar aparece quando o navegador oferece a instalação. No iOS, use Compartilhar e Adicionar à Tela de Início. A interface de instalação depende do navegador e de seus critérios.

As operações fiscais e financeiras exigem internet. O service worker oferece uma tela de conexão indisponível para navegações, sem armazenar respostas de API, credenciais ou operações. Não há envio automático de operações offline.

## Validação

`npm run typecheck`, `npm test` e `npm run deploy:dry-run` validam tipos, comportamento e empacotamento. Os testes de mobile usam DOM simulado para navegação, rótulos de comparação e parsing do script. Os testes de PWA verificam manifesto, ícones, exclusão de APIs do service worker e resposta offline.

A validação visual em aparelhos reais ainda é necessária: 320/360/390/430 px, orientação horizontal, teclado aberto, zoom acessível e modo instalado no Android/iOS. O ambiente de execução não conseguiu baixar o Chromium para uma inspeção visual automatizada.
