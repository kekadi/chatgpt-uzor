import {readFile,writeFile} from 'node:fs/promises';
for(const name of ['testing-model.ts','domain.ts']){const content=(await readFile(`lib/${name}`,'utf8')).replace("from './domain'","from './domain.ts'").replace("from 'zod'","from 'npm:zod@4.6.6'");await writeFile(`supabase/functions/crm-testing-state/${name}`,content);}
await writeFile('supabase/functions/crm-testing-state/deno.json','{"compilerOptions":{"strict":true}}\n');
