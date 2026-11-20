// Shared display limits keep browser sizing and persisted-state validation consistent.
export const COLUMN_WIDTHS={fit:80,company:130.5,title:365,star:114,group:110,country:124,city:105,workMode:103.25,status:107,applicationDate:114,lastInterview:114,seniority:170,firstSeen:110,postedDate:110,assessmentBasis:143};
export const MIN_COLUMN_WIDTH=80,MAX_COLUMN_WIDTH=1200;
const minimumWidths={company:100,title:160,star:114,country:100,applicationDate:110};
export const minimumColumnWidth=key=>minimumWidths[key]??MIN_COLUMN_WIDTH;
export const clampColumnWidth=(key,width)=>Math.max(minimumColumnWidth(key),Math.min(MAX_COLUMN_WIDTH,Math.round(width)));
export function validColumnWidths(widths){
 return widths!==null&&typeof widths==='object'&&!Array.isArray(widths)
  &&Object.entries(widths).every(([key,width])=>Object.hasOwn(COLUMN_WIDTHS,key)&&Number.isInteger(width)&&width>=minimumColumnWidth(key)&&width<=MAX_COLUMN_WIDTH);
}

// Named views start from explicit columns; each view can then remember user changes.
const standardColumns=['fit','company','group','title','star','country','city','workMode','status'];
const applicationColumns=standardColumns.filter(key=>key!=='star').concat('applicationDate');
export const PRESET_COLUMNS={
 Shortlisted:[...standardColumns,'postedDate'],
 New:[...standardColumns,'firstSeen'],
 Urgent:[...standardColumns,'postedDate'],
 'In progress':[...standardColumns,'applicationDate'],
 All:[...standardColumns],
 'Applied in total':[...applicationColumns],
 'Interviews in total':[...applicationColumns,'lastInterview'],
 'Offers in total':[...applicationColumns,'lastInterview'],
 Custom:[...standardColumns]
};
const dateSortedPresets=['In progress','All','Applied in total','Interviews in total','Offers in total'];
export function defaultColumnLayout(preset){
 const columns=[...(PRESET_COLUMNS[preset]??standardColumns)];
 return {columns,order:[...columns,...Object.keys(COLUMN_WIDTHS).filter(key=>!columns.includes(key))],widths:{},sort:dateSortedPresets.includes(preset)?'applicationDate':'star',direction:-1};
}

// Upgrade previously saved defaults once, while respecting later user customizations.
export const PRESET_DEFAULTS_VERSION=3;
export function upgradePresetLayouts(layouts,version=0){
 if(version>=PRESET_DEFAULTS_VERSION)return layouts;
 const upgraded={...layouts};let changed=false;
 const shortlisted=layouts.Shortlisted;
 if(version<1&&shortlisted&&!shortlisted.columns.includes('postedDate')){
  const order=shortlisted.order??defaultColumnLayout('Shortlisted').order;
  upgraded.Shortlisted={...shortlisted,columns:[...shortlisted.columns,'postedDate'],order:order.filter(key=>key!=='postedDate').concat('postedDate')};changed=true;
 }
 const applied=layouts['In progress'];
 if(version<2&&applied&&!applied.columns.includes('star')){
  const insertActions=keys=>{const order=keys.filter(key=>key!=='star');const title=order.indexOf('title');order.splice(title>=0?title+1:Math.max(0,order.indexOf('country')),0,'star');return order;};
  upgraded['In progress']={...applied,columns:insertActions(applied.columns),order:insertActions(applied.order??defaultColumnLayout('In progress').order)};changed=true;
 }
 if(version<3)for(const preset of dateSortedPresets.filter(name=>name!=='In progress')){
  const layout=upgraded[preset];
  if(layout?.sort==='star'&&layout.direction===-1){upgraded[preset]={...layout,sort:'applicationDate',direction:-1};changed=true;}
 }
 return changed?upgraded:layouts;
}
