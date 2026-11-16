// "Wyoming or Delaware?" State-side cost of a single LLC over 1 to 10 years.
// Deterministic and pure: no network, no prices of any service company.
//   - year 1: the state formation filing fee (Wyoming: statutory fee plus the
//     online card-processing fee; Delaware: the Certificate of Formation fee);
//   - years 2..N: one state annual payment each (Wyoming annual report
//     license tax: the minimum, or the asset rate times Wyoming assets if
//     higher; Delaware LLC annual tax, flat);
//   - registered agent: optional, the yearly amount you type (every LLC needs
//     one; the price depends on the provider you choose).
// Figures were read from the official state pages on STATE_FEES_CHECKED_ON.
// States change fees: check the source URLs before you rely on a number.

export const STATE_FEES_CHECKED_ON = '2026-11-11';

export const STATE_FEES = {
  WY: {
    /** Articles of Organization statutory filing fee. */
    formationFeeUsd: 100,
    /** Online filing card-processing fee on top of the statutory fee (rate, with a minimum). */
    onlineCardFeeRate: 0.024,
    onlineCardFeeMinimumUsd: 1,
    /** Annual report license tax: this minimum, or assets located in Wyoming × rate if higher. */
    annualMinimumUsd: 60,
    annualAssetRate: 0.0002,
    feeScheduleUrl: 'https://sos.wyo.gov/Business/docs/BusinessFees.pdf',
    onlineFeeUrl: 'https://wyobiz.wyo.gov/Business/RegistrationInstr.aspx',
    annualUrl: 'https://wyobiz.wyo.gov/business/annualreport.aspx',
  },
  DE: {
    /** Certificate of Formation filing fee. */
    formationFeeUsd: 110,
    /** LLC annual tax (6 Del. C. § 18-1107), due on or before 1 June of the following year. */
    annualTaxUsd: 400,
    latePenaltyUsd: 200,
    monthlyInterestRate: 0.015,
    feeScheduleUrl: 'https://corpfiles.delaware.gov/Fee_Schedule/AugustFee2026.pdf',
    annualTaxUrl: 'https://corp.delaware.gov/paytaxes/',
  },
} as const;

export type CostState = keyof typeof STATE_FEES;

export const MAX_YEARS = 10;

export interface StateCostInput {
  state: CostState;
  /** 1..MAX_YEARS (clamped). */
  years: number;
  /** Registered agent cost per year, from year 1 (default 0 = not counted). */
  raPerYearUsd?: number | null;
  /** Wyoming only: assets located in Wyoming. */
  wyomingAssetsUsd?: number | null;
}

export interface StateCostYearRow {
  year: number;
  formationUsd: number;
  annualUsd: number;
  raUsd: number;
  totalUsd: number;
}

export interface StateCostResult {
  state: CostState;
  years: number;
  formationUsd: number;
  annualPerYearUsd: number;
  raPerYearUsd: number;
  rows: StateCostYearRow[];
  totalUsd: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function nonNegative(value: number | null | undefined): number {
  return value !== null && value !== undefined && Number.isFinite(value) && value > 0 ? value : 0;
}

/** Wyoming formation: statutory fee + online card fee (rate, at least the minimum). */
export function wyomingFormationUsd(): number {
  const { formationFeeUsd, onlineCardFeeRate, onlineCardFeeMinimumUsd } = STATE_FEES.WY;
  return round2(formationFeeUsd + Math.max(onlineCardFeeMinimumUsd, formationFeeUsd * onlineCardFeeRate));
}

/** Wyoming annual report license tax for the given Wyoming assets (minimum when none). */
export function wyomingAnnualUsd(assetsUsd?: number | null): number {
  const { annualMinimumUsd, annualAssetRate } = STATE_FEES.WY;
  return round2(Math.max(annualMinimumUsd, nonNegative(assetsUsd) * annualAssetRate));
}

export function clampYears(years: number): number {
  if (!Number.isFinite(years)) return 1;
  return Math.min(MAX_YEARS, Math.max(1, Math.floor(years)));
}

export function stateCost(input: StateCostInput): StateCostResult {
  const years = clampYears(input.years);
  const formationUsd = input.state === 'WY' ? wyomingFormationUsd() : STATE_FEES.DE.formationFeeUsd;
  const annualPerYearUsd = input.state === 'WY' ? wyomingAnnualUsd(input.wyomingAssetsUsd) : STATE_FEES.DE.annualTaxUsd;
  const raPerYearUsd = round2(nonNegative(input.raPerYearUsd));

  const rows: StateCostYearRow[] = [];
  for (let year = 1; year <= years; year += 1) {
    const first = year === 1;
    const formation = first ? formationUsd : 0;
    const annual = first ? 0 : annualPerYearUsd;
    rows.push({ year, formationUsd: formation, annualUsd: annual, raUsd: raPerYearUsd, totalUsd: round2(formation + annual + raPerYearUsd) });
  }
  return {
    state: input.state,
    years,
    formationUsd,
    annualPerYearUsd,
    raPerYearUsd,
    rows,
    totalUsd: round2(rows.reduce((sum, row) => sum + row.totalUsd, 0)),
  };
}
