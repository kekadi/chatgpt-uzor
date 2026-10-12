-- Development baseline: review and convert to a CLI-generated migration before deployment.
-- Supabase auth.users/auth.uid/auth.jwt and authenticated role must already exist.
begin;
create schema crm;
revoke all on schema crm from public;
grant usage on schema crm to authenticated;

create table crm.practices (
 id uuid primary key default gen_random_uuid(), name text not null,
 timezone text not null default 'America/Chicago', created_at timestamptz not null default now()
);
create table crm.memberships (
 practice_id uuid not null references crm.practices(id), user_id uuid not null references auth.users(id),
 display_name text not null, role text not null check(role in ('administrator','supervisor','staff')),
 active boolean not null default false, primary key(practice_id,user_id)
);
create index memberships_user on crm.memberships(user_id) where active;
alter table crm.memberships enable row level security;
create policy self_membership on crm.memberships for select to authenticated using(user_id=(select auth.uid()));
grant select on crm.memberships to authenticated;

-- No SECURITY DEFINER: membership policy permits only the caller's rows.
create function crm.staff_role(p uuid) returns text language sql stable security invoker
 set search_path='' as $$
 select role from crm.memberships where practice_id=p and user_id=auth.uid() and active
 and auth.jwt()->>'aal'='aal2'
 $$;
revoke all on function crm.staff_role(uuid) from public;
grant execute on function crm.staff_role(uuid) to authenticated;
alter table crm.practices enable row level security;
create policy practice_read on crm.practices for select to authenticated using(crm.staff_role(id) is not null);
grant select on crm.practices to authenticated;

create table crm.patients (
 id uuid primary key default gen_random_uuid(), practice_id uuid not null references crm.practices(id),
 mrn text not null, ecw_id text, display_name text not null, birth_date date,
 phone text, email text, created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), archived_at timestamptz,
 version integer not null default 1, unique(practice_id,id), unique(practice_id,mrn), unique(practice_id,ecw_id)
);
create table crm.directory (
 id uuid primary key default gen_random_uuid(), practice_id uuid not null references crm.practices(id),
 kind text not null check(kind in ('specialist','vendor')), name text not null, service text not null,
 phone text, fax text, address text, source_url text, verified_at timestamptz,
 participation_status text not null default 'unverified', unique(practice_id,id)
);
create table crm.aging_rules (
 practice_id uuid not null references crm.practices(id), urgency text not null check(urgency in ('STAT','Urgent','Routine')),
 yellow_hours numeric not null check(yellow_hours>=0), red_hours numeric not null,
 rule_version integer not null default 1, approved boolean not null default false,
 check(red_hours>yellow_hours), primary key(practice_id,urgency,rule_version)
);
create table crm.cases (
 id uuid primary key default gen_random_uuid(), practice_id uuid not null references crm.practices(id),
 patient_id uuid not null, module text not null check(module in ('referral','dme','authorization','appeal')),
 title text not null, urgency text not null check(urgency in ('STAT','Urgent','Routine')),
 status text not null default 'open' check(status in ('open','submitted','scheduled','approved','denied','completed','cancelled')),
 owner_id uuid not null, opened_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), closed_at timestamptz,
 closure_evidence text, archived_at timestamptz, version integer not null default 1,
 unique(practice_id,id), unique(practice_id,id,module),
 foreign key(practice_id,patient_id) references crm.patients(practice_id,id),
 foreign key(practice_id,owner_id) references crm.memberships(practice_id,user_id),
 check(status<>'completed' or (closed_at is not null and closure_evidence is not null and length(trim(closure_evidence))>0)),
 check((status in ('completed','cancelled'))=(closed_at is not null))
);
create index cases_queue on crm.cases(practice_id,owner_id,status,opened_at) where archived_at is null;
create index cases_patient on crm.cases(practice_id,patient_id);

