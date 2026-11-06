// ExcelJS is bundled: exports do not depend on an LLM installation or private template.
import ExcelJS from 'exceljs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {dataRoot} from './config.mjs';
import {calendarDate,readSettings} from './settings.mjs';
import {effectiveStatus,interviewHistoryText} from './status-history.mjs';
export const applicationStatuses=['Applied','Interview','Offer','Rejected','Withdrawn'];
export function validApplicationDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
const words={en:{headers:['Application date','Company','Location','Position','Status'],sheet:'Applications'},de:{headers:['Datum','Unternehmen','Ort','Stelle','Status'],sheet:'Bewerbungen',Applied:'Warten auf Rückmeldung',Interview:'Interview',Offer:'Angebot',Rejected:'Absage',Withdrawn:'Zurückgezogen',Dismissed:'Verworfen',New:'Neu',Shortlisted:'Vorgemerkt'}};
export function planApplications(history,jobs,language='en'){
 const seen=new Set(),rows=[],issues=[];
 for(const job of jobs){
  const status=effectiveStatus(job);
  if(!job.applicationDate&&!applicationStatuses.includes(status))continue;
  if(!validApplicationDate(job.applicationDate)){issues.push(`${job.company} — ${job.title}: enter the actual application date before exporting.`);continue;}
  const city=job.applicationCity||job.city||job.locationRaw||'';
  const key=[job.company,city,job.title,job.applicationDate].map(v=>String(v).normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase()).join('|');
  if(seen.has(key)){issues.push(`${job.company} — ${job.title}: duplicate application/date; resolve before exporting.`);continue;}seen.add(key);
  const historyText=interviewHistoryText(job,words[language]);
  const statusText=historyText ? [historyText,job.applicationStatusText].filter(Boolean).join(' — ') : job.applicationStatusText||words[language]?.[status]||status;
  rows.push({date:job.applicationDate,closed:['Rejected','Withdrawn','Dismissed'].includes(status),values:[new Date(job.applicationDate+'T00:00:00Z'),job.company,city,job.title,statusText]});
 }
 if(issues.length){const error=Error(issues.join('\n'));error.code='EXPORT_INPUT';throw error;}
 rows.sort((a,b)=>a.date.localeCompare(b.date));return {rows};
}
export async function applicationExportData({root=dataRoot,jobs,settings}={}){
 settings??=await readSettings();jobs??=JSON.parse(await fs.readFile(path.join(root,'jobs.json'),'utf8')).jobs;
 const language=settings.exportLanguage==='de'?'de':'en';
 const labels=words[language];
 const title=settings.exportName?`${labels.sheet} - ${settings.exportName}`:labels.sheet;
 return {...planApplications([],jobs,language),labels,language,title};
}
export async function exportApplications(options={}){
 const {rows,labels,title}=await applicationExportData(options);
 const headerRow=title===labels.sheet?1:2;
 const workbook=new ExcelJS.Workbook();workbook.creator='Application tracker';
 const sheet=workbook.addWorksheet(labels.sheet,{views:[{state:'frozen',ySplit:headerRow}],pageSetup:{paperSize:9,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0}});
 sheet.columns=[18,28,24,60,48].map(width=>({width}));
 if(headerRow===2){
  sheet.mergeCells('A1:E1');
  const heading=sheet.getCell('A1');
  heading.value=title;
  heading.font={name:'Calibri',size:16,bold:true,color:{argb:'FF253331'}};
  heading.alignment={vertical:'middle',wrapText:true};
  sheet.getRow(1).height=42;
 }
 sheet.addRow(labels.headers);
 for(const entry of rows){const row=sheet.addRow(entry.values);row.getCell(1).numFmt='yyyy-mm-dd';if(entry.closed)row.font={name:'Calibri',size:11,color:{argb:'FF808080'}};}
 sheet.eachRow((row,index)=>{if(index<headerRow)return;row.height=index===headerRow?26:Math.max(22,Math.ceil(String(row.getCell(5).value||'').length/44)*15);row.eachCell(cell=>{cell.font={name:'Calibri',size:11,...cell.font};cell.alignment={vertical:'middle',wrapText:true};if(index===headerRow){cell.font={name:'Calibri',size:11,bold:true,color:{argb:'FFFFFFFF'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF46624E'}};}else if((index-headerRow)%2===0)cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF1F4EF'}};});});
 sheet.autoFilter={from:`A${headerRow}`,to:`E${sheet.rowCount}`};sheet.pageSetup.printTitlesRow=`1:${headerRow}`;
 return {buffer:Buffer.from(await workbook.xlsx.writeBuffer()),added:rows.length,historyRows:0,updated:0};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),arg=k=>{const i=args.indexOf(k);return i<0?undefined:args[i+1];};
 const root=arg('--root')?path.resolve(arg('--root')):dataRoot,output=arg('--output')||path.join(root,'exports',`applications_${calendarDate(new Date())}.xlsx`);
 try{const result=await exportApplications({root});await fs.mkdir(path.dirname(path.resolve(output)),{recursive:true});await fs.writeFile(output,result.buffer,{flag:'wx'});console.log(JSON.stringify({output,rows:result.added}));}catch(e){console.error(e.message);process.exitCode=1;}
}
