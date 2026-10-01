# Admin dos planos e Stripe Price IDs

## Implantação

1. Execute no SQL Editor do projeto Helvok (`jlvwudjgfzhhdgttrycj`) o arquivo `supabase/migrations/20261001181517_platform_plan_prices.sql`. Não executar em Care Kranich. Essa migração cria catálogo e auditoria com RLS e acesso de tabela exclusivo do service_role; não concede acesso a tenants. Aplicar uma vez; execução manual no SQL Editor não registra histórico no CLI.
2. Copie seu ID de usuário em Supabase > Authentication > Users. Configure esse UUID no secret do Worker:

```powershell
npx wrangler secret put HELVOK_PLATFORM_ADMIN_USER_IDS
```

Cole o UUID no prompt. Para mais de um administrador, use UUIDs separados por vírgula. Alternativa: app_metadata.helvok_platform_admin=true, configurado por operador autorizado no backend do Supabase. user_metadata, email, role owner e permissões de tenant NÃO concedem essa autorização. Não configure este marcador via formulário de perfil.

3. Configure uma chave Stripe restrita (rk_), com leitura de Prices. Teste em um sandbox separado antes de usar produção. A chave não deve ir para o código nem para o chat:

```powershell
npx wrangler secret put STRIPE_SECRET_KEY
```

O Worker também precisa dos secrets existentes SUPABASE_SERVICE_ROLE_KEY e da configuração pública Supabase. A chave service_role nunca é exposta ao navegador.

4. Atualize e publique:

```powershell
git pull --ff-only origin main
npm install --include=dev
npm run deploy -- --keep-vars
```

Entre novamente. O menu Admin · Planos e Stripe aparece apenas após verificação do usuário no Supabase. Edite os valores mensal/anual e respectivos Price IDs. Sem tabela, a tela informa erro e não simula persistência.

## Regras de edição

- Valores em reais no formulário (ex.: 149,00), convertidos para centavos. Os valores mensais e anuais são independentes; editar mensal não altera anual automaticamente.
- Cada ID precisa ser price_..., ativo, em BRL, com valor exato, recorrência month/year e interval_count=1, preço fixo per_unit e uso licensed. Preços mensal e anual vinculados devem pertencer ao mesmo produto e ao modo da chave configurada.
- Valores de preços Stripe são imutáveis: para mudar valor, crie novo preço no Stripe, informe o novo ID e salve. A aplicação apenas lê e valida Prices; não cria ou altera objetos Stripe.
- Campos vazios desvinculam o período. Sem chave Stripe, apenas valores sem IDs podem ser salvos. Isso permite preparar o catálogo antes da conexão.
- Edição usa revisão otimista. Duas abas não sobrescrevem silenciosamente uma à outra; 409 exige recarregar. Auditoria registra estado anterior, novo estado e ID do administrador na mesma transação via trigger.
- O catálogo público consulta o banco. Sem chave de banco configurada usa catálogo inicial; com banco configurado e falha de leitura retorna erro, evitando publicar silenciosamente preços antigos. A página atualiza os valores pelo catálogo.
- Assinaturas existentes não são migradas ou reajustadas por essa edição.

## Estado do faturamento

O vínculo e a validação dos Price IDs estão implementados. Não existe cobrança, checkout ou criação de assinatura neste fluxo. billing_enabled e limits_enforced continuam falsos.

A cobrança exige Checkout de assinatura e webhooks obrigatórios (customer.subscription.*, invoice.paid, invoice.payment_failed, checkout.session.completed e pagamentos assíncronos quando aplicáveis), com assinatura de webhook validada e processamento idempotente. Nunca liberar acesso pela página de sucesso. IDs de preço no checkout devem ser lidos do catálogo no servidor, não aceitos arbitrariamente do cliente.

Stripe Tax: antes de ativar cálculo automático, definir os países de venda e inscrições tributárias aplicáveis; não habilitado nesta alteração.

## Verificação

Testes automatizados: negar anônimo e tenant owner, ignorar user_metadata, validar centavos/IDs, validar preço e modo Stripe com respostas simuladas, persistir revisão e ator, rejeitar conflito concorrente. Sem acesso conectado ao banco Helvok ou chave Stripe real, migração e validação real dos Price IDs não foram executadas em produção.
