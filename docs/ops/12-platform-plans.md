# Planos comerciais Helvok Tax

Catálogo inicial em BRL, por tenant, aprovado para definição de preços pelo proprietário em 01/10/2026.

| Plano | Mensal | Anual à vista | Empresas | Usuários ativos |
|---|---:|---:|---:|---:|
| Essencial | R$ 149 | R$ 1.490 | 1 | 3 |
| Profissional | R$ 399 | R$ 3.990 | 5 | 10 |
| Business | R$ 999 | R$ 9.990 | 20 | 30 |

Anual equivale a dez mensalidades: economia de duas mensalidades (16,67%). Empresas são organizações no mesmo tenant; o proprietário conta como usuário. Acima de Business: sob consulta.

Todos incluem os módulos disponíveis e o PWA; provedores fiscais, emissões, certificados e consultoria não estão incluídos. Recursos futuros não são vendidos como disponíveis. Valores iniciais devem ser reavaliados após dados reais de custo e utilização.

## Estado da implementação

`src/billing/plans.ts` define planos e valores iniciais. Após a migração, os valores e Price IDs são persistidos em helvok_platform_plans e editados exclusivamente pelo admin da plataforma. `/v1/plans` é um catálogo público sem dados de cliente. A página `#planos` apresenta os planos em desktop/mobile e tem subpáginas próprias.

Existe edição persistida do catálogo e validação de Stripe Price IDs. Não existe checkout, assinatura persistida, cobrança ou aplicação automática de limites. Os indicadores `billing_enabled` e `limits_enforced` são falsos. Não atribuir plano pago a tenants existentes nem bloquear clientes antes da implantação do faturamento.

Para ativar assinaturas: escolher e integrar o provedor de cobrança; definir assinatura e titular de faturamento no banco; validar webhooks com idempotência; aplicar limites no servidor nas rotas de escrita; contar memberships ativos distintos (não roles) e organizações; preservar dados em downgrade; permitir cancelamento e exportação. Nunca autorizar plano por localStorage, query string ou seleção no navegador.

## Conta e credenciais atuais

Existe recuperação de senha por e-mail na tela de login, seguida de definição da nova senha via Supabase Auth. A área autenticada Minha conta permite trocar senha e solicitar troca de e-mail, mediante confirmação da senha atual e da mesma identidade. O contato de suporte do tenant não altera a identidade de login. Minha conta atualiza exclusivamente o usuário autenticado via Supabase Auth, respeita confirmação de e-mail e nunca usa chaves administrativas no navegador.