create table crm.referral_details (
 practice_id uuid not null, case_id uuid not null, module text not null default 'referral' check(module='referral'),
 specialty text, specialist_id uuid, diagnosis_code text, consultation_received_at timestamptz,
 primary key(practice_id,case_id),
 foreign key(practice_id,case_id,module) references crm.cases(practice_id,id,module),
 foreign key(practice_id,specialist_id) references crm.directory(practice_id,id)
);
create table crm.dme_details (
 practice_id uuid not null, case_id uuid not null, module text not null default 'dme' check(module='dme'),
 equipment text, quantity integer not null default 1 check(quantity>0), vendor_id uuid, delivered_at timestamptz,
 primary key(practice_id,case_id),
 foreign key(practice_id,case_id,module) references crm.cases(practice_id,id,module),
 foreign key(practice_id,vendor_id) references crm.directory(practice_id,id)
);
create table crm.authorization_details (
 practice_id uuid not null, case_id uuid not null, module text not null default 'authorization' check(module='authorization'),
 payer text, service text, denial_code text, denial_reason text, authorization_number text, expires_on date,
 primary key(practice_id,case_id), foreign key(practice_id,case_id,module) references crm.cases(practice_id,id,module)
);
create table crm.appeal_details (
 practice_id uuid not null, case_id uuid not null, module text not null default 'appeal' check(module='appeal'),
 authorization_case_id uuid, authorization_module text not null default 'authorization' check(authorization_module='authorization'),
 appeal_type text not null default 'P2P' check(appeal_type in ('P2P','Written','External')),
 payer_reference text, outcome text check(outcome in ('pending','overturned','upheld','withdrawn')), deadline_at timestamptz,
 primary key(practice_id,case_id),
 foreign key(practice_id,case_id,module) references crm.cases(practice_id,id,module),
 foreign key(practice_id,authorization_case_id,authorization_module) references crm.cases(practice_id,id,module)
);
create table crm.tasks (
 id uuid primary key default gen_random_uuid(), practice_id uuid not null references crm.practices(id),
 case_id uuid, owner_id uuid not null, title text not null, due_at timestamptz,
 completed_at timestamptz, foreign key(practice_id,case_id) references crm.cases(practice_id,id),
 foreign key(practice_id,owner_id) references crm.memberships(practice_id,user_id)
);
create index tasks_owner_due on crm.tasks(practice_id,owner_id,due_at) where completed_at is null;
create index tasks_case on crm.tasks(practice_id,case_id);
create table crm.documents (
 id uuid primary key default gen_random_uuid(), practice_id uuid not null references crm.practices(id),
 case_id uuid not null, object_key text not null, original_name text not null, mime_type text not null,
 scan_status text not null default 'pending' check(scan_status in ('pending','clean','quarantined')),
 uploaded_at timestamptz not null default now(), foreign key(practice_id,case_id) references crm.cases(practice_id,id)
);
create index documents_case on crm.documents(practice_id,case_id);
create table crm.audit_events (
 id uuid primary key default gen_random_uuid(), practice_id uuid not null references crm.practices(id),
 actor_id uuid not null, action text not null, entity_type text not null, entity_id uuid,
 occurred_at timestamptz not null default now()
);
create index audit_time on crm.audit_events(practice_id,occurred_at desc);
alter table crm.audit_events enable row level security;
grant select,insert on crm.audit_events to authenticated;
create policy audit_insert on crm.audit_events for insert to authenticated
 with check(actor_id=auth.uid() and crm.staff_role(practice_id) is not null);
create policy audit_read on crm.audit_events for select to authenticated
 using(crm.staff_role(practice_id) in ('administrator','supervisor'));

create function crm.audit_change() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 insert into crm.audit_events(practice_id,actor_id,action,entity_type,entity_id)
 values(new.practice_id,auth.uid(),tg_op,tg_table_name,new.id);
 return new;
end $$;
revoke all on function crm.audit_change() from public;
grant execute on function crm.audit_change() to authenticated;
create trigger case_audit after insert or update on crm.cases for each row execute function crm.audit_change();
create trigger patient_audit after insert or update on crm.patients for each row execute function crm.audit_change();

alter table crm.cases enable row level security;
grant select,insert,update on crm.cases to authenticated;
create policy case_read on crm.cases for select to authenticated using(
 crm.staff_role(practice_id) in ('administrator','supervisor') or
 (crm.staff_role(practice_id)='staff' and owner_id=auth.uid()));
create policy case_insert on crm.cases for insert to authenticated with check(
 crm.staff_role(practice_id) in ('administrator','supervisor') or
 (crm.staff_role(practice_id)='staff' and owner_id=auth.uid()));
