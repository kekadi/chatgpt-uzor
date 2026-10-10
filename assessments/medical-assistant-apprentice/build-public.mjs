import fs from 'node:fs';
const config={url:process.env.ASSESSMENT_SUPABASE_URL,key:process.env.ASSESSMENT_PUBLISHABLE_KEY,endpoint:process.env.ASSESSMENT_API_URL,org:process.env.ASSESSMENT_ORG_ID};
if(Object.values(config).some(x=>!x))throw Error('Missing public assessment configuration');
fs.rmSync('public',{recursive:true,force:true});fs.mkdirSync('public');
fs.copyFileSync('web/index.html','public/index.html');
fs.writeFileSync('public/admin.html',fs.readFileSync('web/admin.html','utf8').replace('__CONFIG__',JSON.stringify(config)));
fs.writeFileSync('public/candidate.html',fs.readFileSync('web/candidate.html','utf8').replace('__CONFIG__',JSON.stringify(config)));
