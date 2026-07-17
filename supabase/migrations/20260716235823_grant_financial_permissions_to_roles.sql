begin;

insert into core.role_permissions (role_id, permission_id)
select r.id, p.id
from core.roles as r
join core.permissions as p
  on p.permission_key = 'financial.read'
where r.role_key in (
  'owner',
  'admin',
  'fiscal_manager',
  'accountant',
  'developer',
  'support',
  'auditor',
  'viewer'
)
on conflict do nothing;

insert into core.role_permissions (role_id, permission_id)
select r.id, p.id
from core.roles as r
join core.permissions as p
  on p.permission_key = 'financial.manage'
where r.role_key in (
  'owner',
  'admin',
  'fiscal_manager',
  'accountant'
)
on conflict do nothing;

commit;
