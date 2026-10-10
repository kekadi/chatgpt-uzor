-- Staged, not applied. Generate a migration with `supabase migration new ma_apprentice` after selecting a project.
begin;
create table public.ma_organizations(id uuid primary key default gen_random_uuid(), name text not null);
create table public.ma_user_roles(org_id uuid references public.ma_organizations, user_id uuid not null references auth.users, role text not null check(role in ('assessment_admin','assessment_reviewer','assessment_recruiter')), primary key(org_id,user_id));
create table public.ma_roles(id text primary key, title text not null);
create table public.ma_assessments(id text primary key,role_id text references public.ma_roles,version text not null,config jsonb not null);
create table public.ma_question_bank(item_id text primary key,assessment_id text references public.ma_assessments,section text not null,publication_status text not null);
create table public.ma_question_versions(item_id text references public.ma_question_bank,version text not null,candidate_payload jsonb not null,private_scoring jsonb not null,primary key(item_id,version));
create table public.ma_candidates(id uuid primary key default gen_random_uuid(),org_id uuid not null references public.ma_organizations,user_id uuid unique references auth.users,application_id text not null,email text not null,phone text not null check(phone ~ '^\+[1-9][0-9]{6,14}$'),cohort text not null,consent_at timestamptz,unique(org_id,application_id));
create table public.ma_retakes(id uuid primary key default gen_random_uuid(),candidate_id uuid not null references public.ma_candidates,assessment_id text not null,version text not null,attempt_number integer not null check(attempt_number>1),original_attempt_id uuid,reason text not null check(length(trim(reason))>0),approved_by uuid not null references auth.users,unique(candidate_id,assessment_id,version,attempt_number));
create table public.ma_invitations(id uuid primary key default gen_random_uuid(),candidate_id uuid not null references public.ma_candidates,assessment_id text not null,version text not null,token_hash text not null unique,expires_at timestamptz not null,consumed_at timestamptz,revoked_at timestamptz,attempt_number integer not null default 1,retake_id uuid references public.ma_retakes,check((attempt_number=1 and retake_id is null)or(attempt_number>1 and retake_id is not null)));
create table public.ma_attempts(id uuid primary key default gen_random_uuid(),candidate_id uuid not null references public.ma_candidates,assessment_id text not null,version text not null,attempt_number integer not null default 1,retake_id uuid references public.ma_retakes,status text not null check(status in ('in_progress','submitted','completed','expired','voided')),started_at timestamptz not null default now(),deadline timestamptz not null,submitted_at timestamptz,answers jsonb not null default '{}',revision integer not null default 0,score jsonb,submission_key uuid,unique(candidate_id,assessment_id,version,attempt_number),check((attempt_number=1 and retake_id is null)or(attempt_number>1 and retake_id is not null)));
create unique index ma_one_active on public.ma_attempts(candidate_id,assessment_id,version) where status='in_progress';
create table public.ma_attempt_questions(attempt_id uuid references public.ma_attempts,item_id text not null,version text not null,snapshot jsonb not null,primary key(attempt_id,item_id));
create table public.ma_answers(attempt_id uuid references public.ma_attempts,item_id text not null,response jsonb not null,primary key(attempt_id,item_id));
create table public.ma_domain_scores(attempt_id uuid references public.ma_attempts,domain text not null,earned numeric,possible numeric not null,details jsonb not null,primary key(attempt_id,domain),check(earned is null or(earned>=0 and earned<=possible)));
create table public.ma_reviewer_notes(id uuid primary key default gen_random_uuid(),attempt_id uuid not null references public.ma_attempts,reviewer uuid not null references auth.users,rubric_version text not null,ratings jsonb not null,evidence text not null,created_at timestamptz not null default now());
create table public.ma_hiring_reviews(id uuid primary key default gen_random_uuid(),attempt_id uuid not null references public.ma_attempts,actor uuid not null references auth.users,decision text not null,rationale text not null,created_at timestamptz not null default now());
create table public.ma_audit_events(id uuid primary key default gen_random_uuid(),org_id uuid not null references public.ma_organizations,actor uuid not null references auth.users,action text not null,attempt_id uuid,created_at timestamptz not null default now(),correlation_id uuid not null default gen_random_uuid());
-- No anonymous or authenticated direct reads; all access passes the authenticated Edge API.
do $$ declare t text;begin foreach t in array array['ma_organizations','ma_user_roles','ma_roles','ma_assessments','ma_question_bank','ma_question_versions','ma_candidates','ma_retakes','ma_invitations','ma_attempts','ma_attempt_questions','ma_answers','ma_domain_scores','ma_reviewer_notes','ma_hiring_reviews','ma_audit_events'] loop execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from anon, authenticated',t);execute format('grant select,insert,update on public.%I to service_role',t);end loop;end $$;
revoke update on public.ma_audit_events from service_role;
revoke update on public.ma_reviewer_notes from service_role;
revoke update on public.ma_hiring_reviews from service_role;
create function public.ma_start(p_hash text,p_user uuid,p_email text,p_phone text) returns jsonb language plpgsql security invoker set search_path=public as $$
declare inv ma_invitations;c ma_candidates;a ma_attempts;begin
 select * into inv from ma_invitations where token_hash=p_hash for update;
 if inv.id is null or inv.expires_at<=now()or inv.revoked_at is not null or inv.consumed_at is not null then raise exception 'Invitation unavailable';end if;
 select * into c from ma_candidates where id=inv.candidate_id for update;
 if c.user_id is distinct from p_user or lower(c.email)<>lower(p_email)or c.phone<>p_phone or c.consent_at is null then raise exception 'Identity or consent required';end if;
 if inv.attempt_number>1 and not exists(select 1 from ma_retakes r where r.id=inv.retake_id and r.candidate_id=c.id and r.assessment_id=inv.assessment_id and r.version=inv.version and r.attempt_number=inv.attempt_number)then raise exception 'Retake unauthorized';end if;
 insert into ma_attempts(candidate_id,assessment_id,version,attempt_number,retake_id,status,deadline)values(c.id,inv.assessment_id,inv.version,inv.attempt_number,inv.retake_id,'in_progress',now()+interval '70 minutes')returning * into a;
 update ma_invitations set consumed_at=now()where id=inv.id;
 insert into ma_audit_events(org_id,actor,action,attempt_id)values(c.org_id,p_user,'attempt_started',a.id);
 return jsonb_build_object('id',a.id,'deadline',a.deadline,'revision',0,'answers',a.answers);
