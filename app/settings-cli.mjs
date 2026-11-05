import fs from 'node:fs/promises';
import {readSettings,validateSettings,saveSettings,settingsFile,ready} from './settings.mjs';
import {revision} from './store.mjs';
const args=process.argv.slice(2);
try{
 let settings;
 if(args[0]==='--check')settings=validateSettings(JSON.parse(await fs.readFile(args[1],'utf8')));
 else if(args[0]==='--apply'){
  settings=validateSettings(JSON.parse(await fs.readFile(args[1],'utf8')));
  await saveSettings(settings,revision(await fs.readFile(settingsFile,'utf8')));
 }else if(args.length)throw Error('Usage: settings-cli.mjs [--check FILE | --apply FILE]');
 else settings=await readSettings();
 console.log(JSON.stringify({settings,ready:ready(settings)},null,2));
}catch(e){console.error(e.message);process.exitCode=1;}
