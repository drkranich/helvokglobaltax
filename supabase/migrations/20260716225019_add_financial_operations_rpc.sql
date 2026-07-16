begin;

create or replace function core.financial_entity_table(p_entity text)
returns text
language plpgsql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
begin
  case lower(coalesce(p_entity, ''))
    when 'accounts' then return 'financial_accounts';
    when 'financial_accounts' then return 'financial_accounts';
    when 'entries' then return 'financial_entries';
    when 'financial_entries' then return 'financial_entries';
    when 'cost_centers' then return 'cost_centers';
    when 'projects' then return 'projects';
    when 'budgets' then return 'budgets';
    when 'forecasts' then return 'forecasts';
    when 'investments' then return 'investments';
    when 'pricing_models' then return 'pricing_models';
    when 'product_costs' then return 'product_costs';
    when 'logistics_costs' then return 'logistics_costs';
    when 'tax_costs' then return 'tax_costs';
    when 'channel_costs' then return 'channel_costs';
    when 'cash_flow_periods' then return 'cash_flow_periods';
    when 'financial_reports' then return 'financial_reports';
    when 'spreadsheet_exports' then return 'spreadsheet_exports';
    else
      raise exception 'unsupported financial entity: %', p_entity using errcode = '22023';
  end case;
end;
$$;

create or replace function core.list_financial_records_as_admin(p_tenant_id uuid, p_entity text, p_limit integer default 100)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
declare
  v_table text := core.financial_entity_table(p_entity);
  v_records jsonb;
begin
  execute format(
    'select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), ''[]''::jsonb)
     from (select * from core.%I where tenant_id = $1 order by created_at desc limit $2) as x',
    v_table
  )
  using p_tenant_id, greatest(1, least(coalesce(p_limit, 100), 500))
  into v_records;

  return v_records;
end;
$$;

create or replace function core.list_financial_records_as_current_user(p_tenant_id uuid, p_entity text, p_limit integer default 100)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, core, auth, pg_temp
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'authenticated user required' using errcode = '28000';
  end if;

  if not (
    core.user_has_permission(p_tenant_id, 'financial.read')
    or core.user_has_permission(p_tenant_id, 'financial.manage')
  ) then
    raise exception 'financial.read permission required' using errcode = '42501';
  end if;

  return core.list_financial_records_as_admin(p_tenant_id, p_entity, p_limit);
end;
$$;

