-- Explicit deny policy for membership invitations.
--
-- The table is intentionally managed through authenticated RPC workflows.
-- This policy documents and enforces that anon/authenticated clients cannot
-- access it directly even if grants change later.

begin;

create policy "membership invitations are managed through rpc"
on core.membership_invitations
for all
to anon, authenticated
using (false)
with check (false);

commit;
