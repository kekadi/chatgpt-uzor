-- Email-only apprentice authentication. Existing contact phone data is retained.
begin;
create or replace function public.ma_enroll(p_hash text,p_user uuid,p_email text,p_phone text,p_consent boolean) returns jsonb language plpgsql security invoker set search_path=public as $$
declare i ma_invitations;c ma_candidates;a ma_attempts;begin
 if p_consent is distinct from true then raise exception 'Consent required';end if;
 select * into i from ma_invitations where token_hash=p_hash for update;
 if i.id is null or i.revoked_at is not null then raise exception 'Invitation unavailable';end if;
 select * into c from ma_candidates where id=i.candidate_id for update;
 if p_user is null or p_email is null or lower(c.email)<>lower(p_email)or (c.user_id is not null and c.user_id<>p_user)then raise exception 'Identity mismatch';end if;
 -- Confirmed email is verified by the Edge API via Auth getUser.
 -- p_phone is retained for RPC compatibility and is no longer an authentication check.
 -- This service-only RPC does not broaden service_role access to auth.users.
 select * into a from ma_attempts where candidate_id=c.id and assessment_id=i.assessment_id and version=i.version and attempt_number=i.attempt_number;
 if a.id is null and i.expires_at<=now()then raise exception 'Invitation expired';end if;
 update ma_candidates set user_id=p_user,consent_at=coalesce(consent_at,now())where id=c.id;
 if c.consent_at is null then insert into ma_audit_events(org_id,actor,action)values(c.org_id,p_user,'candidate_consent_and_identity_verified');end if;
 return jsonb_build_object('candidate_id',c.id,'attempt_id',a.id);
end $$;
create or replace function public.ma_start(p_hash text,p_user uuid,p_email text,p_phone text) returns jsonb language plpgsql security invoker set search_path=public as $$
declare inv ma_invitations;c ma_candidates;a ma_attempts;begin
 select * into inv from ma_invitations where token_hash=p_hash for update;
 if inv.id is null or inv.expires_at<=now()or inv.revoked_at is not null or inv.consumed_at is not null then raise exception 'Invitation unavailable';end if;
 select * into c from ma_candidates where id=inv.candidate_id for update;
 if p_user is null or p_email is null or c.user_id is distinct from p_user or lower(c.email)<>lower(p_email)or c.consent_at is null then raise exception 'Identity or consent required';end if;
 if inv.attempt_number>1 and not exists(select 1 from ma_retakes r where r.id=inv.retake_id and r.candidate_id=c.id and r.assessment_id=inv.assessment_id and r.version=inv.version and r.attempt_number=inv.attempt_number)then raise exception 'Retake unauthorized';end if;
 insert into ma_attempts(candidate_id,assessment_id,version,attempt_number,retake_id,status,deadline)values(c.id,inv.assessment_id,inv.version,inv.attempt_number,inv.retake_id,'in_progress',now()+interval '70 minutes')returning * into a;
 update ma_invitations set consumed_at=now()where id=inv.id;
 insert into ma_audit_events(org_id,actor,action,attempt_id)values(c.org_id,p_user,'attempt_started',a.id);
 return jsonb_build_object('id',a.id,'deadline',a.deadline,'revision',0,'answers',a.answers);
end $$;
revoke all on function public.ma_enroll(text,uuid,text,text,boolean),public.ma_start(text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.ma_enroll(text,uuid,text,text,boolean),public.ma_start(text,uuid,text,text) to service_role;
commit;
