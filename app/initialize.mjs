import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {dataRoot} from './config.mjs';
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