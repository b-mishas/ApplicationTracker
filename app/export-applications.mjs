// Author changed/new cell values with Artifact Tool, then retain the reference's
// native OOXML styles and print settings instead of round-tripping its formatting.
import fs from 'node:fs/promises';
import path from 'node:path';
import {homedir,tmpdir} from 'node:os';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {dataRoot} from './config.mjs';
let runtimePromise;
export async function runtime(){
 if(!runtimePromise)runtimePromise=(async()=>{
  const modules=process.env.JOBTRACKER_NODE_MODULES||path.join(homedir(),'.cache','codex-runtimes','codex-primary-runtime','dependencies','node','node_modules');
  const require=createRequire(path.join(modules,'..','jobtracker-runtime.cjs'));
  try{return {...await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href),JSZip:require('jszip')};}
  catch{runtimePromise=null;throw Error('Excel export requires the bundled Artifact Tool runtime. Set JOBTRACKER_NODE_MODULES to its node_modules directory.');}
 })();
 return runtimePromise;
}
export const applicationStatuses=['Applied','Interview','Offer','Rejected','Withdrawn'];
const german={Applied:'Warten auf Rückmeldung',Interview:'Interview',Offer:'Angebot',Rejected:'Absage',Withdrawn:'Zurückgezogen'};
const normalize=s=>String(s??'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('de');
const key=(company,city,title)=>[company,city,title].map(normalize).join('|');
const xmlEscape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function validApplicationDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
function serialDate(iso){return (Date.parse(iso+'T00:00:00Z')-Date.UTC(1899,11,30))/86400000;}
export function planApplications(history,jobs){
 const rows=[], seen=new Set(), issues=[];
 for(const job of jobs){
  if(!job.applicationDate&&!applicationStatuses.includes(job.status))continue;
  const city=job.applicationCity||job.city||job.locationRaw||'';
  const identity=key(job.company,city,job.title)+'|'+job.applicationDate;
  if(seen.has(identity)){issues.push(`${job.company} — ${job.title}: duplicate application/date; resolve before exporting.`);continue;}
  seen.add(identity);
  if(!validApplicationDate(job.applicationDate)){issues.push(`${job.company} — ${job.title}: enter the actual application date before exporting.`);continue;}
  const status=job.applicationStatusText||german[job.status]||job.status;
  rows.push({values:[serialDate(job.applicationDate),job.company,city,job.title,status],closed:['Rejected','Withdrawn','Dismissed'].includes(job.status),sourceRow:job.applicationSourceRow,order:job.applicationSourceRow??Number.MAX_SAFE_INTEGER});
 }
 if(issues.length){const error=Error(issues.join('\n'));error.code='EXPORT_INPUT';error.issues=issues;throw error;}
 rows.sort((a,b)=>a.values[0]-b.values[0]||a.order-b.order);
 const updates=new Map(),additions=[];
 rows.forEach((entry,i)=>{const row=i+4,old=history[i];if(!old)additions.push({...entry,row});else if(JSON.stringify(old.values)!==JSON.stringify(entry.values)||old.closed!==entry.closed)updates.set(row,{...entry,row});});
 return {updates,additions,rows};
}
export async function exportApplications({root=dataRoot,templatePath=process.env.JOBTRACKER_EXPORT_TEMPLATE||path.join(root,'Bewerbungsuebersicht-template.xlsx'),jobs}={}){
 const {FileBlob,SpreadsheetFile,Workbook,JSZip}=await runtime();
 const template=await fs.readFile(templatePath).catch(()=>{throw Error(`Excel template not found: ${templatePath}`);});
 const originalZip=await JSZip.loadAsync(template);
 const sheetPath='xl/worksheets/sheet1.xml';
 const xml=await originalZip.file(sheetPath)?.async('string');
 if(!xml)throw Error('Reference workbook has no first worksheet.');
 const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(templatePath));
 const sheet=wb.worksheets.getItemAt(0),used=sheet.getUsedRange();
 const matrix=used.values;
 // The exact reference starts at column A because the title overflows left gutter.
 // Read by absolute address to avoid depending on used-range origins.
 const values=sheet.getRange(`B1:F${Math.max(matrix.length+3,30)}`).values;
 if(JSON.stringify(values[2])!==JSON.stringify(['Datum','Unternehmen','Ort','Stelle','Status']))throw Error('Reference headers/layout changed; expected B3:F3.');
 const rawRows=new Map([...xml.matchAll(/<row\b[^>]*\br="(\d+)"[^>]*>[\s\S]*?<\/row>/g)].map(m=>[Number(m[1]),m[0]]));
 const history=[];
 for(let i=3;i<values.length;i++)if(values[i].some(v=>v!==null&&v!=='')){if(!rawRows.has(i+1))throw Error('Reference rows could not be matched.');history.push({row:i+1,values:values[i],closed:/absage|zurückgezogen|keine offenen stellen/i.test(values[i][4]||'')});}
 if(!history.length)throw Error('Reference has no application rows.');
 if(!jobs)jobs=JSON.parse(await fs.readFile(path.join(root,'jobs.json'),'utf8')).jobs;
 const plan=planApplications(history,jobs);
 if(!plan.updates.size&&!plan.additions.length&&plan.rows.length===history.length)return {buffer:template,historyRows:history.length,added:0,updated:0};
 const active=history.findLast(r=>!r.closed)||history.at(-1),closed=history.find(r=>r.closed)||active;
 const finalRows=new Map([...rawRows].filter(([row])=>row<4));
 const last=Math.max(3,plan.rows.length+3);
 const edits=plan.rows.map((entry,i)=>({...entry,row:i+4}));
 const generated=Workbook.create(),outSheet=generated.worksheets.add('Übersicht');
 for(const entry of edits){
  // Artifact Tool treats leading '=' as a formula unless explicitly quoted.
  outSheet.getRange(`B${entry.row}:F${entry.row}`).values=[entry.values.map(v=>typeof v==='string'&&v.startsWith('=')?"'"+v:v)];
 }
 generated.recalculate();
 const temporary=await fs.mkdtemp(path.join(tmpdir(),'jobtracker-export-'));
 try{
  const output=await SpreadsheetFile.exportXlsx(generated);const intermediate=path.join(temporary,'cells.xlsx');await output.save(intermediate);
  const z=await JSZip.loadAsync(await fs.readFile(intermediate));
  const authored=(await z.file(sheetPath).async('string')).replace(/<(\/?)(?:[\w]+:)/g,'<$1');
  const generatedRows=new Map([...authored.matchAll(/<row\b[^>]*\br="(\d+)"[^>]*>[\s\S]*?<\/row>/g)].map(m=>[Number(m[1]),m[0]]));
  for(const entry of edits){
   const historical=history.find(r=>r.row===entry.sourceRow&&r.closed===entry.closed&&key(r.values[1],r.values[2],r.values[3])===key(entry.values[1],entry.values[2],entry.values[3]));
   const source=rawRows.get((historical||(entry.closed?closed:active)).row);
   const styles=new Map([...source.matchAll(/<c\b([^>]*)>/g)].map(m=>{const col=/\br="([A-Z]+)\d+"/.exec(m[1])[1];return [col,/\bs="(\d+)"/.exec(m[1])?.[1]||'0'];}));
   let row=generatedRows.get(entry.row);if(!row)throw Error('Authoring failed to produce an application row.');
   if(/<f\b/.test(row))throw Error('Unexpected formula in application export.');
   row=row.replace(/<c\b([^>]*)>/g,(_,attrs)=>{const col=/\br="([A-Z]+)\d+"/.exec(attrs)[1];return `<c${attrs.replace(/\s+s="[^"]*"/g,'')} s="${styles.get(col)||'0'}">`;});
   // Generated plain strings use t="str"; they do not depend on shared-string indices.
   if(/\bt="s"/.test(row))throw Error('Unexpected shared-string encoding in authored cells.');
   const rowAttributes=source.match(/^<row\b([^>]*)>/)[1].replace(/\br="\d+"/,`r="${entry.row}"`);
   row=row.replace(/^<row\b[^>]*>/,`<row${rowAttributes}>`);
   finalRows.set(entry.row,row);
  }
  const sheetData=[...finalRows].sort((a,b)=>a[0]-b[0]).map(([,v])=>v).join('');
  const next=xml.replace(/<sheetData>[\s\S]*?<\/sheetData>/,`<sheetData>${sheetData}</sheetData>`).replace(/<dimension ref="[^"]*"\s*\/>/,`<dimension ref="B1:F${last}"/>`);
  originalZip.file(sheetPath,next);
  return {buffer:await originalZip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}),historyRows:history.length,added:plan.additions.length,updated:plan.updates.size};
 }finally{await fs.rm(temporary,{recursive:true,force:true});}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),arg=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
 const root=arg('--root')?path.resolve(arg('--root')):dataRoot;
 const output=arg('--output')||path.join(root,'exports',`Bewerbungsuebersicht-${new Date().toISOString().slice(0,10)}.xlsx`);
 try{const result=await exportApplications({root,templatePath:arg('--template')});await fs.mkdir(path.dirname(path.resolve(output)),{recursive:true});await fs.writeFile(output,result.buffer,{flag:'wx'});console.log(JSON.stringify({output,historyRows:result.historyRows,added:result.added,updated:result.updated}));}
 catch(e){console.error(e.message);process.exitCode=1;}
}
