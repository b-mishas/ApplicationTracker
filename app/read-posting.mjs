// Reads job postings as full plain text, without a model in between (WebFetch returns a summary, so its extracts were
// all "partial" on 24 Nov). Uses the ATS's public JSON detail endpoint where one exists, else the page's HTML.
//   node app/read-posting.mjs <posting url> [...]   one JSON line per URL: {url, source, chars, text, error}
// The text still needs reading: a page that loads its description by script gives little text (check `chars`), and then
// the browser's page text is the fallback.
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const decode = s => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
export const strip = html => decode(String(html || '')
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, '')
  .replace(/<(br|\/p|\/li|\/h\d|\/div|\/tr)[^>]*>/gi, '\n').replace(/<li[^>]*>/gi, '- ').replace(/<[^>]+>/g, ''))
  .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

// The public JSON endpoint for a posting URL, or null for plain HTML. `pick(json)` returns [title, location, html].
export function apiFor(raw) {
  const u = new URL(raw), host = u.hostname.toLowerCase(), parts = u.pathname.split('/').filter(Boolean);
  if (host === 'jobs.ashbyhq.com' && parts.length >= 2)
    return {source: 'ashby', url: `https://api.ashbyhq.com/posting-api/job-board/${parts[0]}`, pick: j => { const p = j.jobs.find(x => x.id === parts[1] || x.jobUrl === raw); return p && [p.title, p.location, p.descriptionHtml || p.descriptionPlain]; }};
  if (/(^|\.)greenhouse\.io$/.test(host) && parts.includes('jobs'))
    return {source: 'greenhouse', url: `https://boards-api.greenhouse.io/v1/boards/${parts[0]}/jobs/${parts[parts.indexOf('jobs') + 1]}`, pick: j => [j.title, j.location?.name, decode(j.content || '')]};
  if (host === 'apply.workable.com' && parts[1] === 'j')
    return {source: 'workable', url: `https://apply.workable.com/api/v2/accounts/${parts[0]}/jobs/${parts[2]}`, pick: j => [j.title, [j.location?.city, j.location?.country].filter(Boolean).join(', '), [j.description, j.requirements, j.benefits].join('\n')]};
  if (/^jobs(\.eu)?\.lever\.co$/.test(host) && parts.length >= 2)
    return {source: 'lever', url: `https://api.${host.includes('.eu.') ? 'eu.' : ''}lever.co/v0/postings/${parts[0]}/${parts[1]}`, pick: j => [j.text, j.categories?.location, [j.description, ...(j.lists || []).map(l => `<h3>${l.text}</h3>${l.content}`), j.additional].join('\n')]};
  const job = parts.indexOf('job');
  if (/\.myworkday(jobs|site)\.com$/.test(host) && job > 0) {
    // myworkdayjobs: /<site>/job/…, tenant = first host label; myworkdaysite: /recruiting/<tenant>/<site>/job/…
    const shared = host.endsWith('myworkdaysite.com'), site = parts[job - 1], tenant = shared ? parts[job - 2] : host.split('.')[0];
    return {source: 'workday', url: `https://${host}/wday/cxs/${tenant}/${site}/job/${parts.slice(job + 1).join('/')}`, pick: j => j.jobPostingInfo && [j.jobPostingInfo.title, j.jobPostingInfo.location, j.jobPostingInfo.jobDescription]};
  }
  return null;
}

export async function readPosting(url) {
  try {
    const api = apiFor(url);
    const res = await fetch(api ? api.url : url, {headers: {accept: api ? 'application/json' : 'text/html', 'user-agent': 'Mozilla/5.0 (compatible; job-posting-reader/1.0)'}, signal: AbortSignal.timeout(30000)});
    if (!res.ok) return {url, source: api?.source || 'html', chars: 0, text: '', error: `HTTP ${res.status}`};
    if (!api) { const text = strip(await res.text()); return {url, source: 'html', chars: text.length, text, error: ''}; }
    const got = api.pick(await res.json());
    if (!got) return {url, source: api.source, chars: 0, text: '', error: 'posting not in the board listing'};
    const text = [got[0], got[1], strip(got[2])].filter(Boolean).join('\n');
    return {url, source: api.source, chars: text.length, text, error: ''};
  } catch (e) { return {url, source: 'html', chars: 0, text: '', error: String(e.message || e).slice(0, 200)}; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const urls = process.argv.slice(2);
  if (!urls.length) { console.error('Usage: node app/read-posting.mjs <posting url> [...]'); process.exit(1); }
  for (const url of urls) console.log(JSON.stringify(await readPosting(url)));
}