end $$;
create function public.ma_save(p_attempt uuid,p_user uuid,p_revision integer,p_answers jsonb)returns jsonb language plpgsql security invoker set search_path=public as $$
declare a ma_attempts;begin
 select * into a from ma_attempts where id=p_attempt for update;
 if a.id is null or not exists(select 1 from ma_candidates c where c.id=a.candidate_id and c.user_id=p_user)then raise exception 'Forbidden';end if;
 if a.status<>'in_progress'or a.deadline<now()or a.revision<>p_revision then raise exception 'State or revision conflict';end if;
 update ma_attempts set answers=p_answers,revision=revision+1 where id=a.id returning * into a;
 return jsonb_build_object('id',a.id,'revision',a.revision,'deadline',a.deadline);
end $$;
create function public.ma_submit(p_attempt uuid,p_user uuid,p_key uuid,p_answers jsonb,p_score jsonb)returns jsonb language plpgsql security invoker set search_path=public as $$
declare a ma_attempts;c ma_candidates;begin
 select * into a from ma_attempts where id=p_attempt for update;
 select * into c from ma_candidates where id=a.candidate_id;
 if a.id is null or c.user_id is distinct from p_user then raise exception 'Forbidden';end if;
 if a.submission_key=p_key and a.status in('submitted','completed')then return jsonb_build_object('id',a.id,'status',a.status,'submitted_at',a.submitted_at);end if;
 if a.status<>'in_progress'or a.deadline<now()then raise exception 'Submission unavailable';end if;
 update ma_attempts set status='submitted',answers=p_answers,score=p_score,submitted_at=now(),submission_key=p_key,revision=revision+1 where id=a.id returning * into a;
 insert into ma_answers(attempt_id,item_id,response)select a.id,'ROLE-009-SA01-Q'||lpad(key,2,'0'),value from jsonb_each(p_answers);
 insert into ma_domain_scores(attempt_id,domain,earned,possible,details)select a.id,key,(value->>'earned')::numeric,(value->>'possible')::numeric,value from jsonb_each(p_score->'sections');
 insert into ma_audit_events(org_id,actor,action,attempt_id)values(c.org_id,p_user,'attempt_submitted',a.id);
 return jsonb_build_object('id',a.id,'status',a.status,'submitted_at',a.submitted_at);
end $$;
create function public.ma_review(p_attempt uuid,p_user uuid,p_score jsonb,p_ratings jsonb,p_evidence text)returns jsonb language plpgsql security invoker set search_path=public as $$
declare a ma_attempts;c ma_candidates;begin
 select * into a from ma_attempts where id=p_attempt for update;select * into c from ma_candidates where id=a.candidate_id;
 if a.id is null or a.status not in('submitted','completed')or not exists(select 1 from ma_user_roles r where r.org_id=c.org_id and r.user_id=p_user and r.role in('assessment_admin','assessment_reviewer'))then raise exception 'Forbidden';end if;
 if length(trim(p_evidence))=0 then raise exception 'Evidence required';end if;
 update ma_attempts set score=p_score,status='completed'where id=a.id;
 update ma_domain_scores set earned=(p_score->'sections'->'F'->>'earned')::numeric,details=p_score->'sections'->'F'where attempt_id=a.id and domain='F';
 insert into ma_reviewer_notes(attempt_id,reviewer,rubric_version,ratings,evidence)values(a.id,p_user,'SA02-source',p_ratings,p_evidence);
 insert into ma_audit_events(org_id,actor,action,attempt_id)values(c.org_id,p_user,'written_review_recorded',a.id);
 return jsonb_build_object('id',a.id,'status','completed','score',p_score);
end $$;
revoke all on function public.ma_start(text,uuid,text,text),public.ma_save(uuid,uuid,integer,jsonb),public.ma_submit(uuid,uuid,uuid,jsonb,jsonb),public.ma_review(uuid,uuid,jsonb,jsonb,text)from public,anon,authenticated;
grant execute on function public.ma_start(text,uuid,text,text),public.ma_save(uuid,uuid,integer,jsonb),public.ma_submit(uuid,uuid,uuid,jsonb,jsonb),public.ma_review(uuid,uuid,jsonb,jsonb,text)to service_role;
commit;
