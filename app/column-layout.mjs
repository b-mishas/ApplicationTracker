// Shared display limits keep browser sizing and persisted-state validation consistent.
export const COLUMN_WIDTHS={fit:80,company:130.5,title:365,star:114,group:110,country:124,city:105,workMode:103.25,status:107,applicationDate:130,seniority:170,firstSeen:110,postedDate:110,assessmentBasis:143};
export const MIN_COLUMN_WIDTH=80,MAX_COLUMN_WIDTH=1200;
const minimumWidths={company:100,title:160,star:114,country:100,applicationDate:110};
export const minimumColumnWidth=key=>minimumWidths[key]??MIN_COLUMN_WIDTH;
export const clampColumnWidth=(key,width)=>Math.max(minimumColumnWidth(key),Math.min(MAX_COLUMN_WIDTH,Math.round(width)));
export function validColumnWidths(widths){
 return widths!==null&&typeof widths==='object'&&!Array.isArray(widths)
  &&Object.entries(widths).every(([key,width])=>Object.hasOwn(COLUMN_WIDTHS,key)&&Number.isInteger(width)&&width>=minimumColumnWidth(key)&&width<=MAX_COLUMN_WIDTH);
}
