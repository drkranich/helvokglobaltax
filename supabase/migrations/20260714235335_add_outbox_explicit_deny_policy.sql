-- Keep outbox service-managed while satisfying the RLS advisor with an
-- explicit deny policy. Cloudflare Workers using service_role remain the
-- execution boundary for publishing and retrying outbox events.

create policy "outbox events are service managed"
on audit.outbox_events
for all
to authenticated
using (false)
with check (false);
