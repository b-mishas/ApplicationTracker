// A pastel categorical palette: keep the original four hues, then choose the
// colour whose nearest existing neighbour is furthest away in Oklab.
// Maximin selection follows the idea used by Glasbey categorical palettes.
// Oklab conversion: https://bottosson.github.io/posts/oklab/
const seedHues=[165,220,35,280];
function hslRgb(h,s,l){
 const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1));};
 return [f(0),f(8),f(4)];
}
function oklab(rgb){
 const [r,g,b]=rgb.map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
 const l=Math.cbrt(0.4122214708*r+0.5363325363*g+0.0514459929*b),m=Math.cbrt(0.2119034982*r+0.6806995451*g+0.1073969566*b),s=Math.cbrt(0.0883024619*r+0.2817188376*g+0.6299787005*b);
 return [0.2104542553*l+0.793617785*m-0.0040720468*s,1.9779984951*l-2.428592205*m+0.4505937099*s,0.0259040371*l+0.7827717662*m-0.808675766*s];
}
const distance=(a,b)=>a.reduce((sum,v,i)=>sum+(v-b[i])**2,0);
function swatch(hue){
 const fill=hslRgb(hue,.32,.91),ink=hslRgb(hue,.35,.29);
 return {hue,background:`hsl(${hue} 32% 91%)`,foreground:`hsl(${hue} 35% 29%)`,fill,ink,labFill:oklab(fill),labInk:oklab(ink)};
}
// Score both the light fill and its darker matching text. This keeps the soft
// original intensity while distinguishing the complete label, not only its fill.
const separation=(a,b)=>distance(a.labFill,b.labFill)+distance(a.labInk,b.labInk);
const palette=seedHues.map(swatch),candidates=Array.from({length:360},(_,h)=>swatch(h));
export function groupColour(index){
 if(!Number.isInteger(index)||index<0)throw Error('Invalid group colour index.');
 const target=Math.min(index,31);
 while(palette.length<=target){
  let best,bestDistance=-1;
  for(const candidate of candidates){const nearest=Math.min(...palette.map(previous=>separation(candidate,previous)));if(nearest>bestDistance){best=candidate;bestDistance=nearest;}}
  palette.push(best);
 }
 // Beyond 32 labels, continue through the hue wheel without a hard category cap.
 // Text labels remain essential: unlimited distinct colours are not possible.
 return index<32?palette[index]:swatch(Math.round((index*137.50776405003785)%360*1000)/1000);
}
export function assignGroupColours(groups,previous){
 const entries=previous?.version===1?Object.entries(previous.assignments||{}):[];
 const assignments=new Map(),used=new Set();
 for(const [name,index] of entries)if(name&&Number.isSafeInteger(index)&&index>=0&&!used.has(index)){assignments.set(name,index);used.add(index);}
 let next=0;
 for(const name of groups)if(typeof name==='string'&&name&&!assignments.has(name)){
  while(used.has(next))next++;
  assignments.set(name,next);used.add(next);
 }
 return {version:1,assignments:Object.fromEntries(assignments)};
}
export function ensureGroupColours(data){
 // Persist this automatic registry with normal inventory saves, so sorting,
 // removing or adding groups does not reshuffle colours on the next launch.
 data.groupColours=assignGroupColours(data.jobs.map(job=>job.group),data.groupColours);
 return data.groupColours;
}
