// Exercise the actual frontend helper with a small DOM/timer stand-in.
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=await readFile(new URL('./app.js',import.meta.url),'utf8');
const helper=source.slice(source.indexOf('let noticeTimer,'),source.indexOf('let supportedCountries'));
assert(helper.startsWith('let noticeTimer,'));
const target={hidden:true,textContent:'',dataset:{},setAttribute(key,value){this[key]=value;}};
const timers=new Map();let nextId=0;
const context=vm.createContext({
 $:id=>{assert.equal(id,'page-notice');return target;},
 setTimeout:(callback,delay)=>{assert.equal(delay,2000);timers.set(++nextId,callback);return nextId;},
 clearTimeout:id=>timers.delete(id)
});
vm.runInContext(helper,context);
const show=(text,type)=>vm.runInContext(`showMessage(${JSON.stringify(text)},${JSON.stringify(type)})`,context);
show('Saved','success');assert.equal(target.hidden,false);assert.equal(target.role,'status');
assert.equal(timers.size,1);timers.values().next().value();assert.equal(target.hidden,true);
show('Saved','success');const staleCallback=timers.values().next().value;
show('Save edits first','warning');assert.equal(target.dataset.type,'warning');assert.equal(target.role,'alert');
assert.equal(timers.size,0,'Warnings do not expire');staleCallback();assert.equal(target.textContent,'Save edits first');assert.equal(target.hidden,false);
target.onclick();assert.equal(target.hidden,true);assert.equal(target.textContent,'');
show('Save failed','error');assert.equal(timers.size,0);assert.equal(target.role,'alert');assert.equal(target.dataset.type,'error');
target.onclick();assert.equal(target.hidden,true);
show('<script>unsafe</script>','warning');assert.equal(target.textContent,'<script>unsafe</script>','Messages use text, not HTML');
vm.runInContext('clearMessage()',context);assert.equal(target.hidden,true);
assert(!source.includes("$('message')"),'No page messages use the former table banner');
console.log('Page notice: two-second success, persistent warning/error, click dismissal and stale-timer safety passed.');