create policy case_update on crm.cases for update to authenticated using(
 crm.staff_role(practice_id) in ('administrator','supervisor') or
 (crm.staff_role(practice_id)='staff' and owner_id=auth.uid())) with check(
 crm.staff_role(practice_id) in ('administrator','supervisor') or
 (crm.staff_role(practice_id)='staff' and owner_id=auth.uid()));

do $$ declare t text; begin
 foreach t in array array['patients','directory','aging_rules'] loop
  execute format('alter table crm.%I enable row level security',t);
  execute format('grant select on crm.%I to authenticated',t);
  execute format('create policy member_read on crm.%I for select to authenticated using(crm.staff_role(practice_id) is not null)',t);
 end loop;
 foreach t in array array['patients','directory'] loop
  execute format('grant insert,update on crm.%I to authenticated',t);
  execute format('create policy member_insert on crm.%I for insert to authenticated with check(crm.staff_role(practice_id) is not null)',t);
  execute format('create policy member_update on crm.%I for update to authenticated using(crm.staff_role(practice_id) is not null) with check(crm.staff_role(practice_id) is not null)',t);
 end loop;
 foreach t in array array['referral_details','dme_details','authorization_details','appeal_details','documents'] loop
  execute format('alter table crm.%I enable row level security',t);
  execute format('grant select,insert,update on crm.%I to authenticated',t);
  execute format('create policy linked_case on crm.%I for all to authenticated using(exists(select 1 from crm.cases c where c.practice_id=%I.practice_id and c.id=%I.case_id)) with check(exists(select 1 from crm.cases c where c.practice_id=%I.practice_id and c.id=%I.case_id))',t,t,t,t,t);
 end loop;
end $$;
alter table crm.tasks enable row level security;
grant select,insert,update on crm.tasks to authenticated;
create policy task_access on crm.tasks for all to authenticated
 using(crm.staff_role(practice_id) in ('administrator','supervisor') or (crm.staff_role(practice_id)='staff' and owner_id=auth.uid()))
 with check(crm.staff_role(practice_id) in ('administrator','supervisor') or (crm.staff_role(practice_id)='staff' and owner_id=auth.uid()));

-- Membership/rules provisioning is an admin-operator procedure, never browser self-service.
-- Details and common-case write remain atomic using this SECURITY INVOKER function.
create function crm.save_case(p_practice uuid,p_input jsonb,p_id uuid default null,p_version integer default null)
 returns uuid language plpgsql security invoker set search_path='' as $$
declare cid uuid; m text; s text; d jsonb;
begin
 m:=p_input->>'module'; s:=p_input->>'status'; d:=coalesce(p_input->'details','{}'::jsonb);
 if p_id is null then
  insert into crm.cases(practice_id,patient_id,module,title,urgency,status,owner_id,closure_evidence,closed_at)
  values(p_practice,(p_input->>'patient_id')::uuid,m,p_input->>'title',p_input->>'urgency',s,
  (p_input->>'owner_id')::uuid,p_input->>'closure_evidence',case when s in ('completed','cancelled') then now() end) returning id into cid;
 else
  update crm.cases set title=p_input->>'title',urgency=p_input->>'urgency',status=s,
  owner_id=(p_input->>'owner_id')::uuid,closure_evidence=p_input->>'closure_evidence',
  closed_at=case when s in ('completed','cancelled') then coalesce(closed_at,now()) end,
  updated_at=now(),version=version+1
  where id=p_id and practice_id=p_practice and version=p_version and module=m and patient_id=(p_input->>'patient_id')::uuid
  returning id into cid;
  if cid is null then raise exception 'Case unavailable or version conflict' using errcode='40001'; end if;
 end if;
 if m='referral' then
  insert into crm.referral_details(practice_id,case_id,specialty,diagnosis_code) values(p_practice,cid,d->>'specialty',d->>'diagnosis_code')
  on conflict(practice_id,case_id) do update set specialty=excluded.specialty,diagnosis_code=excluded.diagnosis_code;
 elsif m='dme' then
  insert into crm.dme_details(practice_id,case_id,equipment,quantity) values(p_practice,cid,d->>'equipment',coalesce((d->>'quantity')::int,1))
  on conflict(practice_id,case_id) do update set equipment=excluded.equipment,quantity=excluded.quantity;
 elsif m='authorization' then
  insert into crm.authorization_details(practice_id,case_id,payer,service,denial_code,denial_reason,authorization_number,expires_on)
  values(p_practice,cid,d->>'payer',d->>'service',d->>'denial_code',d->>'denial_reason',d->>'authorization_number',nullif(d->>'expires_on','')::date)
  on conflict(practice_id,case_id) do update set payer=excluded.payer,service=excluded.service,denial_code=excluded.denial_code,
  denial_reason=excluded.denial_reason,authorization_number=excluded.authorization_number,expires_on=excluded.expires_on;
 elsif m='appeal' then
  insert into crm.appeal_details(practice_id,case_id,authorization_case_id,appeal_type,payer_reference,outcome,deadline_at)
  values(p_practice,cid,nullif(d->>'authorization_case_id','')::uuid,coalesce(d->>'appeal_type','P2P'),d->>'payer_reference',coalesce(d->>'outcome','pending'),nullif(d->>'deadline_at','')::timestamptz)
  on conflict(practice_id,case_id) do update set authorization_case_id=excluded.authorization_case_id,appeal_type=excluded.appeal_type,
  payer_reference=excluded.payer_reference,outcome=excluded.outcome,deadline_at=excluded.deadline_at;
 end if;
 return cid;
