import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {dataRoot} from './config.mjs';
import {settingsFile,defaults} from './settings.mjs';
await mkdir(path.dirname(settingsFile),{recursive:true});
try{await writeFile(settingsFile,JSON.stringify(defaults,null,2)+'\n',{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
for (const folder of ['', 'incoming', 'incoming/imported', 'reports', 'backups', 'exports']) {
  await mkdir(path.join(dataRoot, folder), {recursive:true});
}
// Exclusive creation protects an existing inventory, even on repeated setup.
try {
  await writeFile(path.join(dataRoot,'jobs.json'), JSON.stringify({schemaVersion:1,jobs:[]},null,2)+'\n', {flag:'wx'});
  console.log('Created empty inventory.');
} catch(error) {
  if(error.code!=='EEXIST')throw error;
  console.log('Existing inventory preserved.');
}
console.log(`Data: ${dataRoot}`);
