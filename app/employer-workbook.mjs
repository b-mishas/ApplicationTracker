// Deterministic workbook access for agents, without Python or runtime installation.
import ExcelJS from 'exceljs';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validApplicationDate} from './export-applications.mjs';
import {withLock} from './store.mjs';
const headers=['#','Group','Company','HQ country','Sites / scope','Focus','Role types to watch','Website','Careers page','Priority','Status','Notes','Last checked'];
const text=v=>v instanceof Date?v.toISOString().slice(0,10):v?.text??v?.result??v??'';
async function work({file,action='read',records}){
 const original=await fs.readFile(file),hash=crypto.createHash('sha256').update(original).digest('hex');
 const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(original);
 const sheet=workbook.getWorksheet('Companies');if(!sheet)throw Error('Workbook needs a Companies sheet.');
 const columns=new Map();sheet.getRow(1).eachCell((cell,i)=>columns.set(String(text(cell.value)),i));
 for(const header of headers)if(!columns.has(header))throw Error(`Missing employer column: ${header}`);
 const rows=[];sheet.eachRow((row,i)=>{if(i>1&&text(row.getCell(columns.get('Company')).value))rows.push({row:i,...Object.fromEntries(headers.map(h=>[h,text(row.getCell(columns.get(h)).value)]))});});
 if(action==='read')return {employers:rows};
 if(!['replace','update'].includes(action)||!Array.isArray(records)||records.length>1000)throw Error('Use replace/update with a JSON array (maximum 1000 entries).');
 for(const record of records){
  if(!record||typeof record!=='object'||Array.isArray(record)||typeof record.Company!=='string'||!record.Company.trim())throw Error('Each employer needs a Company name.');
  const allowed=action==='update'?['Company','Careers page','Last checked']:headers;
  for(const [key,value] of Object.entries(record))if(!allowed.includes(key)||!['string','number'].includes(typeof value)||String(value).length>5000)throw Error(`Invalid employer field: ${key}`);
  if(record['Last checked']&&!validApplicationDate(record['Last checked']))throw Error('Last checked must be YYYY-MM-DD.');
 }
 if(new Set(records.map(r=>r.Company)).size!==records.length)throw Error('Duplicate employer names.');
 if(action==='replace')for(const row of rows)for(const h of headers)sheet.getRow(row.row).getCell(columns.get(h)).value=null;
 records.forEach((record,index)=>{
  const matches=rows.filter(r=>r.Company===record.Company);
  if(action==='update'&&matches.length!==1)throw Error(`Employer must match exactly one row: ${record.Company}`);
  const row=sheet.getRow(action==='replace'?index+2:matches[0].row);
  for(const [key,value] of Object.entries(record)){const cell=row.getCell(columns.get(key));cell.value=key==='Last checked'&&value?new Date(value+'T00:00:00Z'):value;if(key==='Last checked')cell.numFmt='yyyy-mm-dd';}
  if(action==='replace')row.getCell(columns.get('#')).value=index+1;
 });
 const tmp=`${file}.${crypto.randomUUID()}.tmp`;
 try{
  await fs.writeFile(tmp,await workbook.xlsx.writeBuffer(),{flag:'wx'});
  if(crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex')!==hash)throw Error('Workbook changed; retry after reading it again.');
  const backups=path.join(path.dirname(file),'backups');await fs.mkdir(backups,{recursive:true});await fs.writeFile(path.join(backups,`companies-${crypto.randomUUID()}.xlsx`),original,{flag:'wx'});
  await fs.rename(tmp,file);
 }finally{await fs.rm(tmp,{force:true});}
 return {written:records.length};
}
export async function employerWorkbook(options){return options.action&&options.action!=='read'?withLock(path.dirname(options.file),()=>work(options)):work(options);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),arg=k=>{const i=args.indexOf(k);return i<0?undefined:args[i+1];};
 try{const file=arg('--file')||fileURLToPath(new URL('../profile/companies.xlsx',import.meta.url));console.log(JSON.stringify(await employerWorkbook({file,action:args[0]||'read',records:arg('--input')?JSON.parse(await fs.readFile(arg('--input'),'utf8')):undefined})));}catch(e){console.error(e.message);process.exitCode=1;}
}
