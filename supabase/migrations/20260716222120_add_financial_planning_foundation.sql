begin;

create table core.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  code text not null,
  name text not null,
  account_type text not null check (account_type in ('asset', 'liability', 'equity', 'revenue', 'expense', 'cost', 'tax', 'cash', 'bank')),
  currency_code text not null default 'BRL' check (currency_code ~ '^[A-Z]{3}$'),
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table core.cost_centers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  parent_id uuid,
  code text not null,
  name text not null,
  allocation_method text not null default 'value' check (allocation_method in ('quantity', 'weight', 'volume', 'value', 'hours', 'percentage', 'custom')),
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code),
  unique (tenant_id, id),
  foreign key (tenant_id, parent_id) references core.cost_centers (tenant_id, id) on delete set null
);

create table core.projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  organization_id uuid,
  code text not null,
  name text not null,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  channel text,
  status text not null default 'active' check (status in ('planned', 'active', 'paused', 'closed', 'archived')),
  starts_on date,
  ends_on date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code),
  unique (tenant_id, id),
  foreign key (tenant_id, organization_id) references core.organizations (tenant_id, id) on delete set null
);

create table core.financial_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  organization_id uuid,
  establishment_id uuid,
  project_id uuid,
  cost_center_id uuid,
  account_id uuid,
  category text not null,
  nature text not null check (nature in ('revenue', 'expense', 'cost', 'tax', 'investment', 'financing', 'transfer', 'adjustment', 'reversal')),
  currency_code text not null default 'BRL' check (currency_code ~ '^[A-Z]{3}$'),
  amount numeric(18, 6) not null,
  competence_date date not null,
  payment_date date,
  status text not null default 'draft' check (status in ('draft', 'forecast', 'posted', 'paid', 'cancelled', 'reversed')),
  source_type text not null default 'manual' check (source_type in ('manual', 'invoice', 'fiscal_document', 'order', 'payment', 'bank', 'gateway', 'marketplace', 'erp', 'spreadsheet', 'csv', 'xlsx', 'ofx', 'xml', 'api', 'webhook', 'simulation')),
  related_document_id uuid,
  related_order_id uuid,
  related_product_id uuid,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  channel text,
  tags text[] not null default '{}',
  notes text,
  reversal_entry_id uuid,
  calculation_memory jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references core.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, organization_id) references core.organizations (tenant_id, id) on delete restrict,
  foreign key (tenant_id, establishment_id) references core.establishments (tenant_id, id) on delete restrict,
  foreign key (tenant_id, project_id) references core.projects (tenant_id, id) on delete set null,
  foreign key (tenant_id, cost_center_id) references core.cost_centers (tenant_id, id) on delete set null,
  foreign key (tenant_id, account_id) references core.financial_accounts (tenant_id, id) on delete restrict,
  foreign key (tenant_id, related_product_id) references core.catalog_items (tenant_id, id) on delete set null,
  foreign key (tenant_id, related_document_id) references core.fiscal_documents (tenant_id, id) on delete set null,
  foreign key (tenant_id, reversal_entry_id) references core.financial_entries (tenant_id, id) on delete restrict
);

create table core.budgets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  project_id uuid,
  name text not null,
  currency_code text not null default 'BRL' check (currency_code ~ '^[A-Z]{3}$'),
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'locked', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, project_id) references core.projects (tenant_id, id) on delete set null
);

create table core.budget_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  budget_id uuid not null,
  account_id uuid,
  cost_center_id uuid,
  category text not null,
  planned_amount numeric(18, 6) not null default 0,
  actual_amount numeric(18, 6) not null default 0,
  variance_amount numeric(18, 6) generated always as (actual_amount - planned_amount) stored,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, budget_id) references core.budgets (tenant_id, id) on delete cascade,
  foreign key (tenant_id, account_id) references core.financial_accounts (tenant_id, id) on delete set null,
  foreign key (tenant_id, cost_center_id) references core.cost_centers (tenant_id, id) on delete set null
);

create table core.forecasts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  project_id uuid,
  name text not null,
  forecast_type text not null default 'financial' check (forecast_type in ('financial', 'sales', 'cash_flow', 'pricing', 'investment')),
  currency_code text not null default 'BRL' check (currency_code ~ '^[A-Z]{3}$'),
  assumptions jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, project_id) references core.projects (tenant_id, id) on delete set null
);

