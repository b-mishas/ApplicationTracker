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
 // An explicit empty date suppresses legacy dates; current status still counts.
 // Only records without the modern field may use a dated legacy event.
 const interviewDate = job.interviewDate ?? (interview < 0 ? '' : history[interview].date);
 const hasInterview = effectiveStatus(job) === 'Interview' || validStageDate(interviewDate,{allowEmpty:false});
 const outcome = hasInterview && INTERVIEW_OUTCOMES.includes(effectiveStatus(job)) ? effectiveStatus(job) : '';
 return {
  hasInterview,
  interviewDate: validStageDate(interviewDate,{allowEmpty:false}) ? interviewDate : '',
  interviewOutcome: outcome,
  interviewOutcomeDate: job.interviewOutcomeDate ?? (result?.status === outcome && outcome !== 'Offer' ? result?.date || '' : ''),
  offerDate: job.offerDate ?? (result?.status === 'Offer' ? result.date : history.findLast(event => event?.status === 'Offer')?.date || '')
 };
}

// Compatibility for older records; new saves keep only the main status.
export function effectiveStatus(job) {
 if (job.status === 'Interview' && INTERVIEW_OUTCOMES.includes(job.interviewOutcome)) return job.interviewOutcome;
 return job.status;
}

export function hasSentApplication(job) {
 const history = Array.isArray(job.statusHistory) ? job.statusHistory : [];
 const date = job.applicationDate ?? history.findLast(event => event?.status === 'Applied')?.date;
 return validStageDate(date,{allowEmpty:false}) || ['Applied','Interview','Offer'].includes(effectiveStatus(job));
}

export function isRejectedAfterInterview(job) {
 return effectiveStatus(job) === 'Rejected' && interviewDetails(job).hasInterview;
}

export function hasReceivedOffer(job) {
 return effectiveStatus(job)==='Offer' || validStageDate(interviewDetails(job).offerDate,{allowEmpty:false});
}

export function validateMilestones(fields) {
 for (const key of MILESTONE_DATES) {
  if (Object.hasOwn(fields,key) && !validStageDate(fields[key])) throw new StatusHistoryError('Enter a valid ' + ({interviewDate:'interview date',interviewOutcomeDate:'outcome date',offerDate:'offer date'})[key] + '.');
 }
 if (Object.hasOwn(fields,'interviewOutcome') && !['', ...INTERVIEW_OUTCOMES].includes(fields.interviewOutcome)) throw new StatusHistoryError('Invalid interview outcome.');
}

export function updateStage(job, input, today) {
 const before = interviewDetails(job), oldStatus = effectiveStatus(job);
 const legacyOutcome = Object.hasOwn(input,'interviewOutcome');
 if (legacyOutcome && !before.hasInterview && !['Interview','Offer'].includes(input.status)) throw new StatusHistoryError('Record an interview before setting its outcome.');
 let status = legacyOutcome ? input.interviewOutcome || 'Interview' : input.status;
 // Clearing a recorded application date corrects a pending application back to the shortlist.
 // Undated legacy applications and deliberate moves to other stages stay unchanged.
 if(oldStatus==='Applied'&&status==='Applied'&&job.applicationDate&&input.applicationDate==='')status='Shortlisted';
 const changed = status !== oldStatus;
 job.status = status;
 delete job.interviewOutcome;
 // A real transition gets a new application date; ordinary saves keep edits/clears.
 if (Object.hasOwn(input,'applicationDate') || status === 'Applied' && changed) job.applicationDate = input.applicationDate ?? today;
 // Backward corrections remove later milestones, including their legacy fallbacks.
 if (changed && ['New','Shortlisted','Applied'].includes(status)) {
  for (const key of MILESTONE_DATES) job[key]='';
  return;
 }
 if (before.hasInterview || status === 'Interview' || input.interviewDate) {
  job.interviewDate = input.interviewDate ?? before.interviewDate;
 }
 if (['Rejected','Withdrawn'].includes(status)) {
  job.interviewOutcomeDate = input.interviewOutcomeDate ?? (changed ? today : before.interviewOutcomeDate);
 } else if (changed) job.interviewOutcomeDate='';
 if (status === 'Interview' && changed) job.offerDate='';
 if (Object.hasOwn(input,'offerDate') || status === 'Offer' && changed) job.offerDate = input.offerDate ?? today;
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
