// Shared user-owned stage history for the editor, storage and Excel export.
export const STATUS_VALUES=['New','Shortlisted','Applied','Interview','Offer','Rejected','Withdrawn','Dismissed'];
export const INTERVIEW_OUTCOMES=['Rejected','Offer','Withdrawn'];
export class StatusHistoryError extends Error{}
export function validStageDate(value,{allowEmpty=true}={}){
 return allowEmpty&&value===''||typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
}
export const MILESTONE_DATES = ['interviewDate', 'interviewOutcomeDate', 'offerDate'];

export function interviewDetails(job) {
 const history = Array.isArray(job.statusHistory) ? job.statusHistory : [];
 const interview = history.findLastIndex(event => event?.status === 'Interview');
 const result = interview < 0 ? undefined : history.slice(interview + 1).findLast(event => INTERVIEW_OUTCOMES.includes(event?.status));
 const hasInterview = job.status === 'Interview' || Object.hasOwn(job, 'interviewDate') || Boolean(job.interviewOutcome) || interview >= 0;
 const outcome = job.interviewOutcome ?? result?.status ?? (hasInterview && INTERVIEW_OUTCOMES.includes(job.status) ? job.status : '');
 return {
  hasInterview,
  interviewDate: job.interviewDate ?? (interview < 0 ? '' : history[interview].date),
  interviewOutcome: outcome,
  interviewOutcomeDate: job.interviewOutcomeDate ?? (result?.status === outcome && outcome !== 'Offer' ? result?.date || '' : ''),
  offerDate: job.offerDate ?? (result?.status === 'Offer' ? result.date : history.findLast(event => event?.status === 'Offer')?.date || '')
 };
}

export function effectiveStatus(job) {
 if (job.status !== 'Interview') return job.status;
 const {interviewOutcome} = interviewDetails(job);
 return INTERVIEW_OUTCOMES.includes(interviewOutcome) ? interviewOutcome : job.status;
}

export function validateMilestones(fields) {
 for (const key of MILESTONE_DATES) {
  if (Object.hasOwn(fields,key) && !validStageDate(fields[key])) throw new StatusHistoryError('Enter a valid ' + ({interviewDate:'interview date',interviewOutcomeDate:'outcome date',offerDate:'offer date'})[key] + '.');
 }
 if (Object.hasOwn(fields,'interviewOutcome') && !['', ...INTERVIEW_OUTCOMES].includes(fields.interviewOutcome)) throw new StatusHistoryError('Invalid interview outcome.');
}

export function updateStage(job, input, today) {
 const before = interviewDetails(job);
 const oldEffective = effectiveStatus(job);
 const statusChanged = input.status !== oldEffective;
 const explicitOutcome = Object.hasOwn(input, 'interviewOutcome');
 job.status = input.status;
 if (explicitOutcome && !before.hasInterview && !['Interview','Offer'].includes(job.status)) throw new StatusHistoryError('Record an interview before setting its outcome.');
 const hasInterview = before.hasInterview || job.status === 'Interview' || explicitOutcome || Boolean(input.interviewDate);
 if (hasInterview) {
  let outcome = before.interviewOutcome;
  if (statusChanged && job.status === 'Interview') outcome = '';
  if ((statusChanged || (!before.hasInterview && input.interviewDate)) && INTERVIEW_OUTCOMES.includes(job.status)) outcome = job.status;
  if (explicitOutcome) outcome = input.interviewOutcome;
  job.interviewDate = input.interviewDate ?? (before.hasInterview ? before.interviewDate : job.status === 'Interview' ? today : '');
  job.interviewOutcome = outcome;
  job.interviewOutcomeDate = outcome && outcome !== 'Offer' ? input.interviewOutcomeDate ?? (outcome === before.interviewOutcome || !statusChanged && !explicitOutcome ? before.interviewOutcomeDate : today) : '';
  if (explicitOutcome) job.status = outcome || 'Interview';
 }
 const becameOffer = effectiveStatus(job) === 'Offer' && oldEffective !== 'Offer';
 if (Object.hasOwn(input,'offerDate') || becameOffer) job.offerDate = input.offerDate ?? (before.offerDate || today);
}

function datedLabel(status, date, labels) {
 const label = labels[status] || status;
 return date ? label + ' ' + date.split('-').reverse().join('.') : label;
}

export function interviewHistoryText(job, labels = {}) {
 const details = interviewDetails(job);
 const status = effectiveStatus(job);
 if (!details.hasInterview) return status === 'Offer' && details.offerDate ? datedLabel(status, details.offerDate, labels) : '';
 const parts = [datedLabel('Interview', details.interviewDate, labels)];
 const outcome = details.interviewOutcome;
 if (outcome) parts.push(datedLabel(outcome, outcome === 'Offer' ? details.offerDate : details.interviewOutcomeDate, labels));
 if (status !== (outcome || 'Interview')) parts.push(datedLabel(status, status === 'Offer' ? details.offerDate : '', labels));
 return parts.join(' -> ');
}