create or replace function core.upsert_financial_record(payload jsonb, p_actor_type text, p_actor_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, pg_temp
as $$
declare
  v_tenant_id uuid := (payload->>'tenant_id')::uuid;
  v_entity text := lower(coalesce(payload->>'entity', payload->>'record_type', 'entries'));
  v_table text := core.financial_entity_table(v_entity);
  v_id uuid := nullif(payload->>'id', '')::uuid;
  v_before jsonb;
  v_record jsonb;
  v_event_type text;
begin
  if v_tenant_id is null then
    raise exception 'tenant_id is required' using errcode = '22023';
  end if;

  if v_id is not null then
    execute format('select to_jsonb(x) from core.%I as x where x.tenant_id = $1 and x.id = $2', v_table)
    using v_tenant_id, v_id
    into v_before;
  end if;

  if v_table = 'financial_accounts' then
    insert into core.financial_accounts (id, tenant_id, code, name, account_type, currency_code, status, metadata)
    values (
      coalesce(v_id, gen_random_uuid()),
      v_tenant_id,
      upper(coalesce(nullif(payload->>'code', ''), 'FIN-' || substr(gen_random_uuid()::text, 1, 8))),
      coalesce(nullif(payload->>'name', ''), 'Conta financeira'),
      coalesce(nullif(payload->>'account_type', ''), 'expense'),
      upper(coalesce(nullif(payload->>'currency_code', ''), 'BRL')),
      coalesce(nullif(payload->>'status', ''), 'active'),
      coalesce(payload->'metadata', '{}'::jsonb)
    )
    on conflict (tenant_id, code) do update set
      name = excluded.name,
      account_type = excluded.account_type,
      currency_code = excluded.currency_code,
      status = excluded.status,
      metadata = excluded.metadata
    returning to_jsonb(financial_accounts.*) into v_record;
  elsif v_table = 'cost_centers' then
    insert into core.cost_centers (id, tenant_id, code, name, allocation_method, status, metadata)
    values (
      coalesce(v_id, gen_random_uuid()),
      v_tenant_id,
      upper(coalesce(nullif(payload->>'code', ''), 'CC-' || substr(gen_random_uuid()::text, 1, 8))),
      coalesce(nullif(payload->>'name', ''), 'Centro de custo'),
      coalesce(nullif(payload->>'allocation_method', ''), 'value'),
      coalesce(nullif(payload->>'status', ''), 'active'),
      coalesce(payload->'metadata', '{}'::jsonb)
    )
    on conflict (tenant_id, code) do update set
      name = excluded.name,
      allocation_method = excluded.allocation_method,
      status = excluded.status,
      metadata = excluded.metadata
    returning to_jsonb(cost_centers.*) into v_record;
  elsif v_table = 'projects' then
    insert into core.projects (id, tenant_id, code, name, country_code, channel, status, starts_on, ends_on, metadata)
    values (
      coalesce(v_id, gen_random_uuid()),
      v_tenant_id,
      upper(coalesce(nullif(payload->>'code', ''), 'PRJ-' || substr(gen_random_uuid()::text, 1, 8))),
      coalesce(nullif(payload->>'name', ''), 'Projeto financeiro'),
      nullif(upper(coalesce(payload->>'country_code', '')), ''),
      nullif(payload->>'channel', ''),
      coalesce(nullif(payload->>'status', ''), 'active'),
      nullif(payload->>'starts_on', '')::date,
      nullif(payload->>'ends_on', '')::date,
      coalesce(payload->'metadata', '{}'::jsonb)
    )
    on conflict (tenant_id, code) do update set
      name = excluded.name,
      country_code = excluded.country_code,
      channel = excluded.channel,
      status = excluded.status,
      starts_on = excluded.starts_on,
      ends_on = excluded.ends_on,
      metadata = excluded.metadata
    returning to_jsonb(projects.*) into v_record;
  elsif v_table = 'financial_entries' then
    insert into core.financial_entries (
      id, tenant_id, project_id, cost_center_id, account_id, category, nature, currency_code, amount,
      competence_date, payment_date, status, source_type, country_code, channel, tags, notes,
      calculation_memory, metadata, created_by_user_id
    )
    values (
      coalesce(v_id, gen_random_uuid()),
      v_tenant_id,
      nullif(payload->>'project_id', '')::uuid,
      nullif(payload->>'cost_center_id', '')::uuid,
      nullif(payload->>'account_id', '')::uuid,
      coalesce(nullif(payload->>'category', ''), 'manual'),
      coalesce(nullif(payload->>'nature', ''), 'expense'),
      upper(coalesce(nullif(payload->>'currency_code', ''), 'BRL')),
      coalesce(nullif(payload->>'amount', '')::numeric, 0),
      coalesce(nullif(payload->>'competence_date', '')::date, current_date),
      nullif(payload->>'payment_date', '')::date,
      coalesce(nullif(payload->>'status', ''), 'draft'),
      coalesce(nullif(payload->>'source_type', ''), 'manual'),
      nullif(upper(coalesce(payload->>'country_code', '')), ''),
      nullif(payload->>'channel', ''),
      coalesce(array(select jsonb_array_elements_text(coalesce(payload->'tags', '[]'::jsonb))), '{}'),
      nullif(payload->>'notes', ''),
      coalesce(payload->'calculation_memory', '{}'::jsonb),
      coalesce(payload->'metadata', '{}'::jsonb),
      p_actor_id
    )
    on conflict (tenant_id, id) do update set
      project_id = excluded.project_id,
      cost_center_id = excluded.cost_center_id,
      account_id = excluded.account_id,
      category = excluded.category,
      nature = excluded.nature,
      currency_code = excluded.currency_code,
      amount = excluded.amount,
      competence_date = excluded.competence_date,
      payment_date = excluded.payment_date,
      status = excluded.status,
      source_type = excluded.source_type,
      country_code = excluded.country_code,
      channel = excluded.channel,
      tags = excluded.tags,
      notes = excluded.notes,
      calculation_memory = excluded.calculation_memory,
      metadata = excluded.metadata
    returning to_jsonb(financial_entries.*) into v_record;
  elsif v_table = 'budgets' then
    insert into core.budgets (id, tenant_id, project_id, name, currency_code, period_start, period_end, status, metadata)
    values (
      coalesce(v_id, gen_random_uuid()),
      v_tenant_id,
      nullif(payload->>'project_id', '')::uuid,
      coalesce(nullif(payload->>'name', ''), 'Orçamento financeiro'),
      upper(coalesce(nullif(payload->>'currency_code', ''), 'BRL')),
      coalesce(nullif(payload->>'period_start', '')::date, date_trunc('month', current_date)::date),
      coalesce(nullif(payload->>'period_end', '')::date, (date_trunc('month', current_date) + interval '1 year - 1 day')::date),
      coalesce(nullif(payload->>'status', ''), 'draft'),
      coalesce(payload->'metadata', '{}'::jsonb)
    )
    returning to_jsonb(budgets.*) into v_record;
  elsif v_table = 'forecasts' then
    insert into core.forecasts (id, tenant_id, project_id, name, forecast_type, currency_code, assumptions, status)
    values (
      coalesce(v_id, gen_random_uuid()), v_tenant_id, nullif(payload->>'project_id', '')::uuid,
      coalesce(nullif(payload->>'name', ''), 'Forecast financeiro'),
      coalesce(nullif(payload->>'forecast_type', ''), 'financial'),
      upper(coalesce(nullif(payload->>'currency_code', ''), 'BRL')),
      coalesce(payload->'assumptions', '{}'::jsonb),
      coalesce(nullif(payload->>'status', ''), 'draft')
    )
    returning to_jsonb(forecasts.*) into v_record;
  elsif v_table = 'investments' then
    insert into core.investments (id, tenant_id, project_id, name, currency_code, initial_amount, working_capital, financing_terms, depreciation_policy, status, calculation_memory)
    values (
      coalesce(v_id, gen_random_uuid()), v_tenant_id, nullif(payload->>'project_id', '')::uuid,
      coalesce(nullif(payload->>'name', ''), 'Investimento'),
      upper(coalesce(nullif(payload->>'currency_code', ''), 'BRL')),
      coalesce(nullif(payload->>'initial_amount', '')::numeric, 0),
      coalesce(nullif(payload->>'working_capital', '')::numeric, 0),
      coalesce(payload->'financing_terms', '{}'::jsonb),
      coalesce(payload->'depreciation_policy', '{}'::jsonb),
      coalesce(nullif(payload->>'status', ''), 'planned'),
      coalesce(payload->'calculation_memory', '{}'::jsonb)
    )
    returning to_jsonb(investments.*) into v_record;
  elsif v_table = 'pricing_models' then
    insert into core.pricing_models (id, tenant_id, name, model_type, currency_code, parameters, status, calculation_memory)
    values (
      coalesce(v_id, gen_random_uuid()), v_tenant_id,
      coalesce(nullif(payload->>'name', ''), 'Modelo de preço'),
      coalesce(nullif(payload->>'model_type', ''), 'margin'),
      upper(coalesce(nullif(payload->>'currency_code', ''), 'BRL')),
      coalesce(payload->'parameters', '{}'::jsonb),
      coalesce(nullif(payload->>'status', ''), 'active'),
      coalesce(payload->'calculation_memory', '{}'::jsonb)
    )
    returning to_jsonb(pricing_models.*) into v_record;
  elsif v_table = 'product_costs' then
    insert into core.product_costs (id, tenant_id, product_id, project_id, cost_type, allocation_method, currency_code, amount, valid_from, valid_to, source_type, metadata)
    values (
      coalesce(v_id, gen_random_uuid()), v_tenant_id, nullif(payload->>'product_id', '')::uuid, nullif(payload->>'project_id', '')::uuid,
      coalesce(nullif(payload->>'cost_type', ''), 'unit'), coalesce(nullif(payload->>'allocation_method', ''), 'quantity'),
      upper(coalesce(nullif(payload->>'currency_code', ''), 'BRL')),
      coalesce(nullif(payload->>'amount', '')::numeric, 0),
      coalesce(nullif(payload->>'valid_from', '')::date, current_date), nullif(payload->>'valid_to', '')::date,
      coalesce(nullif(payload->>'source_type', ''), 'manual'), coalesce(payload->'metadata', '{}'::jsonb)
    )
    returning to_jsonb(product_costs.*) into v_record;
  elsif v_table = 'logistics_costs' then
    insert into core.logistics_costs (id, tenant_id, project_id, country_code, channel, cost_type, allocation_method, currency_code, amount, metadata)
    values (
      coalesce(v_id, gen_random_uuid()), v_tenant_id, nullif(payload->>'project_id', '')::uuid,
      nullif(upper(coalesce(payload->>'country_code', '')), ''), nullif(payload->>'channel', ''),
      coalesce(nullif(payload->>'cost_type', ''), 'freight'), coalesce(nullif(payload->>'allocation_method', ''), 'value'),
      upper(coalesce(nullif(payload->>'currency_code', ''), 'BRL')), coalesce(nullif(payload->>'amount', '')::numeric, 0),
      coalesce(payload->'metadata', '{}'::jsonb)
    )
    returning to_jsonb(logistics_costs.*) into v_record;
  elsif v_table = 'tax_costs' then
    insert into core.tax_costs (id, tenant_id, project_id, product_id, country_code, jurisdiction_path, source_engine, source_simulation, currency_code, amount, provision_status)
    values (
      coalesce(v_id, gen_random_uuid()), v_tenant_id, nullif(payload->>'project_id', '')::uuid, nullif(payload->>'product_id', '')::uuid,
      nullif(upper(coalesce(payload->>'country_code', '')), ''),
      coalesce(array(select jsonb_array_elements_text(coalesce(payload->'jurisdiction_path', '[]'::jsonb))), '{}'),
      coalesce(nullif(payload->>'source_engine', ''), 'helvok-tax-engine'),
      coalesce(payload->'source_simulation', '{}'::jsonb),
      upper(coalesce(nullif(payload->>'currency_code', ''), 'BRL')),
      coalesce(nullif(payload->>'amount', '')::numeric, 0),
      coalesce(nullif(payload->>'provision_status', ''), 'estimated')
    )
    returning to_jsonb(tax_costs.*) into v_record;
  elsif v_table = 'channel_costs' then
    insert into core.channel_costs (id, tenant_id, channel, country_code, cost_type, rate, fixed_amount, currency_code, metadata)
    values (
      coalesce(v_id, gen_random_uuid()), v_tenant_id,
      coalesce(nullif(payload->>'channel', ''), 'marketplace'),
      nullif(upper(coalesce(payload->>'country_code', '')), ''),
      coalesce(nullif(payload->>'cost_type', ''), 'commission'),
      nullif(payload->>'rate', '')::numeric,
      coalesce(nullif(payload->>'fixed_amount', '')::numeric, 0),
      upper(coalesce(nullif(payload->>'currency_code', ''), 'BRL')),
      coalesce(payload->'metadata', '{}'::jsonb)
    )
    returning to_jsonb(channel_costs.*) into v_record;
  elsif v_table = 'cash_flow_periods' then
    insert into core.cash_flow_periods (id, tenant_id, project_id, period_start, period_end, currency_code, planned_inflow, planned_outflow, actual_inflow, actual_outflow, calculation_memory)
    values (
      coalesce(v_id, gen_random_uuid()), v_tenant_id, nullif(payload->>'project_id', '')::uuid,
      coalesce(nullif(payload->>'period_start', '')::date, date_trunc('month', current_date)::date),
      coalesce(nullif(payload->>'period_end', '')::date, (date_trunc('month', current_date) + interval '1 month - 1 day')::date),
      upper(coalesce(nullif(payload->>'currency_code', ''), 'BRL')),
      coalesce(nullif(payload->>'planned_inflow', '')::numeric, 0),
      coalesce(nullif(payload->>'planned_outflow', '')::numeric, 0),
      coalesce(nullif(payload->>'actual_inflow', '')::numeric, 0),
      coalesce(nullif(payload->>'actual_outflow', '')::numeric, 0),
      coalesce(payload->'calculation_memory', '{}'::jsonb)
    )
    returning to_jsonb(cash_flow_periods.*) into v_record;
  elsif v_table = 'financial_reports' then
    insert into core.financial_reports (id, tenant_id, report_type, title, filters, result_snapshot, reproducibility_hash)
    values (
      coalesce(v_id, gen_random_uuid()), v_tenant_id,
      coalesce(nullif(payload->>'report_type', ''), 'dashboard'),
      coalesce(nullif(payload->>'title', ''), 'Relatório financeiro'),
      coalesce(payload->'filters', '{}'::jsonb),
      coalesce(payload->'result_snapshot', '{}'::jsonb),
      nullif(payload->>'reproducibility_hash', '')
    )
    returning to_jsonb(financial_reports.*) into v_record;
  elsif v_table = 'spreadsheet_exports' then
    insert into core.spreadsheet_exports (id, tenant_id, export_type, source_type, status, storage_key, filters, calculation_memory)
    values (
      coalesce(v_id, gen_random_uuid()), v_tenant_id,
      coalesce(nullif(payload->>'export_type', ''), 'xlsx'),
      coalesce(nullif(payload->>'source_type', ''), 'ledger'),
      coalesce(nullif(payload->>'status', ''), 'queued'),
      nullif(payload->>'storage_key', ''),
      coalesce(payload->'filters', '{}'::jsonb),
      coalesce(payload->'calculation_memory', '{}'::jsonb)
    )
    returning to_jsonb(spreadsheet_exports.*) into v_record;
  else
    raise exception 'unsupported financial entity for upsert: %', v_table using errcode = '22023';
  end if;

  v_event_type := case when v_before is null then 'financial.record.created' else 'financial.record.updated' end;

  insert into audit.audit_events (
    tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata
  )
  values (
    v_tenant_id, p_actor_type, p_actor_id, v_event_type, 'core.' || v_table,
    (v_record->>'id')::uuid, v_before, v_record, jsonb_build_object('source', 'financial_operations_rpc')
  );

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (v_tenant_id, v_event_type, 'core.' || v_table, (v_record->>'id')::uuid, v_record);

  return jsonb_build_object(
    'event_type', v_event_type,
    'entity', v_table,
    'record', v_record,
    'records', core.list_financial_records_as_admin(v_tenant_id, v_table, 100)
  );
end;
$$;

create or replace function core.upsert_financial_record_as_current_user(payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_tenant_id uuid := (payload->>'tenant_id')::uuid;
  v_actor_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'authenticated user required' using errcode = '28000';
  end if;

  if v_tenant_id is null then
    raise exception 'tenant_id is required' using errcode = '22023';
  end if;

  if not core.user_has_permission(v_tenant_id, 'financial.manage') then
    raise exception 'financial.manage permission required' using errcode = '42501';
  end if;

  select id into v_actor_id
  from core.users
  where auth_user_id = (select auth.uid())
  limit 1;

  return core.upsert_financial_record(payload, 'user', v_actor_id);
end;
$$;

create or replace function core.archive_financial_record_as_current_user(p_tenant_id uuid, p_entity text, p_record_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_table text := core.financial_entity_table(p_entity);
  v_before jsonb;
  v_record jsonb;
  v_actor_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'authenticated user required' using errcode = '28000';
  end if;

  if not core.user_has_permission(p_tenant_id, 'financial.manage') then
    raise exception 'financial.manage permission required' using errcode = '42501';
  end if;

  select id into v_actor_id from core.users where auth_user_id = (select auth.uid()) limit 1;

  execute format('select to_jsonb(x) from core.%I as x where x.tenant_id = $1 and x.id = $2', v_table)
  using p_tenant_id, p_record_id
  into v_before;

  if v_before is null then
    raise exception 'financial record not found' using errcode = 'P0002';
  end if;

  if v_table = 'financial_entries' then
    update core.financial_entries
    set status = 'cancelled',
        metadata = metadata || jsonb_build_object('archived_at', now(), 'archived_by_user_id', v_actor_id)
    where tenant_id = p_tenant_id and id = p_record_id and status in ('draft', 'forecast', 'cancelled')
    returning to_jsonb(financial_entries.*) into v_record;

    if v_record is null then
      raise exception 'posted or paid financial entries must be reversed, not archived' using errcode = 'P0001';
    end if;
  elsif v_table in ('financial_accounts', 'cost_centers', 'projects', 'budgets', 'forecasts', 'investments', 'pricing_models') then
    execute format(
      'update core.%I set status = ''archived'' where tenant_id = $1 and id = $2 returning to_jsonb(%I.*)',
      v_table,
      v_table
    )
    using p_tenant_id, p_record_id
    into v_record;
  elsif v_table = 'spreadsheet_exports' then
    update core.spreadsheet_exports
    set status = 'expired',
        calculation_memory = calculation_memory || jsonb_build_object('archived_at', now(), 'archived_by_user_id', v_actor_id)
    where tenant_id = p_tenant_id and id = p_record_id
    returning to_jsonb(spreadsheet_exports.*) into v_record;
  else
    execute format(
      'delete from core.%I where tenant_id = $1 and id = $2 returning to_jsonb(%I.*)',
      v_table,
      v_table
    )
    using p_tenant_id, p_record_id
    into v_record;
  end if;

  insert into audit.audit_events (
    tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata
  )
  values (
    p_tenant_id, 'user', v_actor_id, 'financial.record.archived', 'core.' || v_table,
    p_record_id, v_before, v_record, jsonb_build_object('source', 'financial_operations_rpc')
  );

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'financial.record.archived', 'core.' || v_table, p_record_id, v_record);

  return jsonb_build_object(
    'event_type', 'financial.record.archived',
    'entity', v_table,
    'record', v_record,
    'records', core.list_financial_records_as_admin(p_tenant_id, v_table, 100)
  );
end;
$$;

create or replace function core.reverse_financial_entry_as_current_user(p_tenant_id uuid, p_entry_id uuid, p_notes text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_before core.financial_entries%rowtype;
  v_reversal core.financial_entries%rowtype;
  v_actor_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'authenticated user required' using errcode = '28000';
  end if;

  if not core.user_has_permission(p_tenant_id, 'financial.manage') then
    raise exception 'financial.manage permission required' using errcode = '42501';
  end if;

  select id into v_actor_id from core.users where auth_user_id = (select auth.uid()) limit 1;

  select * into v_before
  from core.financial_entries
  where tenant_id = p_tenant_id and id = p_entry_id
  for update;

  if v_before.id is null then
    raise exception 'financial entry not found' using errcode = 'P0002';
  end if;

  if v_before.status = 'reversed' then
    raise exception 'financial entry already reversed' using errcode = 'P0001';
  end if;

  insert into core.financial_entries (
    tenant_id, organization_id, establishment_id, project_id, cost_center_id, account_id,
    category, nature, currency_code, amount, competence_date, payment_date, status, source_type,
    related_document_id, related_order_id, related_product_id, country_code, channel, tags, notes,
    reversal_entry_id, calculation_memory, metadata, created_by_user_id
  )
  values (
    v_before.tenant_id, v_before.organization_id, v_before.establishment_id, v_before.project_id, v_before.cost_center_id, v_before.account_id,
    v_before.category, 'reversal', v_before.currency_code, -v_before.amount, current_date, current_date, 'posted', 'manual',
    v_before.related_document_id, v_before.related_order_id, v_before.related_product_id, v_before.country_code, v_before.channel, v_before.tags,
    coalesce(p_notes, 'Estorno financeiro Helvok'),
    v_before.id,
    jsonb_build_object('reversed_entry_id', v_before.id, 'source_status', v_before.status),
    jsonb_build_object('source', 'financial_reversal'),
    v_actor_id
  )
  returning * into v_reversal;

  update core.financial_entries
  set status = 'reversed',
      reversal_entry_id = v_reversal.id,
      metadata = metadata || jsonb_build_object('reversed_at', now(), 'reversed_by_user_id', v_actor_id)
  where tenant_id = p_tenant_id and id = p_entry_id;

  insert into audit.audit_events (
    tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata
  )
  values (
    p_tenant_id, 'user', v_actor_id, 'financial.entry.reversed', 'core.financial_entry',
    p_entry_id, to_jsonb(v_before), to_jsonb(v_reversal), jsonb_build_object('source', 'financial_operations_rpc')
  );

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'financial.entry.reversed', 'core.financial_entry', p_entry_id, to_jsonb(v_reversal));

  return jsonb_build_object(
    'event_type', 'financial.entry.reversed',
    'entry', to_jsonb(v_before),
    'reversal', to_jsonb(v_reversal),
    'records', core.list_financial_records_as_admin(p_tenant_id, 'financial_entries', 100)
  );
end;
$$;

create or replace function public.helvok_current_list_financial_records(p_tenant_id uuid, p_entity text, p_limit integer default 100)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, core, pg_temp
as $$
  select core.list_financial_records_as_current_user(p_tenant_id, p_entity, p_limit)
$$;

create or replace function public.helvok_current_upsert_financial_record(payload jsonb)
returns jsonb
language sql
volatile
security invoker
set search_path = pg_catalog, core, pg_temp
as $$
  select core.upsert_financial_record_as_current_user(payload)
$$;

create or replace function public.helvok_current_archive_financial_record(p_tenant_id uuid, p_entity text, p_record_id uuid)
returns jsonb
language sql
volatile
security invoker
set search_path = pg_catalog, core, pg_temp
as $$
  select core.archive_financial_record_as_current_user(p_tenant_id, p_entity, p_record_id)
$$;

create or replace function public.helvok_current_reverse_financial_entry(p_tenant_id uuid, p_entry_id uuid, p_notes text default null)
returns jsonb
language sql
volatile
security invoker
set search_path = pg_catalog, core, pg_temp
as $$
  select core.reverse_financial_entry_as_current_user(p_tenant_id, p_entry_id, p_notes)
$$;

revoke execute on function core.financial_entity_table(text) from public, anon, authenticated;
revoke execute on function core.list_financial_records_as_admin(uuid, text, integer) from public, anon, authenticated;
revoke execute on function core.list_financial_records_as_current_user(uuid, text, integer) from public, anon;
revoke execute on function core.upsert_financial_record(jsonb, text, uuid) from public, anon, authenticated;
revoke execute on function core.upsert_financial_record_as_current_user(jsonb) from public, anon;
revoke execute on function core.archive_financial_record_as_current_user(uuid, text, uuid) from public, anon;
revoke execute on function core.reverse_financial_entry_as_current_user(uuid, uuid, text) from public, anon;
revoke all on function public.helvok_current_list_financial_records(uuid, text, integer) from public, anon;
revoke all on function public.helvok_current_upsert_financial_record(jsonb) from public, anon;
revoke all on function public.helvok_current_archive_financial_record(uuid, text, uuid) from public, anon;
revoke all on function public.helvok_current_reverse_financial_entry(uuid, uuid, text) from public, anon;

grant execute on function core.list_financial_records_as_admin(uuid, text, integer) to service_role;
grant execute on function core.list_financial_records_as_current_user(uuid, text, integer) to authenticated, service_role;
grant execute on function core.upsert_financial_record_as_current_user(jsonb) to authenticated, service_role;
grant execute on function core.archive_financial_record_as_current_user(uuid, text, uuid) to authenticated, service_role;
grant execute on function core.reverse_financial_entry_as_current_user(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.helvok_current_list_financial_records(uuid, text, integer) to authenticated, service_role;
grant execute on function public.helvok_current_upsert_financial_record(jsonb) to authenticated, service_role;
grant execute on function public.helvok_current_archive_financial_record(uuid, text, uuid) to authenticated, service_role;
grant execute on function public.helvok_current_reverse_financial_entry(uuid, uuid, text) to authenticated, service_role;

comment on function public.helvok_current_list_financial_records(uuid, text, integer) is
  'Authenticated tenant-scoped financial list endpoint for Helvok Financial Engine entities.';
comment on function public.helvok_current_upsert_financial_record(jsonb) is
  'Authenticated tenant-scoped create/update endpoint for Helvok Financial Engine entities.';
comment on function public.helvok_current_archive_financial_record(uuid, text, uuid) is
  'Authenticated archive endpoint. Financial entries are cancelled or reversed instead of deleted.';
comment on function public.helvok_current_reverse_financial_entry(uuid, uuid, text) is
  'Authenticated reversal endpoint for immutable financial ledger corrections.';

commit;
