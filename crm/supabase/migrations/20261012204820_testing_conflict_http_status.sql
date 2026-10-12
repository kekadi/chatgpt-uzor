-- Return an explicit HTTP conflict without transport-level retries.
begin;
create or replace function public.crm_write_testing_snapshot(p_workspace text,p_revision bigint,p_state jsonb)
 returns jsonb language plpgsql security invoker set search_path='' as $$
 declare saved public.crm_testing_workspaces;
 begin
 update public.crm_testing_workspaces set state=p_state,revision=revision+1,updated_at=now()
 where workspace_key=p_workspace and revision=p_revision returning * into saved;
 if saved.workspace_key is null then raise sqlstate 'PT409' using message='Testing revision conflict';end if;
 insert into public.crm_testing_revisions(workspace_key,revision) values(saved.workspace_key,saved.revision);
 return jsonb_build_object('revision',saved.revision,'state',saved.state,'updated_at',saved.updated_at);
 end $$;
commit;
