import fs from 'node:fs';
const config={url:process.env.ASSESSMENT_SUPABASE_URL,key:process.env.ASSESSMENT_PUBLISHABLE_KEY,endpoint:process.env.ASSESSMENT_API_URL,org:process.env.ASSESSMENT_ORG_ID};
if(Object.values(config).some(x=>!x))throw Error('Missing public assessment configuration');
fs.rmSync('public',{recursive:true,force:true});fs.mkdirSync('public');
fs.copyFileSync('web/index.html','public/index.html');
fs.writeFileSync('public/admin.html',fs.readFileSync('web/admin.html','utf8').replace('__CONFIG__',JSON.stringify(config)));
let candidate=fs.readFileSync('candidate.html','utf8');candidate=candidate.replace('<strong>Private demonstration · fictional candidates only.</strong> This preview uses sample results. Applicant invitations and live candidate scoring are not enabled. Changes stay in this browser session.','<strong>Candidate preview · enrollment disabled.</strong> Practice responses produce no hiring score. Do not enter applicant or patient information.');
candidate=candidate.replace('<button id="nav-dashboard" class="active" onclick="switchMode(\'dashboard\')">Selection dashboard</button>','<a href="/admin.html" style="color:white;padding:13px">Administrator sign-in</a>');
fs.writeFileSync('public/candidate.html',candidate);
