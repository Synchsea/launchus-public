// The federal Form 5472 figures used by the free tools.
// Source: IRS Instructions for Form 5472 (rev. December 2023), "Penalties" and
// "When and Where To File"; IRC § 6038A(d). Checked on FORM_5472_FACTS_CHECKED_ON.
// Not tax advice: the tools only estimate and point to a tax professional.

/** Date the IRS pages behind these figures were last opened for the tools. */
export const FORM_5472_FACTS_CHECKED_ON = '2026-11-03';

export const FORM_5472_FACTS = {
  /** IRC § 6038A(d)(1): the penalty for each failure to file (or to keep records), per Form 5472, per tax year. */
  penaltyPerFormUsd: 25_000,
  /** § 6038A(d)(2): the continuation penalty starts this many days after the IRS mails a notice of the failure. */
  continuationGraceDays: 90,
  /** ... and is charged again for each period of this many days (or part of one) the failure continues. */
  continuationPeriodDays: 30,
  /** The continuation penalty per period, per form. */
  continuationPenaltyUsd: 25_000,
  /** Calendar-year filer: the 15th day of the 4th month after the tax year (15 April of the next year). */
  dueMonth: 4,
  dueDay: 15,
  /** With Form 7004 (automatic six-month extension of time to file): 15 October of the next year. */
  extendedDueMonth: 10,
  extendedDueDay: 15,
  instructionsUrl: 'https://www.irs.gov/instructions/i5472',
  aboutFormUrl: 'https://www.irs.gov/forms-pubs/about-form-5472',
  form7004Url: 'https://www.irs.gov/forms-pubs/about-form-7004',
  /** Penalty relief for reasonable cause (the IRS decides; nothing is promised). */
  reasonableCauseUrl: 'https://www.irs.gov/payments/penalty-relief-for-reasonable-cause',
  /** The statute, for the citation line. */
  statuteUrl: 'https://www.law.cornell.edu/uscode/text/26/6038A',
} as const;

export interface Form5472Deadlines {
  /** YYYY-MM-DD: the regular due date of the tax year's Form 5472 (with the pro forma Form 1120). */
  dueDate: string;
  /** YYYY-MM-DD: the due date when Form 7004 is filed on time. */
  extendedDueDate: string;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Due dates for a calendar tax year. The IRS moves a due date that falls on a
 * weekend or a legal holiday to the next business day; callers should say so; this
 * function does not shift the date.
 */
export function form5472Deadlines(taxYear: number): Form5472Deadlines {
  if (!Number.isInteger(taxYear) || taxYear < 1900) throw new RangeError(`not a tax year: ${taxYear}`);
  const next = taxYear + 1;
  return {
    dueDate: `${next}-${pad(FORM_5472_FACTS.dueMonth)}-${pad(FORM_5472_FACTS.dueDay)}`,
    extendedDueDate: `${next}-${pad(FORM_5472_FACTS.extendedDueMonth)}-${pad(FORM_5472_FACTS.extendedDueDay)}`,
  };
}

/** "15 Nisan 2027" / "April 15, 2027" for a YYYY-MM-DD day. */
export function formatToolDate(day: string, locale: 'tr' | 'en', { withYear = true }: { withYear?: boolean } = {}): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** The regular and extended due dates without a year ("15 Nisan", "April 15"). */
export function form5472DueDayLabels(locale: 'tr' | 'en'): { due: string; extended: string } {
  const { dueDate, extendedDueDate } = form5472Deadlines(2026);
  return {
    due: formatToolDate(dueDate, locale, { withYear: false }),
    extended: formatToolDate(extendedDueDate, locale, { withYear: false }),
  };
}
