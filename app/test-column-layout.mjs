import assert from 'node:assert/strict';
import {COLUMN_WIDTHS,PRESET_COLUMNS,defaultColumnLayout,PRESET_DEFAULTS_VERSION,upgradePresetLayouts} from './column-layout.mjs';
const standard=['fit','company','group','title','star','country','city','workMode','status'];
const applied=standard.filter(key=>key!=='star').concat('applicationDate');
const expected={Shortlisted:[...standard,'postedDate'],New:[...standard,'firstSeen'],Urgent:[...standard,'postedDate'],'In progress':[...standard,'applicationDate'],All:standard,'Applied in total':applied,'Interviews in total':[...applied,'lastInterview'],'Offers in total':[...applied,'lastInterview']};
for(const [preset,columns] of Object.entries(expected)){
 const layout=defaultColumnLayout(preset);
 assert.deepEqual(layout.columns,columns,preset);
 assert.deepEqual(layout.order.filter(key=>layout.columns.includes(key)),columns,preset+' visible order');
 assert.equal(new Set(layout.order).size,Object.keys(COLUMN_WIDTHS).length);
 assert(layout.order.every(key=>Object.hasOwn(COLUMN_WIDTHS,key)));
 layout.columns.pop();layout.order.reverse();layout.widths.company=200;
 assert.deepEqual(defaultColumnLayout(preset).columns,columns,'Defaults must not be mutated');
 assert.deepEqual(defaultColumnLayout(preset).widths,{});
}
assert.equal(defaultColumnLayout('In progress').sort,'applicationDate');
assert.deepEqual(defaultColumnLayout('Custom').columns,standard);
assert(Object.hasOwn(PRESET_COLUMNS,'Offers in total'));
console.log('PASS: all eight presets have the requested visible column order, complete independent layouts and unchanged Applied sorting.');

const saved={Shortlisted:{columns:[...standard],order:Object.keys(COLUMN_WIDTHS),widths:{company:220},sort:'company',direction:1},New:defaultColumnLayout('New')};
const upgraded=upgradePresetLayouts(saved);
assert.equal(upgraded.Shortlisted.columns.at(-1),'postedDate');
assert.equal(upgraded.Shortlisted.order.at(-1),'postedDate');
assert.deepEqual(upgraded.Shortlisted.widths,{company:220});assert.equal(upgraded.Shortlisted.sort,'company');
assert.equal(upgraded.New,saved.New);assert(!saved.Shortlisted.columns.includes('postedDate'));
const deliberatelyHidden={Shortlisted:{...upgraded.Shortlisted,columns:[...standard]}};
assert.equal(upgradePresetLayouts(deliberatelyHidden,PRESET_DEFAULTS_VERSION),deliberatelyHidden);
console.log('PASS: old Shortlisted layouts upgrade once, preserve other settings/views and respect later intentional hiding.');

const oldApplied={...defaultColumnLayout('In progress'),columns:[...applied],widths:{company:220}};
const versionOne={Shortlisted:{...deliberatelyHidden.Shortlisted},'In progress':oldApplied,'Applied in total':defaultColumnLayout('Applied in total')};
const versionTwo=upgradePresetLayouts(versionOne,1);
assert.deepEqual(versionTwo['In progress'].columns,[...standard,'applicationDate']);
assert.deepEqual(versionTwo['In progress'].widths,{company:220});
assert.equal(versionTwo['In progress'].sort,'applicationDate');
assert.equal(versionTwo.Shortlisted,versionOne.Shortlisted,'Do not repeat the earlier Posted migration');
assert.equal(versionTwo['Applied in total'],versionOne['Applied in total']);
const hiddenAgain={'In progress':oldApplied};assert.equal(upgradePresetLayouts(hiddenAgain,2),hiddenAgain);
console.log('PASS: Applied retains Actions, upgrades old saved layouts once and leaves Applications sent and prior manual choices unchanged.');

for(const preset of ['All','Applied in total','Interviews in total','Offers in total']){
 assert.equal(defaultColumnLayout(preset).sort,'applicationDate');assert.equal(defaultColumnLayout(preset).direction,-1);
 const old={...defaultColumnLayout(preset),sort:'star',widths:{company:240}};
 const updated=upgradePresetLayouts({[preset]:old},2)[preset];
 assert.equal(updated.sort,'applicationDate');assert.deepEqual(updated.widths,old.widths);
 const custom={...old,sort:'company',direction:1};assert.equal(upgradePresetLayouts({[preset]:custom},2)[preset],custom);
 const later={[preset]:old};assert.equal(upgradePresetLayouts(later,3),later);
}
console.log('PASS: statistics default to descending application date; old defaults upgrade once while custom sorting is preserved.');