create table core.forecast_scenarios (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  forecast_id uuid not null,
  scenario_key text not null check (scenario_key in ('conservative', 'base', 'aggressive', 'custom')),
  parameters jsonb not null default '{}'::jsonb,
  calculation_memory jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, forecast_id, scenario_key),
  foreign key (tenant_id, forecast_id) references core.forecasts (tenant_id, id) on delete cascade
);

create table core.investments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  project_id uuid,
  name text not null,
  currency_code text not null default 'BRL' check (currency_code ~ '^[A-Z]{3}$'),
  initial_amount numeric(18, 6) not null default 0,
  working_capital numeric(18, 6) not null default 0,
  financing_terms jsonb not null default '{}'::jsonb,
  depreciation_policy jsonb not null default '{}'::jsonb,
  status text not null default 'planned' check (status in ('planned', 'active', 'closed', 'archived')),
  calculation_memory jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, project_id) references core.projects (tenant_id, id) on delete set null
);

create table core.investment_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  investment_id uuid not null,
  event_type text not null check (event_type in ('initial', 'contribution', 'financing', 'interest', 'depreciation', 'amortization', 'working_capital', 'return', 'adjustment')),
  amount numeric(18, 6) not null default 0,
  event_date date not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, investment_id) references core.investments (tenant_id, id) on delete cascade
);

create table core.pricing_models (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  name text not null,
  model_type text not null default 'margin' check (model_type in ('minimum_price', 'markup', 'margin', 'channel', 'country', 'currency', 'b2b', 'b2c', 'promotion')),
  currency_code text not null default 'BRL' check (currency_code ~ '^[A-Z]{3}$'),
  parameters jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  calculation_memory jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id)
);

create table core.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  pricing_model_id uuid not null,
  rule_type text not null check (rule_type in ('markup', 'target_margin', 'channel_fee', 'tax_impact', 'freight_impact', 'fx_impact', 'promotion', 'customer_segment')),
  priority integer not null default 100,
  conditions jsonb not null default '{}'::jsonb,
  formula jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, pricing_model_id) references core.pricing_models (tenant_id, id) on delete cascade
);

create table core.product_costs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  product_id uuid,
  project_id uuid,
  cost_type text not null default 'unit' check (cost_type in ('unit', 'lot', 'sku', 'direct', 'indirect')),
  allocation_method text not null default 'quantity' check (allocation_method in ('quantity', 'weight', 'volume', 'value', 'hours', 'percentage', 'custom')),
  currency_code text not null default 'BRL' check (currency_code ~ '^[A-Z]{3}$'),
  amount numeric(18, 6) not null default 0,
  valid_from date not null default current_date,
  valid_to date,
  source_type text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, product_id) references core.catalog_items (tenant_id, id) on delete set null,
  foreign key (tenant_id, project_id) references core.projects (tenant_id, id) on delete set null
);

create table core.logistics_costs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  project_id uuid,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  channel text,
  cost_type text not null check (cost_type in ('freight', 'insurance', 'storage', 'last_mile', 'customs', 'handling', 'returns')),
  allocation_method text not null default 'value' check (allocation_method in ('quantity', 'weight', 'volume', 'value', 'hours', 'percentage', 'custom')),
  currency_code text not null default 'BRL' check (currency_code ~ '^[A-Z]{3}$'),
  amount numeric(18, 6) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, project_id) references core.projects (tenant_id, id) on delete set null
);

create table core.tax_costs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  project_id uuid,
  product_id uuid,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  jurisdiction_path text[] not null default '{}',
  source_engine text not null default 'helvok-tax-engine',
  source_simulation jsonb not null default '{}'::jsonb,
  currency_code text not null default 'BRL' check (currency_code ~ '^[A-Z]{3}$'),
  amount numeric(18, 6) not null default 0,
  provision_status text not null default 'estimated' check (provision_status in ('estimated', 'provisioned', 'posted', 'reversed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, project_id) references core.projects (tenant_id, id) on delete set null,
  foreign key (tenant_id, product_id) references core.catalog_items (tenant_id, id) on delete set null
);

create table core.channel_costs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  channel text not null,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  cost_type text not null check (cost_type in ('commission', 'payment_fee', 'marketing', 'subscription', 'fulfillment', 'refund', 'chargeback')),
  rate numeric(10, 6),
  fixed_amount numeric(18, 6) not null default 0,
  currency_code text not null default 'BRL' check (currency_code ~ '^[A-Z]{3}$'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table core.currency_rates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references core.tenants (id) on delete cascade,
  base_currency text not null check (base_currency ~ '^[A-Z]{3}$'),
  quote_currency text not null check (quote_currency ~ '^[A-Z]{3}$'),
  rate numeric(18, 8) not null check (rate > 0),
  source text not null,
  rate_date date not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, base_currency, quote_currency, source, rate_date)
);

