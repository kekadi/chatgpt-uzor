import {test} from 'node:test';
import assert from 'node:assert/strict';
import {aging,demoCases,monthlyTrend,caseInput} from '../lib/domain';
import {workbook,workbookTabs,safeCell} from '../lib/workbook';
const now=new Date('2026-10-12T12:00:00Z');
test('aging boundaries and closed items',()=>{const c={...demoCases(now)[1],urgency:'STAT' as const,closed_at:null,status:'open' as const};for(const [hours,flag] of [[0.99,'green'],[1,'yellow'],[2,'red']] as const)assert.equal(aging({...c,opened_at:new Date(now.getTime()-hours*3600000).toISOString()},now).flag,flag);assert.equal(aging({...c,status:'completed',closed_at:now.toISOString()},now).flag,'closed');});
test('completed case requires evidence and DME quantity is positive integer',()=>{const c=demoCases(now)[1];assert.equal(caseInput.safeParse({...c,status:'completed',closure_evidence:''}).success,false);assert.equal(caseInput.safeParse({...c,details:{quantity:-1}}).success,false);});
test('six full months respect Chicago month boundary',()=>{const rows=monthlyTrend([],new Date('2026-10-01T01:00:00Z'));assert.deepEqual(rows.map(r=>r.month),['2026-03','2026-04','2026-05','2026-06','2026-07','2026-08']);});
test('workbook has nine tabs, cached formulas, dropdowns and safe text',async()=>{const b=await workbook(demoCases(now),[],now);assert.deepEqual(b.worksheets.map(s=>s.name),workbookTabs);assert.equal(b.getWorksheet('DME Orders')!.getCell('E2').dataValidation.type,'list');assert.equal(b.getWorksheet('KPI Dashboard')!.getCell('B2').result,3);assert.equal(safeCell('=HYPERLINK("x")').startsWith("'"),true);const buffer=await b.xlsx.writeBuffer();assert.ok(buffer.byteLength>5000);});
