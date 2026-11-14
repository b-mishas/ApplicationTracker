// Audit the actual archive, including XML inside workbooks. Private markers stay
// in an optional external JSON array, never in the source/distribution itself.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import JSZip from 'jszip';
export async function auditRelease(zip,{denyTerms=[]}={}){
 const failures=[];let textFiles=0,workbooks=0;
 const checkText=(name,text)=>{
  textFiles++;
  for(const marker of denyTerms)if(marker&&text.toLowerCase().includes(marker.toLowerCase()))failures.push(`${name}: forbidden private marker`);
 };
 for(const entry of Object.values(zip.files)){
  if(entry.dir)continue;
  if(/(?:^|\/)(?:AGENTS|CLAUDE)\.md$/i.test(entry.name)||/(?:^|\/)(?:\.git|\.codex|\.claude)\//i.test(entry.name))failures.push(`${entry.name}: developer instruction/metadata file`);
  if(/^Application tracker\/(?:HANDOFF|PLAN|HISTORY|PORTABILITY|INTERFACE_FOR_TRACKER)\.md$/i.test(entry.name))failures.push(`${entry.name}: maintainer document`);
  if(/\.(?:md|txt|html|json|js|mjs|xml|cmd|command|css|svg)$/i.test(entry.name))checkText(entry.name,await entry.async('string'));
  if(/\.xlsx$/i.test(entry.name)){
   workbooks++;const workbook=await JSZip.loadAsync(await entry.async('nodebuffer'));
   for(const part of Object.values(workbook.files))if(!part.dir&&/\.xml$/i.test(part.name))checkText(`${entry.name}!${part.name}`,await part.async('string'));
  }
 }
 const data=zip.file('Application tracker/data/jobs.json');
 if(!data||JSON.stringify(JSON.parse(await data.async('string')))!==JSON.stringify({schemaVersion:1,jobs:[]}))failures.push('Inventory is not a pristine empty object.');
 const settings=zip.file('Application tracker/settings/tracker.json');
 if(!settings||JSON.stringify(JSON.parse(await settings.async('string')))!==JSON.stringify({schemaVersion:1,exportLanguage:'en'}))failures.push('Settings are not pristine neutral defaults.');
 if(failures.length)throw Error('Release audit failed:\n'+failures.join('\n'));
 return {textFiles,workbooks,privateMarkers:denyTerms.length,developerInstructions:0,ok:true};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),index=args.indexOf('--deny-terms');
 const denyTerms=index<0?[]:JSON.parse(await fs.readFile(args[index+1],'utf8'));
 const file=args.find((v,i)=>!v.startsWith('--')&&(index<0||i!==index+1));
 if(!file)throw Error('Usage: node scripts/audit-release.mjs ZIP_PATH [--deny-terms JSON_PATH]');
 try{console.log(JSON.stringify(await auditRelease(await JSZip.loadAsync(await fs.readFile(file)),{denyTerms}),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
