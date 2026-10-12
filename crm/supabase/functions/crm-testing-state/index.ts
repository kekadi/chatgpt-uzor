import { createClient } from "npm:@supabase/supabase-js@2.117.3";
import { testingStateSchema } from "./testing-model.ts";
const EXPECTED_KEY_DIGEST = "4991a540d0b15cdd836dde9e1ba369b1842fe584ff05149fd27a99b08bd68c82";
const workspace = "delta-crm-standalone-testing-v1";
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
Deno.serve(async(req:Request)=>{
 try{
 const key=req.headers.get("X-CRM-Test-Key")??"";
 if(key.length<43||key.length>256)return reply({error:"Unauthorized"},401);
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(key));
 const digest=Array.from(new Uint8Array(bytes)).map(b=>b.toString(16).padStart(2,"0")).join("");
 let mismatch=0;for(let i=0;i<digest.length;i++)mismatch|=digest.charCodeAt(i)^EXPECTED_KEY_DIGEST.charCodeAt(i);
 if(mismatch)return reply({error:"Unauthorized"},401);
 const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
 if(req.method==="GET"){
 const {data,error}=await db.from("crm_testing_workspaces").select("revision,state,updated_at").eq("workspace_key",workspace).single();
 if(error)return reply({error:"Workspace unavailable"},503);
 return reply(data);
 }
 if(req.method!=="PUT")return reply({error:"Method not allowed"},405);
 const raw=await req.text();if(raw.length>250000)return reply({error:"Workspace too large"},413);
 const input=JSON.parse(raw), parsed=testingStateSchema.safeParse(input.state);
 if(!parsed.success||!Number.isInteger(input.revision)||input.revision<0)return reply({error:"Invalid synthetic testing state"},400);
 const {data,error}=await db.rpc("crm_write_testing_snapshot",{p_workspace:workspace,p_revision:input.revision,p_state:parsed.data});
 if(error)return reply({error:(error.code==="PT409"||error.code==="40001")?"Revision conflict":"Save failed"},(error.code==="PT409"||error.code==="40001")?409:503);
 return reply(data);
 }catch{return reply({error:"Testing storage request failed"},500);}
});