end $$;
revoke all on function crm.save_case(uuid,jsonb,uuid,integer) from public;
grant execute on function crm.save_case(uuid,jsonb,uuid,integer) to authenticated;

-- Record assignment/status events without storing clinical text in general audit metadata.
create table crm.case_events (
 id uuid primary key default gen_random_uuid(), practice_id uuid not null, case_id uuid not null,
 actor_id uuid not null, previous_status text, new_status text not null,
 previous_owner_id uuid, new_owner_id uuid not null, occurred_at timestamptz not null default now(),
 foreign key(practice_id,case_id) references crm.cases(practice_id,id)
);
create index case_events_case_time on crm.case_events(practice_id,case_id,occurred_at);
alter table crm.case_events enable row level security;
grant select,insert on crm.case_events to authenticated;
create policy case_event_read on crm.case_events for select to authenticated using(
 exists(select 1 from crm.cases c where c.id=case_id and c.practice_id=case_events.practice_id));
create policy case_event_insert on crm.case_events for insert to authenticated with check(
 actor_id=auth.uid() and exists(select 1 from crm.cases c where c.id=case_id and c.practice_id=case_events.practice_id));
create function crm.record_case_event() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 insert into crm.case_events(practice_id,case_id,actor_id,previous_status,new_status,previous_owner_id,new_owner_id)
 values(new.practice_id,new.id,auth.uid(),case when tg_op='UPDATE' then old.status end,new.status,
 case when tg_op='UPDATE' then old.owner_id end,new.owner_id);return new;
end $$;
revoke all on function crm.record_case_event() from public;
grant execute on function crm.record_case_event() to authenticated;
create trigger case_event after insert or update on crm.cases for each row execute function crm.record_case_event();

create function crm.guard_case() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.id<>old.id or new.practice_id<>old.practice_id or new.patient_id<>old.patient_id
 or new.module<>old.module or new.opened_at<>old.opened_at then raise exception 'Case identity is immutable';end if;
 if new.version<>old.version+1 then raise exception 'Version must increment' using errcode='40001';end if;
 if new.status<>old.status then
  if old.status in ('completed','cancelled') then
   if crm.staff_role(old.practice_id) not in ('administrator','supervisor') or new.status<>'open' then
    raise exception 'Supervisor required to reopen';end if;
  elsif not (
    (old.status='open' and new.status in ('submitted','scheduled','denied','completed','cancelled')) or
    (old.status='submitted' and new.status in ('scheduled','approved','denied','completed','cancelled')) or
    (old.status='scheduled' and new.status in ('approved','denied','completed','cancelled')) or
    (old.status='approved' and new.status in ('completed','cancelled')) or
    (old.status='denied' and new.status in ('submitted','cancelled'))
  ) then raise exception 'Invalid workflow transition';end if;
 end if;
 new.updated_at:=now();return new;
end $$;
revoke all on function crm.guard_case() from public;
grant execute on function crm.guard_case() to authenticated;
create trigger guard_case before update on crm.cases for each row execute function crm.guard_case();

commit;
