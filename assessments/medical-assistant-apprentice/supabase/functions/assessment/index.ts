import {score,validateAnswers,RUBRIC} from '../_shared/scoring.mjs';
import questions from '../_shared/questions.json' with {type:'json'};
import references from '../_shared/references.json' with {type:'json'};
const URL_BASE=Deno.env.get('SUPABASE_URL')!,SECRET=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,PUB=Deno.env.get('SUPABASE_ANON_KEY')!;
const ORIGINS=(Deno.env.get('ASSESSMENT_ALLOWED_ORIGINS')||'https://delta-ma-apprentice.vercel.app').split(',');
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function db(path:string,method='GET',body?:unknown){const r=await fetch(URL_BASE+'/rest/v1/'+path,{method,headers:{apikey:SECRET,Authorization:'Bearer '+SECRET,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});if(!r.ok)throw new Error('Database operation rejected');return r.status===204?null:await r.json();}
async function hash(x:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
Deno.serve(async req=>{
 const origin=req.headers.get('Origin')||'';if(origin&&!ORIGINS.includes(origin))return new Response('Forbidden origin',{status:403});
 const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin','Cache-Control':'no-store','Content-Type':'application/json'};
 const reply=(x:unknown,status=200)=>new Response(JSON.stringify(x),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 const auth=req.headers.get('Authorization');if(!auth?.startsWith('Bearer '))return reply({error:'Sign in required'},401);
 const ur=await fetch(URL_BASE+'/auth/v1/user',{headers:{Authorization:auth,apikey:PUB}});if(!ur.ok)return reply({error:'Session invalid'},401);const user=await ur.json();

 try{
 const text=await req.text();if(text.length>20000)return reply({error:'Request too large'},413);const b=JSON.parse(text);
 const actions=['enroll','form','start','resume','save','submit','admin-list','admin-review','admin-invite','admin-invitations','admin-revoke'];if(!actions.includes(b.action))return reply({error:'Unknown action'},400);
 if(b.action.startsWith('admin-')){
  const role=user.app_metadata?.assessment_role;if(!['assessment_admin','assessment_reviewer','assessment_recruiter'].includes(role))return reply({error:'Administrator role required'},403);
  if(!UUID.test(b.org_id))return reply({error:'Organization required'},400);
  const membership=await db('ma_user_roles?user_id=eq.'+user.id+'&org_id=eq.'+b.org_id+'&select=role');if(!membership.length||membership[0].role!==role)return reply({error:'Organization access denied'},403);
  if(['admin-invite','admin-revoke'].includes(b.action)&&role!=='assessment_admin')return reply({error:'Administrator role required'},403);
  if(b.action==='admin-invite'){
   if(typeof b.email!=='string'||b.email.length>254||!/^\S+@\S+\.\S+$/.test(b.email)||typeof b.phone!=='string'||!/^\+[1-9][0-9]{6,14}$/.test(b.phone)||typeof b.application_id!=='string'||!b.application_id.trim()||b.application_id.length>100||typeof b.cohort!=='string'||!b.cohort.trim()||b.cohort.length>100)return reply({error:'Valid application ID, email, E.164 phone and cohort are required'},400);
   const token=[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');
   const inv=await db('rpc/ma_invite','POST',{p_org:b.org_id,p_actor:user.id,p_application:b.application_id.trim(),p_email:b.email.trim().toLowerCase(),p_phone:b.phone,p_cohort:b.cohort.trim(),p_hash:await hash(token)});
   return reply({...inv,invitation_url:ORIGINS[0]+'/candidate.html#invite='+token});
  }
  if(b.action==='admin-revoke'){if(!UUID.test(b.invitation_id))return reply({error:'Invitation required'},400);return reply(await db('rpc/ma_revoke_invitation','POST',{p_id:b.invitation_id,p_actor:user.id,p_org:b.org_id}));}
  if(b.action==='admin-invitations')return reply({invitations:await db('ma_invitations?select=id,expires_at,consumed_at,revoked_at,ma_candidates!inner(application_id,email,phone,cohort,org_id)&ma_candidates.org_id=eq.'+b.org_id+'&order=expires_at.desc&limit=100')});
  const candidates=await db('ma_candidates?org_id=eq.'+b.org_id+'&select=id');if(!candidates.length)return reply({attempts:[],rubric:RUBRIC});
  const attempts=await db('ma_attempts?candidate_id=in.('+candidates.map((c:any)=>c.id).join(',')+')&order=started_at.desc&limit=100');
  if(b.action==='admin-list')return reply({attempts,rubric:RUBRIC});
  if(role==='assessment_recruiter')return reply({error:'Reviewer role required'},403);
  const a=attempts.find((x:any)=>x.id===b.attempt_id);if(!a)return reply({error:'Attempt not found'},404);
  if(typeof b.evidence!=='string'||!b.evidence.trim()||b.evidence.length>5000)return reply({error:'Evidence required'},400);
  const result=score(a.answers,b.ratings);return reply(await db('rpc/ma_review','POST',{p_attempt:a.id,p_user:user.id,p_score:result,p_ratings:b.ratings,p_evidence:b.evidence}));
 }
 const release=await db('ma_release_settings?assessment_id=eq.ROLE-009-SA01&select=enrollment_enabled');
 if(!release[0]?.enrollment_enabled)return reply({error:'Applicant enrollment is closed'},503);
 // Email AND phone possession must have been verified by the configured Supabase Auth enrollment.
 // Identity enrollment and OTP delivery are intentionally not bypassed or simulated here.
 if(!user.email_confirmed_at||!user.phone_confirmed_at||!user.email||!user.phone)return reply({error:'Verify both registered email and phone before starting'},403);
 const phone=user.phone.startsWith('+')?user.phone:'+'+user.phone;
 if(b.action==='enroll'){if(typeof b.invitation_token!=='string'||!/^[0-9a-f]{64}$/.test(b.invitation_token))return reply({error:'Invitation required'},400);return reply(await db('rpc/ma_enroll','POST',{p_hash:await hash(b.invitation_token),p_user:user.id,p_email:user.email,p_phone:phone,p_consent:b.consent===true}));}
 const candidates=await db('ma_candidates?user_id=eq.'+user.id+'&select=*');if(candidates.length!==1)return reply({error:'Enrollment required'},403);const c=candidates[0];
 if(c.email.toLowerCase()!==user.email.toLowerCase()||c.phone!==phone||!c.consent_at)return reply({error:'Registered identity or consent mismatch'},403);
 if(b.action==='form'){let form=questions;if(b.attempt_id){if(!UUID.test(b.attempt_id))return reply({error:'Attempt required'},400);const owned=await db('ma_attempts?id=eq.'+b.attempt_id+'&candidate_id=eq.'+c.id+'&select=id');if(!owned.length)return reply({error:'Attempt not found'},404);const snapshot=await db('ma_attempt_questions?attempt_id=eq.'+b.attempt_id+'&select=snapshot&order=item_id.asc');if(snapshot.length!==31)return reply({error:'Assessment snapshot unavailable'},409);form=snapshot.map((x:any)=>x.snapshot);}return reply({version:'SA01-1.0-source',questions:form,references,time_limit_minutes:70,label:'Scored assessment'});}
 if(b.action==='start'){if(typeof b.invitation_token!=='string'||b.invitation_token.length<32||b.invitation_token.length>200)return reply({error:'Invalid invitation'},400);return reply(await db('rpc/ma_start','POST',{p_hash:await hash(b.invitation_token),p_user:user.id,p_email:user.email,p_phone:phone}));}
 if(!UUID.test(b.attempt_id))return reply({error:'Attempt required'},400);
 const attempts=await db('ma_attempts?id=eq.'+b.attempt_id+'&candidate_id=eq.'+c.id+'&select=*');if(!attempts.length)return reply({error:'Attempt not found'},404);const a=attempts[0];
 if(b.action==='resume')return reply({id:a.id,status:a.status,answers:a.status==='in_progress'?a.answers:undefined,deadline:a.deadline,revision:a.revision});
 if(b.action==='submit'&&new Date(a.deadline).getTime()<=Date.now()&&a.status==='in_progress'){if(!UUID.test(b.idempotency_key)||b.certified!==true)return reply({error:'Certification and submission key required'},400);return reply(await db('rpc/ma_finish_expired','POST',{p_attempt:a.id,p_user:user.id,p_key:b.idempotency_key,p_score:score(a.answers)}));}
 validateAnswers(b.answers);
 if(b.action==='save'){if(!Number.isInteger(b.revision)||b.revision<0)return reply({error:'Revision required'},400);return reply(await db('rpc/ma_save','POST',{p_attempt:a.id,p_user:user.id,p_revision:b.revision,p_answers:b.answers}));}
 if(!UUID.test(b.idempotency_key)||b.certified!==true)return reply({error:'Submission key and certification required'},400);
 return reply(await db('rpc/ma_submit','POST',{p_attempt:a.id,p_user:user.id,p_key:b.idempotency_key,p_answers:b.answers,p_score:score(b.answers)}));
 }catch{return reply({error:'Request rejected; check identity, state, revision, and input'},400)}
});
