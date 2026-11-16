// missed Form 5472 penalty estimator. Deterministic and
// pure. Model (IRC § 6038A(d), IRS Instructions for Form 5472 "Penalties"):
//   - base: the penalty per form for each tax year a required Form 5472 was
//     not filed (one form per related party with reportable transactions);
//   - continuation (optional): when the IRS has mailed a notice of the failure
//     and the failure continues for more than 90 days after it, a further
//     penalty for each 30-day period, or part of one, per unfiled form named
//     in that notice. Without a stated count the estimator assumes the notice
//     covers every missed form (the statutory maximum, "per form").
// It is the statutory maximum exposure, not a bill: the IRS assesses, and
// relief for reasonable cause may be requested (never promised here).
import { FORM_5472_FACTS } from './form-5472-facts.ts';

export const PENALTY_INPUT_LIMITS = {
  yearsMissed: { min: 1, max: 10 },
  formsPerYear: { min: 1, max: 10 },
  daysSinceNotice: { min: 0, max: 3650 },
} as const;

export interface PenaltyInput {
  /** Tax years in which a required Form 5472 was not filed. */
  yearsMissed: number;
  /** Forms that were due each of those years (one per related party); usually 1 for a single-member LLC. */
  formsPerYear: number;
  /** Days since the IRS mailed a notice of the failure, when one was received and the forms are still unfiled. */
  daysSinceNotice?: number | null;
  /** Unfiled forms the notice names (defaults to every missed form: the maximum exposure). */
  formsInNotice?: number;
}

export interface PenaltyEstimate {
  yearsMissed: number;
  formsPerYear: number;
  /** yearsMissed × formsPerYear. */
  missedForms: number;
  baseUsd: number;
  /** 30-day periods (or parts) past the 90-day window; 0 without a notice. */
  continuationPeriods: number;
  /** Unfiled forms the continuation penalty is charged for (each period). */
  formsInNotice: number;
  continuationUsd: number;
  totalUsd: number;
}

function clampInt(value: number | null | undefined, min: number, max: number, fallback: number): number {
  if (value === null || value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

/**
 * Parses the "days since the notice" field. Returns the day count for a
 * whole number in PENALTY_INPUT_LIMITS.daysSinceNotice, `null` for an empty
 * field and `'invalid'` for anything else (negative, decimal, text, too large),
 * so a form can say so instead of silently treating it as zero.
 */
export function parseDaysSinceNotice(raw: string): number | null | 'invalid' {
  const value = raw.trim();
  if (value === '') return null;
  if (!/^\d+$/.test(value)) return 'invalid';
  const days = Number(value);
  const { min, max } = PENALTY_INPUT_LIMITS.daysSinceNotice;
  return days >= min && days <= max ? days : 'invalid';
}

export function continuationPeriods(daysSinceNotice: number): number {
  const over = daysSinceNotice - FORM_5472_FACTS.continuationGraceDays;
  if (over <= 0) return 0;
  return Math.ceil(over / FORM_5472_FACTS.continuationPeriodDays);
}

export function estimateForm5472Penalty(input: PenaltyInput): PenaltyEstimate {
  const limits = PENALTY_INPUT_LIMITS;
  const yearsMissed = clampInt(input.yearsMissed, limits.yearsMissed.min, limits.yearsMissed.max, limits.yearsMissed.min);
  const formsPerYear = clampInt(input.formsPerYear, limits.formsPerYear.min, limits.formsPerYear.max, limits.formsPerYear.min);
  const missedForms = yearsMissed * formsPerYear;
  const baseUsd = missedForms * FORM_5472_FACTS.penaltyPerFormUsd;

  const days = clampInt(input.daysSinceNotice, limits.daysSinceNotice.min, limits.daysSinceNotice.max, 0);
  const periods = continuationPeriods(days);
  const formsInNotice = clampInt(input.formsInNotice, 1, missedForms, missedForms);
  const continuationUsd = periods * formsInNotice * FORM_5472_FACTS.continuationPenaltyUsd;

  return {
    yearsMissed,
    formsPerYear,
    missedForms,
    baseUsd,
    continuationPeriods: periods,
    formsInNotice,
    continuationUsd,
    totalUsd: baseUsd + continuationUsd,
  };
}
