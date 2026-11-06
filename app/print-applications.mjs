import {calendarDate} from './settings.mjs';

const text={en:{print:'Print / Save as PDF',empty:'No applications to export.'},de:{print:'Drucken / Als PDF speichern',empty:'Keine Bewerbungen zum Exportieren.'}};
const htmlEntities={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,character=>htmlEntities[character]);

export function applicationPrintPage({rows,labels,title='Application export',language='en',error}){
 const report=error
  ? `<p role="alert">${escapeHtml(error)}</p>`
  : `<table>
<colgroup><col style="width:13%"><col style="width:17%"><col style="width:14%"><col style="width:30%"><col style="width:26%"></colgroup>
<thead><tr>${labels.headers.map(label=>`<th scope="col">${escapeHtml(label)}</th>`).join('')}</tr></thead>
<tbody>${rows.map(({date,values,closed})=>`<tr${closed?' class="closed"':''}>${[date,...values.slice(1)].map(value=>`<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('\n')}</tbody>
</table>${rows.length?'':`<p>${text[language].empty}</p>`}`;
 return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>applications_${calendarDate(new Date())}</title>
<style>
@page { size: A4 landscape; margin: 12mm; }
* { box-sizing: border-box; }
body { font: 11pt/1.35 Calibri, Arial, sans-serif; color: #253331; }
main { max-width: 1100px; margin: 24px auto; padding: 0 16px; }
h1 { font-size: 20pt; margin: 0 0 12px; break-after: avoid; overflow-wrap: anywhere; }
button { font: inherit; padding: 6px 12px; margin-bottom: 12px; cursor: pointer; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
thead { display: table-header-group; }
tr { break-inside: avoid; }
th, td { padding: 5px 7px; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
th { background: #e1eae3; color: #234635; border-bottom: 2px solid #46624e; }
td { border-bottom: 1px solid #dbe4dd; white-space: pre-wrap; }
td:first-child { white-space: nowrap; }
tbody tr:nth-child(even) { background: #f1f4ef; }
.closed { color: #666; }
[role="alert"] { white-space: pre-wrap; }
@media print {
 body { margin: 0; print-color-adjust: exact; }
 main { max-width: none; margin: 0; padding: 0; }
 button { display: none; }
}
</style>
</head>
<body><main>
<h1>${escapeHtml(title)}</h1>
${error?'':`<button type="button" id="print">${text[language].print}</button>`}
${report}
</main>
${error?'':`<script>
document.getElementById('print').addEventListener('click', () => window.print());
window.addEventListener('load', () => window.print());
</script>`}
</body>
</html>`;
}
