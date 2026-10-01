begin;
create table public.helvok_platform_plans (
  id text primary key check (id in ('essential', 'professional', 'business')),
  monthly_price_cents integer not null check (monthly_price_cents between 100 and 100000000),
  annual_price_cents integer not null check (annual_price_cents between 100 and 100000000),
  stripe_monthly_price_id text check (stripe_monthly_price_id is null or stripe_monthly_price_id ~ '^price_[A-Za-z0-9]{3,200}$'),
  stripe_annual_price_id text check (stripe_annual_price_id is null or stripe_annual_price_id ~ '^price_[A-Za-z0-9]{3,200}$'),
  revision integer not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table public.helvok_platform_plans enable row level security;
revoke all on public.helvok_platform_plans from public, anon, authenticated;
grant select, insert, update on public.helvok_platform_plans to service_role;
insert into public.helvok_platform_plans (id, monthly_price_cents, annual_price_cents) values
('essential',14900,149000), ('professional',39900,399000), ('business',99900,999000);

create table public.helvok_platform_plan_audit (
  id uuid primary key default gen_random_uuid(),
  plan_id text not null references public.helvok_platform_plans(id),
  actor_user_id uuid references auth.users(id) on delete set null,
  previous_value jsonb not null, new_value jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.helvok_platform_plan_audit enable row level security;
revoke all on public.helvok_platform_plan_audit from public, anon, authenticated;
grant select, insert on public.helvok_platform_plan_audit to service_role;
create function public.helvok_audit_platform_plan_update() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.helvok_platform_plan_audit (plan_id, actor_user_id, previous_value, new_value)
  values (new.id, new.updated_by, to_jsonb(old), to_jsonb(new));
  return new;
end;
$$;
revoke all on function public.helvok_audit_platform_plan_update() from public, anon, authenticated;
grant execute on function public.helvok_audit_platform_plan_update() to service_role;
create trigger helvok_platform_plan_audit after update on public.helvok_platform_plans
for each row execute function public.helvok_audit_platform_plan_update();
commit;
