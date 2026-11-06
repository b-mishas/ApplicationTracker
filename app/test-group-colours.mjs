import assert from 'node:assert/strict';
import {assignGroupColours,groupColour,ensureGroupColours} from './group-colours.mjs';
const names=['First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth'];
const original=assignGroupColours(names);
assert.deepEqual([0,1,2,3].map(i=>groupColour(i).hue),[165,220,35,280]);
assert.equal(new Set(names.map(name=>groupColour(original.assignments[name]).background)).size,8);
const reordered=assignGroupColours([...names].reverse(),original);assert.deepEqual(reordered,original);
const removed=assignGroupColours(names.slice(2),original);assert.deepEqual(removed,original);
const added=assignGroupColours(['Ninth',...names],original);for(const name of names)assert.equal(added.assignments[name],original.assignments[name]);assert.equal(added.assignments.Ninth,8);
const tricky=assignGroupColours(['AB','BA','__proto__','constructor']);assert.equal(new Set(Object.values(tricky.assignments)).size,4);
const luminance=rgb=>rgb.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
let minInk=Infinity,minFill=Infinity,minContrast=Infinity;
for(let i=0;i<8;i++){
 const colour=groupColour(i),contrast=(luminance(colour.fill)+.05)/(luminance(colour.ink)+.05);minContrast=Math.min(minContrast,contrast);assert(contrast>=4.5);
 for(let j=0;j<i;j++){minInk=Math.min(minInk,distance(colour.labInk,groupColour(j).labInk));minFill=Math.min(minFill,distance(colour.labFill,groupColour(j).labFill));}
}
assert(minInk>.035);assert(minFill>.009);
const data={schemaVersion:1,jobs:[{id:'one',group:'First',notes:'Keep me'}],groupColours:original};ensureGroupColours(data);assert.equal(data.jobs[0].notes,'Keep me');assert.equal(data.jobs[0].id,'one');assert.deepEqual(data.groupColours,original);
assert(groupColour(100).background.startsWith('hsl('));
console.log('PASS: original four group colours; eight distinct pastels; stable assignments across reordering/removal/addition/reload metadata; safe names; text contrast >=4.5:1.');
console.log(JSON.stringify({hues:Array.from({length:8},(_,i)=>groupColour(i).hue),minInkOklab:minInk,minFillOklab:minFill,minContrast}));