create table core.cash_flow_periods (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  project_id uuid,
  period_start date not null,
  period_end date not null,
  currency_code text not null default 'BRL' check (currency_code ~ '^[A-Z]{3}$'),
  planned_inflow numeric(18, 6) not null default 0,
  planned_outflow numeric(18, 6) not null default 0,
  actual_inflow numeric(18, 6) not null default 0,
  actual_outflow numeric(18, 6) not null default 0,
  calculation_memory jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, project_id) references core.projects (tenant_id, id) on delete set null
);

create table core.financial_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  report_type text not null check (report_type in ('dashboard', 'statement', 'calculation_memory', 'project', 'channel', 'country', 'product', 'period')),
  title text not null,
  filters jsonb not null default '{}'::jsonb,
  result_snapshot jsonb not null default '{}'::jsonb,
  reproducibility_hash text,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table core.spreadsheet_exports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  export_type text not null check (export_type in ('xlsx', 'csv', 'pdf', 'dashboard')),
  source_type text not null check (source_type in ('ledger', 'budget', 'forecast', 'investment', 'pricing', 'cash_flow', 'report')),
  status text not null default 'queued' check (status in ('queued', 'processing', 'ready', 'failed', 'expired')),
  storage_key text,
  filters jsonb not null default '{}'::jsonb,
  calculation_memory jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function core.prevent_financial_entry_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'financial_entries cannot be deleted physically; create a reversal entry instead'
    using errcode = 'P0001';
end;
$$;

create trigger core_financial_entries_prevent_delete
before delete on core.financial_entries
for each row execute function core.prevent_financial_entry_delete();

create trigger core_financial_accounts_set_updated_at before update on core.financial_accounts for each row execute function core.set_updated_at();
create trigger core_cost_centers_set_updated_at before update on core.cost_centers for each row execute function core.set_updated_at();
create trigger core_projects_set_updated_at before update on core.projects for each row execute function core.set_updated_at();
create trigger core_financial_entries_set_updated_at before update on core.financial_entries for each row execute function core.set_updated_at();
create trigger core_budgets_set_updated_at before update on core.budgets for each row execute function core.set_updated_at();
create trigger core_budget_lines_set_updated_at before update on core.budget_lines for each row execute function core.set_updated_at();
create trigger core_forecasts_set_updated_at before update on core.forecasts for each row execute function core.set_updated_at();
create trigger core_forecast_scenarios_set_updated_at before update on core.forecast_scenarios for each row execute function core.set_updated_at();
create trigger core_investments_set_updated_at before update on core.investments for each row execute function core.set_updated_at();
create trigger core_pricing_models_set_updated_at before update on core.pricing_models for each row execute function core.set_updated_at();
create trigger core_pricing_rules_set_updated_at before update on core.pricing_rules for each row execute function core.set_updated_at();
create trigger core_product_costs_set_updated_at before update on core.product_costs for each row execute function core.set_updated_at();
create trigger core_logistics_costs_set_updated_at before update on core.logistics_costs for each row execute function core.set_updated_at();
create trigger core_tax_costs_set_updated_at before update on core.tax_costs for each row execute function core.set_updated_at();
create trigger core_channel_costs_set_updated_at before update on core.channel_costs for each row execute function core.set_updated_at();
create trigger core_cash_flow_periods_set_updated_at before update on core.cash_flow_periods for each row execute function core.set_updated_at();
create trigger core_spreadsheet_exports_set_updated_at before update on core.spreadsheet_exports for each row execute function core.set_updated_at();

