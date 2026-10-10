-- Allocate application IDs under the existing organization lock; reuse by email on reissue.
begin;
create or replace function public.ma_invite(p_org uuid,p_actor uuid,p_application text,p_email text,p_phone text,p_cohort text,p_hash text) returns jsonb language plpgsql security invoker set search_path=public as $$
declare c ma_candidates;i ma_invitations;begin
 if not exists(select 1 from ma_user_roles where org_id=p_org and user_id=p_actor and role='assessment_admin')then raise exception 'Forbidden';end if;
 if not exists(select 1 from ma_release_settings where assessment_id='ROLE-009-SA01' and enrollment_enabled)then raise exception 'Enrollment closed';end if;
 perform 1 from ma_organizations where id=p_org for update;
 if nullif(btrim(p_application),'') is null then
  select * into c from ma_candidates where org_id=p_org and lower(email)=lower(p_email) for update;
 else
  select * into c from ma_candidates where org_id=p_org and application_id=p_application for update;
 end if;
 if c.id is null then
  insert into ma_candidates(org_id,application_id,email,phone,cohort)values(p_org,coalesce(nullif(btrim(p_application),''),'MA-'||upper(gen_random_uuid()::text)),lower(p_email),p_phone,p_cohort)returning * into c;
 elsif lower(c.email)<>lower(p_email)or c.phone<>p_phone then raise exception 'Registered identity mismatch';end if;
 if exists(select 1 from ma_attempts where candidate_id=c.id and assessment_id='ROLE-009-SA01')then raise exception 'Existing attempt requires authorized retake';end if;
 update ma_invitations set revoked_at=now() where candidate_id=c.id and consumed_at is null and revoked_at is null;
 insert into ma_invitations(candidate_id,assessment_id,version,token_hash,expires_at)values(c.id,'ROLE-009-SA01','SA01-1.0-source',p_hash,now()+interval '7 days')returning * into i;
 insert into ma_audit_events(org_id,actor,action)values(p_org,p_actor,'invitation_created');
 return jsonb_build_object('id',i.id,'expires_at',i.expires_at,'application_id',c.application_id);
end $$;
revoke all on function public.ma_invite(uuid,uuid,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.ma_invite(uuid,uuid,text,text,text,text,text) to service_role;
commit;
