-- Invitation enrollment; additive migration, existing assessments remain untouched.
begin;
create table public.ma_release_settings(assessment_id text primary key references public.ma_assessments, enrollment_enabled boolean not null default false);
alter table public.ma_release_settings enable row level security;
revoke all on public.ma_release_settings from public,anon,authenticated;
grant select,insert,update on public.ma_release_settings to service_role;
insert into public.ma_release_settings select id,true from public.ma_assessments where id='ROLE-009-SA01';
create unique index ma_candidate_email on public.ma_candidates(org_id,lower(email));
create function public.ma_invite(p_org uuid,p_actor uuid,p_application text,p_email text,p_phone text,p_cohort text,p_hash text) returns jsonb language plpgsql security invoker set search_path=public as $$
declare c ma_candidates;i ma_invitations;begin
 if not exists(select 1 from ma_user_roles where org_id=p_org and user_id=p_actor and role='assessment_admin')then raise exception 'Forbidden';end if;
 if not exists(select 1 from ma_release_settings where assessment_id='ROLE-009-SA01' and enrollment_enabled)then raise exception 'Enrollment closed';end if;
 perform 1 from ma_organizations where id=p_org for update;
 select * into c from ma_candidates where org_id=p_org and application_id=p_application for update;
 if c.id is null then
  insert into ma_candidates(org_id,application_id,email,phone,cohort)values(p_org,p_application,lower(p_email),p_phone,p_cohort)returning * into c;
 elsif lower(c.email)<>lower(p_email)or c.phone<>p_phone then raise exception 'Registered identity mismatch';end if;
 if exists(select 1 from ma_attempts where candidate_id=c.id and assessment_id='ROLE-009-SA01')then raise exception 'Existing attempt requires authorized retake';end if;
 update ma_invitations set revoked_at=now() where candidate_id=c.id and consumed_at is null and revoked_at is null;
 insert into ma_invitations(candidate_id,assessment_id,version,token_hash,expires_at)values(c.id,'ROLE-009-SA01','SA01-1.0-source',p_hash,now()+interval '7 days')returning * into i;
 insert into ma_audit_events(org_id,actor,action)values(p_org,p_actor,'invitation_created');
 return jsonb_build_object('id',i.id,'expires_at',i.expires_at);
end $$;
create function public.ma_enroll(p_hash text,p_user uuid,p_email text,p_phone text,p_consent boolean) returns jsonb language plpgsql security invoker set search_path=public as $$
declare i ma_invitations;c ma_candidates;a ma_attempts;begin
 if p_consent is distinct from true then raise exception 'Consent required';end if;
 select * into i from ma_invitations where token_hash=p_hash for update;
 if i.id is null or i.revoked_at is not null then raise exception 'Invitation unavailable';end if;
 select * into c from ma_candidates where id=i.candidate_id for update;
 if lower(c.email)<>lower(p_email)or c.phone<>p_phone or (c.user_id is not null and c.user_id<>p_user)then raise exception 'Identity mismatch';end if;
 -- Identity and possession timestamps are verified by the Edge API via Auth getUser.
 -- This service-only RPC does not broaden service_role access to auth.users.
 select * into a from ma_attempts where candidate_id=c.id and assessment_id=i.assessment_id and version=i.version and attempt_number=i.attempt_number;
 if a.id is null and i.expires_at<=now()then raise exception 'Invitation expired';end if;
 update ma_candidates set user_id=p_user,consent_at=coalesce(consent_at,now())where id=c.id;
 if c.consent_at is null then insert into ma_audit_events(org_id,actor,action)values(c.org_id,p_user,'candidate_consent_and_identity_verified');end if;
 return jsonb_build_object('candidate_id',c.id,'attempt_id',a.id);
end $$;
create function public.ma_revoke_invitation(p_id uuid,p_actor uuid,p_org uuid) returns jsonb language plpgsql security invoker set search_path=public as $$
begin
 if not exists(select 1 from ma_user_roles where org_id=p_org and user_id=p_actor and role='assessment_admin')then raise exception 'Forbidden';end if;
 update ma_invitations set revoked_at=now()where id=p_id and consumed_at is null and candidate_id in(select id from ma_candidates where org_id=p_org);
 if not found then raise exception 'Invitation cannot be revoked';end if;
 insert into ma_audit_events(org_id,actor,action)values(p_org,p_actor,'invitation_revoked');
 return jsonb_build_object('revoked',true);
end $$;
-- Persist the fixed candidate form at start, preventing later edits from changing attempts.
create function public.ma_finish_expired(p_attempt uuid,p_user uuid,p_key uuid,p_score jsonb)returns jsonb language plpgsql security invoker set search_path=public as $$
declare a ma_attempts;c ma_candidates;begin
 select * into a from ma_attempts where id=p_attempt for update;
 select * into c from ma_candidates where id=a.candidate_id;
 if a.id is null or c.user_id is distinct from p_user then raise exception 'Forbidden';end if;
 if a.status in('submitted','completed')then return jsonb_build_object('id',a.id,'status',a.status,'submitted_at',a.submitted_at);end if;
 if a.status<>'in_progress' or a.deadline>now()then raise exception 'Deadline not reached';end if;
 update ma_attempts set status='submitted',score=p_score,submitted_at=now(),submission_key=p_key,revision=revision+1 where id=a.id;
 insert into ma_answers(attempt_id,item_id,response)select a.id,'ROLE-009-SA01-Q'||lpad(key,2,'0'),value from jsonb_each(a.answers);
 insert into ma_domain_scores(attempt_id,domain,earned,possible,details)select a.id,key,(value->>'earned')::numeric,(value->>'possible')::numeric,value from jsonb_each(p_score->'sections');
 insert into ma_audit_events(org_id,actor,action,attempt_id)values(c.org_id,p_user,'deadline_saved_answers_submitted',a.id);
 return jsonb_build_object('id',a.id,'status','submitted','submitted_at',now());
end $$;
revoke all on function public.ma_finish_expired(uuid,uuid,uuid,jsonb)from public,anon,authenticated;
grant execute on function public.ma_finish_expired(uuid,uuid,uuid,jsonb)to service_role;
create function public.ma_snapshot_attempt()returns trigger language plpgsql security invoker set search_path=public as $$
begin
 insert into ma_attempt_questions(attempt_id,item_id,version,snapshot)select new.id,q.item_id,q.version,q.candidate_payload from ma_question_versions q join ma_question_bank b on b.item_id=q.item_id where b.assessment_id=new.assessment_id and q.version=new.version;
 return new;
end $$;
create trigger ma_attempt_snapshot after insert on public.ma_attempts for each row execute function public.ma_snapshot_attempt();
revoke all on function public.ma_invite(uuid,uuid,text,text,text,text,text),public.ma_enroll(text,uuid,text,text,boolean),public.ma_revoke_invitation(uuid,uuid,uuid),public.ma_snapshot_attempt()from public,anon,authenticated;
grant execute on function public.ma_invite(uuid,uuid,text,text,text,text,text),public.ma_enroll(text,uuid,text,text,boolean),public.ma_revoke_invitation(uuid,uuid,uuid),public.ma_snapshot_attempt()to service_role;
commit;