create index core_financial_entries_tenant_dates_idx on core.financial_entries (tenant_id, competence_date, payment_date);
create index core_financial_entries_project_idx on core.financial_entries (tenant_id, project_id);
create index core_financial_entries_product_idx on core.financial_entries (tenant_id, related_product_id);
create index core_financial_entries_tags_gin_idx on core.financial_entries using gin (tags);
create index core_financial_entries_memory_gin_idx on core.financial_entries using gin (calculation_memory);
create index core_budget_lines_budget_idx on core.budget_lines (tenant_id, budget_id);
create index core_currency_rates_lookup_idx on core.currency_rates (base_currency, quote_currency, rate_date desc);

alter table core.financial_accounts enable row level security;
alter table core.cost_centers enable row level security;
alter table core.projects enable row level security;
alter table core.financial_entries enable row level security;
alter table core.budgets enable row level security;
alter table core.budget_lines enable row level security;
alter table core.forecasts enable row level security;
alter table core.forecast_scenarios enable row level security;
alter table core.investments enable row level security;
alter table core.investment_events enable row level security;
alter table core.pricing_models enable row level security;
alter table core.pricing_rules enable row level security;
alter table core.product_costs enable row level security;
alter table core.logistics_costs enable row level security;
alter table core.tax_costs enable row level security;
alter table core.channel_costs enable row level security;
alter table core.currency_rates enable row level security;
alter table core.cash_flow_periods enable row level security;
alter table core.financial_reports enable row level security;
alter table core.spreadsheet_exports enable row level security;

alter table core.financial_accounts force row level security;
alter table core.cost_centers force row level security;
alter table core.projects force row level security;
alter table core.financial_entries force row level security;
alter table core.budgets force row level security;
alter table core.budget_lines force row level security;
alter table core.forecasts force row level security;
alter table core.forecast_scenarios force row level security;
alter table core.investments force row level security;
alter table core.investment_events force row level security;
alter table core.pricing_models force row level security;
alter table core.pricing_rules force row level security;
alter table core.product_costs force row level security;
alter table core.logistics_costs force row level security;
alter table core.tax_costs force row level security;
alter table core.channel_costs force row level security;
alter table core.currency_rates force row level security;
alter table core.cash_flow_periods force row level security;
alter table core.financial_reports force row level security;
alter table core.spreadsheet_exports force row level security;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'financial_accounts','cost_centers','projects','financial_entries','budgets','budget_lines','forecasts','forecast_scenarios',
    'investments','investment_events','pricing_models','pricing_rules','product_costs','logistics_costs','tax_costs','channel_costs',
    'currency_rates','cash_flow_periods','financial_reports','spreadsheet_exports'
  ]
  loop
    execute format('create policy %I on core.%I for all to anon, authenticated using (false) with check (false)', v_table || '_private_to_rpc', v_table);
  end loop;
end $$;

grant select, insert, update on core.financial_accounts, core.cost_centers, core.projects, core.financial_entries, core.budgets, core.budget_lines,
  core.forecasts, core.forecast_scenarios, core.investments, core.investment_events, core.pricing_models, core.pricing_rules,
  core.product_costs, core.logistics_costs, core.tax_costs, core.channel_costs, core.currency_rates, core.cash_flow_periods,
  core.financial_reports, core.spreadsheet_exports to service_role;
grant delete on core.financial_accounts, core.cost_centers, core.projects, core.budgets, core.budget_lines, core.forecasts, core.forecast_scenarios,
  core.investments, core.investment_events, core.pricing_models, core.pricing_rules, core.product_costs, core.logistics_costs,
  core.tax_costs, core.channel_costs, core.currency_rates, core.cash_flow_periods, core.financial_reports, core.spreadsheet_exports to service_role;

insert into core.permissions (permission_key, resource, action, description)
values
  ('financial.read', 'financial', 'read', 'Read financial planning, ledger, reports, and scenarios.'),
  ('financial.manage', 'financial', 'manage', 'Manage financial planning, ledger, reports, and scenarios.')
on conflict (permission_key) do nothing;

comment on table core.financial_entries is
  'Immutable-by-policy tenant ledger for real and simulated financial entries. Corrections must use reversal entries.';
comment on table core.spreadsheet_exports is
  'Reproducible export requests for XLSX, CSV, PDF, dashboards, and calculation memories.';

commit;
