# Minha conta

Acessível pelo menu desktop e Módulos no mobile. Subpáginas: Trocar e-mail e Trocar senha.

- Requer senha atual, consulta o usuário autenticado ao Supabase e reautentica esse mesmo usuário. Um ID divergente interrompe a atualização.
- Usa somente a publishable key e o token do próprio usuário em PUT /auth/v1/user. Não altera dados de outros usuários, memberships, roles ou empresas.
- Senha nova: mínimo local de 8 caracteres, confirmação idêntica e diferente da atual. A política do Supabase pode exigir regras adicionais; rejeições são exibidas sem registrar senha.
- Após sucesso na troca de senha, apaga a sessão local e pede novo login. Campos de senha são limpos, nunca persistidos.
- E-mail: preserva o endereço atual enquanto o Supabase indicar confirmação pendente. Confirmação segura (atual + novo) depende da configuração Secure email change do projeto, que não foi modificada.
- Ao retornar de um link implicit com type=email_change, remove tokens da URL e sincroniza o usuário do Auth com o core existente. Não cria membership nem concede permissões novas.
- Configure o retorno https://SEU-DOMINIO/app na lista de URLs permitidas do Supabase. O mesmo retorno é usado nas solicitações de alteração de e-mail.
- Cada solicitação é limitada a uma execução simultânea por página. Limites reais de autenticação e envio de e-mails continuam a cargo do Supabase.

Validação: testes automatizados com respostas simuladas para alteração de e-mail pendente, proteção de identidade, confirmação de senha, troca de senha e limpeza do retorno. Não foi feita alteração real das credenciais de nenhum usuário nem teste de entrega de e-mail em produção.
