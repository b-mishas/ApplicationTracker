import fs from 'node:fs/promises';
import {readSettings,saveSettings,settingsFile,ready} from './settings.mjs';
import {revision} from './store.mjs';
const args=process.argv.slice(2);
try{
 let settings;
 if(args.length){
  const [action,file]=args;
  if(!['--check','--apply'].includes(action)||!file)throw Error('Usage: settings-cli.mjs [--check FILE | --apply FILE]');
  settings=await readSettings(file);
  if(action==='--apply')await saveSettings(settings,revision(await fs.readFile(settingsFile,'utf8')));
 }else settings=await readSettings();
 console.log(JSON.stringify({settings,ready:ready(settings)},null,2));
}catch(e){console.error(e.message);process.exitCode=1;}
