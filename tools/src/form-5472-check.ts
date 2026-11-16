// "Do I need Form 5472?" Deterministic yes/no decision
// over six answers, no LLM, no network. The rule it encodes (IRS Instructions
// for Form 5472, "Who Must File" and the foreign-owned U.S. disregarded entity
// rules, Treas. Reg. § 1.6038A-1(c)): a US LLC with ONE owner that is a
// foreign person is treated as a corporation for § 6038A and must file Form
// 5472 (with a pro forma Form 1120) for each tax year in which it has a
// reportable transaction with that owner or another related party. Capital
// contributions, the owner paying formation costs, loans and distributions all
// count. A multi-member LLC is a partnership by default and follows other
// rules, so the tool sends that case to a tax professional. Any "unsure"
// answer does the same. The result is an estimate, never tax advice.
import { form5472Deadlines, type Form5472Deadlines } from './form-5472-facts.ts';

export type YesNoUnsure = 'yes' | 'no' | 'unsure';
export type MemberCount = 'single' | 'multi' | 'unsure';

export interface Form5472Answers {
  /** Q1: the company is a US LLC (formed in a US state). */
  usLlc?: YesNoUnsure;
  /** Q2: one owner (single-member) or more (multi-member). */
  members?: MemberCount;
  /** Q3: the owner is a foreign person (not a US citizen, green-card holder or US tax resident). */
  foreignOwner?: YesNoUnsure;
  /** Q4: the LLC elected to be taxed as a corporation (Form 8832 / 2553). */
  corporateElection?: YesNoUnsure;
  /** Q5: any money or property moved between the LLC and the owner (or a related party) in the tax year. */
  reportableTransaction?: YesNoUnsure;
  /** Q6: the LLC was formed in the tax year being checked. */
  formedThisYear?: YesNoUnsure;
}

export const FORM_5472_QUESTION_IDS = [
  'usLlc',
  'members',
  'foreignOwner',
  'corporateElection',
  'reportableTransaction',
  'formedThisYear',
] as const satisfies readonly (keyof Form5472Answers)[];
export type Form5472QuestionId = (typeof FORM_5472_QUESTION_IDS)[number];

export type Form5472Outcome = 'likelyRequired' | 'likelyNotRequired' | 'askProfessional';

export type Form5472Reason =
  /** Q1 = no: the tool covers US LLCs only. */
  | 'notUsLlc'
  /** Q3 = no: a US-owned single-member LLC files no Form 5472. */
  | 'usOwner'
  /** Q2 = multi: partnership rules (or a corporate election) apply. */
  | 'multiMember'
  /** Q4 = yes: an LLC taxed as a corporation files Form 1120; 25% foreign ownership tests apply. */
  | 'corporateElection'
  /** Q5 = yes on a foreign-owned single-member LLC. */
  | 'reportableTransaction'
  /** Q5 = no but Q6 = yes: paying the formation costs is itself usually a reportable transaction. */
  | 'formationCostsUsuallyCount'
  /** Q5 = no and Q6 = no: no reportable transaction in the year. */
  | 'noTransaction'
  /** An answer was "unsure". */
  | 'unsure';

export interface Form5472Result {
  outcome: Form5472Outcome;
  reason: Form5472Reason;
  /** Due dates of the checked tax year's filing (shown with every outcome except "not a US LLC" / "US owner"). */
  deadlines: Form5472Deadlines | null;
}

/** Which questions are asked, in order, given the answers so far (later questions are skipped when an earlier one decides). */
export function visibleForm5472Questions(answers: Form5472Answers): Form5472QuestionId[] {
  const shown: Form5472QuestionId[] = ['usLlc'];
  if (answers.usLlc !== 'yes') return shown;
  shown.push('members');
  if (answers.members !== 'single') return shown;
  shown.push('foreignOwner');
  if (answers.foreignOwner !== 'yes') return shown;
  shown.push('corporateElection');
  if (answers.corporateElection !== 'no') return shown;
  shown.push('reportableTransaction');
  if (answers.reportableTransaction !== 'no') return shown;
  shown.push('formedThisYear');
  return shown;
}

/**
 * The outcome for a complete path of answers, or `null` while a question on
 * the path is still unanswered. `taxYear` is the year being checked (the
 * calendar year; pass the current year to check this year).
 */
export function checkForm5472(answers: Form5472Answers, taxYear: number): Form5472Result | null {
  const deadlines = form5472Deadlines(taxYear);
  const ask = (reason: Form5472Reason): Form5472Result => ({ outcome: 'askProfessional', reason, deadlines });

  switch (answers.usLlc) {
    case undefined:
      return null;
    case 'no':
      return { outcome: 'likelyNotRequired', reason: 'notUsLlc', deadlines: null };
    case 'unsure':
      return ask('unsure');
    default:
      break;
  }

  switch (answers.members) {
    case undefined:
      return null;
    case 'multi':
      return ask('multiMember');
    case 'unsure':
      return ask('unsure');
    default:
      break;
  }

  switch (answers.foreignOwner) {
    case undefined:
      return null;
    case 'no':
      return { outcome: 'likelyNotRequired', reason: 'usOwner', deadlines: null };
    case 'unsure':
      return ask('unsure');
    default:
      break;
  }

  switch (answers.corporateElection) {
    case undefined:
      return null;
    case 'yes':
      return ask('corporateElection');
    case 'unsure':
      return ask('unsure');
    default:
      break;
  }

  switch (answers.reportableTransaction) {
    case undefined:
      return null;
    case 'yes':
      return { outcome: 'likelyRequired', reason: 'reportableTransaction', deadlines };
    case 'unsure':
      return ask('unsure');
    default:
      break;
  }

  switch (answers.formedThisYear) {
    case undefined:
      return null;
    case 'yes':
      return ask('formationCostsUsuallyCount');
    case 'unsure':
      return ask('unsure');
    default:
      return { outcome: 'likelyNotRequired', reason: 'noTransaction', deadlines };
  }
}
