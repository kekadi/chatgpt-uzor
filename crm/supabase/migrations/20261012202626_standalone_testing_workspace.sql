-- Isolated synthetic-only test persistence; existing assessment tables are untouched.
begin;
create table public.crm_testing_workspaces (
 workspace_key text primary key, revision bigint not null default 0 check(revision>=0),
 state jsonb not null check(jsonb_typeof(state)='object' and state->>'schemaVersion'='1'),
 updated_at timestamptz not null default now(),
 check(octet_length(state::text)<=500000)
);
alter table public.crm_testing_workspaces enable row level security;
revoke all on public.crm_testing_workspaces from public,anon,authenticated;
grant select,insert,update on public.crm_testing_workspaces to service_role;
create table public.crm_testing_revisions (
 workspace_key text not null references public.crm_testing_workspaces(workspace_key),
 revision bigint not null, saved_at timestamptz not null default now(), primary key(workspace_key,revision)
);
alter table public.crm_testing_revisions enable row level security;
revoke all on public.crm_testing_revisions from public,anon,authenticated;
grant select,insert on public.crm_testing_revisions to service_role;
create function public.crm_write_testing_snapshot(p_workspace text,p_revision bigint,p_state jsonb)
 returns jsonb language plpgsql security invoker set search_path='' as $$
 declare saved public.crm_testing_workspaces;
 begin
 update public.crm_testing_workspaces set state=p_state,revision=revision+1,updated_at=now()
 where workspace_key=p_workspace and revision=p_revision returning * into saved;
 if saved.workspace_key is null then raise exception 'Testing revision conflict' using errcode='40001';end if;
 insert into public.crm_testing_revisions(workspace_key,revision) values(saved.workspace_key,saved.revision);
 return jsonb_build_object('revision',saved.revision,'state',saved.state,'updated_at',saved.updated_at);
 end $$;
revoke all on function public.crm_write_testing_snapshot(text,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.crm_write_testing_snapshot(text,bigint,jsonb) to service_role;
commit;
