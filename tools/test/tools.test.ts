import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FORM_5472_FACTS, form5472Deadlines } from '../src/form-5472-facts.ts';
import { checkForm5472, visibleForm5472Questions } from '../src/form-5472-check.ts';
import { estimateForm5472Penalty, parseDaysSinceNotice } from '../src/form-5472-penalty.ts';
import { stateCost, wyomingAnnualUsd, wyomingFormationUsd } from '../src/state-cost.ts';

const foreignSingle = { usLlc: 'yes', members: 'single', foreignOwner: 'yes', corporateElection: 'no' } as const;

test('Form 5472 due dates: 15 April, 15 October with Form 7004', () => {
  assert.deepEqual(form5472Deadlines(2026), { dueDate: '2027-04-15', extendedDueDate: '2027-10-15' });
  assert.equal(FORM_5472_FACTS.penaltyPerFormUsd, 25_000);
});

test('checkForm5472: foreign-owned single-member LLC with a transaction is likely required', () => {
  const r = checkForm5472({ ...foreignSingle, reportableTransaction: 'yes' }, 2026);
  assert.equal(r?.outcome, 'likelyRequired');
  assert.equal(r?.deadlines?.dueDate, '2027-04-15');
});

test('checkForm5472: formed this year without other transactions -> ask a professional', () => {
  const r = checkForm5472({ ...foreignSingle, reportableTransaction: 'no', formedThisYear: 'yes' }, 2026);
  assert.equal(r?.outcome, 'askProfessional');
  assert.equal(r?.reason, 'formationCostsUsuallyCount');
});

test('checkForm5472: US owner, multi-member, unsure and incomplete paths', () => {
  assert.equal(checkForm5472({ usLlc: 'yes', members: 'single', foreignOwner: 'no' }, 2026)?.reason, 'usOwner');
  assert.equal(checkForm5472({ usLlc: 'yes', members: 'multi' }, 2026)?.reason, 'multiMember');
  assert.equal(checkForm5472({ usLlc: 'unsure' }, 2026)?.reason, 'unsure');
  assert.equal(checkForm5472({ usLlc: 'yes' }, 2026), null);
  assert.deepEqual(visibleForm5472Questions({ usLlc: 'no' }), ['usLlc']);
});

test('penalty: base and continuation per 30-day period after 90 days', () => {
  assert.equal(estimateForm5472Penalty({ yearsMissed: 2, formsPerYear: 1 }).totalUsd, 50_000);
  assert.equal(estimateForm5472Penalty({ yearsMissed: 1, formsPerYear: 1, daysSinceNotice: 90 }).continuationUsd, 0);
  assert.equal(estimateForm5472Penalty({ yearsMissed: 1, formsPerYear: 1, daysSinceNotice: 121 }).continuationPeriods, 2);
  assert.equal(parseDaysSinceNotice('-3'), 'invalid');
  assert.equal(parseDaysSinceNotice(''), null);
});

test('state cost: Wyoming and Delaware over several years', () => {
  assert.equal(wyomingFormationUsd(), 102.4);
  assert.equal(wyomingAnnualUsd(1_000_000), 200);
  assert.equal(wyomingAnnualUsd(null), 60);
  assert.equal(stateCost({ state: 'WY', years: 3 }).totalUsd, 222.4);
  assert.equal(stateCost({ state: 'DE', years: 3 }).totalUsd, 910);
  assert.equal(stateCost({ state: 'DE', years: 2, raPerYearUsd: 100 }).totalUsd, 710);
  assert.equal(stateCost({ state: 'WY', years: 99 }).years, 10);
});
