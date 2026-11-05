// Check the installation without changing the inventory or testing on real applications.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import ExcelJS from 'exceljs';
import {dataRoot} from './config.mjs';
import {readSettings,ready} from './settings.mjs';
import {readState,assertValidData,commit} from './store.mjs';
import {exportApplications} from './export-applications.mjs';
import {employerWorkbook} from './employer-workbook.mjs';
import {inspectBatch} from './import-discoveries.mjs';

export async function selfCheck({root=dataRoot,settings,requireConfigured=false,employers=fileURLToPath(new URL('../profile/companies.xlsx',import.meta.url))}={}){
 const results=[];let probe;
 const check=async(name,fn)=>{try{const detail=await fn();results.push({name,ok:true,detail:detail||''});}catch(e){results.push({name,ok:false,detail:e.message});}};
 await check('Node',()=>{if(Number(process.versions.node.split('.')[0])<22)throw Error('Node 22 or newer is required. Use the bundled starter.');return process.version;});
 await check('Settings',async()=>{settings??=await readSettings();if(requireConfigured&&!ready(settings))throw Error('Complete groups, countries and timezone in Settings.');return ready(settings)?'Configured':'Not personalized yet; open Settings before importing jobs.';});
 await check('Inventory',async()=>{const {data}=await readState(root);assertValidData(data);return `${data.jobs.length} positions`;});
 await check('Discovery schema',()=>{const checked=inspectBatch({schemaVersion:1,runId:'selfcheck01',searchedAt:new Date().toISOString(),jobs:[]},'2000-01-01-selfcheck01.json',settings);if(checked.errors.length)throw Error(checked.errors.join('; '));});
 await check('Data folders',async()=>{for(const sub of ['incoming','incoming/imported','reports','backups','exports'])if(!(await fs.stat(path.join(root,sub))).isDirectory())throw Error(`Missing folder: ${sub}. Run initialize.mjs or reopen the starter.`);});
 await check('Storage and backup',async()=>{
  probe=await fs.mkdtemp(path.join(root,'.self-check-'));
  await fs.writeFile(path.join(probe,'jobs.json'),JSON.stringify({schemaVersion:1,jobs:[]}));
  const saved=await commit(probe,d=>{d.checked=true;return {};});
  if(!saved.backup||(await readState(probe)).data.checked!==true)throw Error('Test save or backup failed.');
 });
 await check('Excel export',async()=>{
  const {buffer}=await exportApplications({jobs:[],settings:settings||{exportLanguage:'en'}});
  const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(buffer);
  if(workbook.worksheets[0].getCell('A1').value!==(settings?.exportLanguage==='de'?'Datum':'Application date'))throw Error('Export round-trip failed.');
 });
 await check('Employer workbook',async()=>{const {employers:rows}=await employerWorkbook({file:employers});return `${rows.length} template/employer rows`;});
 await check('Temporary-folder cleanup',async()=>{if(probe)await fs.rm(probe,{recursive:true,force:true,maxRetries:10,retryDelay:100});});
 return {ok:results.every(r=>r.ok),configured:settings?ready(settings):false,results};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),index=args.indexOf('--root');
 const report=await selfCheck({root:index<0?dataRoot:path.resolve(args[index+1]),requireConfigured:args.includes('--require-configured')});
 for(const r of report.results)console.log(`${r.ok?'OK':'FAIL'} ${r.name}${r.detail?': '+r.detail:''}`);
 process.exitCode=report.ok?0:1;
}
