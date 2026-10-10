import fs from 'node:fs';import {score,RUBRIC} from './src/scoring.mjs';
const perfect=Object.fromEntries(['Accurate','Time','MRN','Accurate','Phone','Accurate','DOB','Accurate','Accurate','Time',...'CBCCCBCBBBCCBBBBACAB'].map((v,i)=>[i+1,v]));
perfect[31]='2:10 PM — Samuel Brown, DOB 12/15/1942, 469-555-0142, requests lisinopril 10 mg refill; two tablets left. Walgreens on Main Street. Reports no urgent symptoms. Asks whether to take an extra tablet for high blood pressure this morning. No dosing advice given; routing to licensed clinical staff for review and callback.';
const people=[['DEMO-001','Jordan Taylor','Written review pending',{...perfect,12:'A',19:'A'},null,null,null],['DEMO-002','Alex Morgan','Interview',{...perfect,3:'Accurate',14:'A'},[2,2,1,1,2,1],82,null],['DEMO-003','Casey Ellis','Safety review',{...perfect,21:'A',17:'A',28:'A'},[2,2,1,1,1,2],null,null],['DEMO-004','Riley Parker','Final review',{...perfect,5:'Accurate',15:'A',18:'A'},[2,2,1,1,2,2],87,93],['DEMO-005','Jamie Quinn','Submitted',{...perfect,2:'Discrepancy',23:'A',26:'A'},null,null,null]];
const rows=people.map(([id,name,stage,answers,ratings,interview,work])=>({id,name,stage,cohort:'October 2026 · Demo',identity:'Synthetic fixture',attempt:1,submitted:'2026-10-10',answers,ratings,interview,work,score:score(answers,ratings),reviewer:'Demo reviewer',notes:'',decision:'Pending'}));
const q=JSON.parse(fs.readFileSync('src/questions.json','utf8'));

let h=fs.readFileSync('template.html','utf8').replace('__QUESTIONS__',JSON.stringify(q)).replace('__ROWS__',JSON.stringify(rows)).replace('__RUBRIC__',JSON.stringify(RUBRIC));
fs.writeFileSync('index.html',h);fs.writeFileSync('admin.html',h);
let candidate=fs.readFileSync('template.html','utf8').replace('__QUESTIONS__',JSON.stringify(q)).replace('__ROWS__','[]').replace('__RUBRIC__','[]').replace('let mode="dashboard"','let mode="assessment"').replace("const saved=JSON.parse(sessionStorage.getItem('delta-demo-v1')||'null')","const saved=null");
fs.writeFileSync('candidate.html',candidate);
