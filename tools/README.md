# LaunchUS US LLC tools

Free, dependency-free TypeScript calculators for foreign-owned US LLCs. They run the free tools on [launchus.app/en/tools](https://launchus.app/en/tools). MIT license.

| Module | What it does | Live tool |
|---|---|---|
| `src/form-5472-check.ts` | Six yes/no questions → is Form 5472 (with pro forma Form 1120) likely required for this tax year? Returns the due dates. | [Do I need Form 5472?](https://launchus.app/en/tools/do-i-need-form-5472) |
| `src/form-5472-penalty.ts` | Statutory maximum penalty for missed Form 5472 filings: $25,000 per form per year, plus the continuation penalty after an IRS notice (IRC § 6038A(d)). | [Penalty calculator](https://launchus.app/en/tools/form-5472-penalty-calculator) |
| `src/form-5472-facts.ts` | The IRS figures and source URLs the two tools use; due dates (15 April, 15 October with Form 7004). | — |
| `src/state-cost.ts` | Wyoming vs Delaware state-side cost over 1–10 years: formation fee, annual report / annual tax, optional registered agent cost. | [Wyoming vs Delaware](https://launchus.app/en/tools/wyoming-vs-delaware-cost-calculator) |

## Use

Requires Node.js 22.18+ (runs `.ts` files directly) or any TypeScript toolchain.

```ts
import { estimateForm5472Penalty } from './src/form-5472-penalty.ts';

estimateForm5472Penalty({ yearsMissed: 2, formsPerYear: 1, daysSinceNotice: 121 });
// → { baseUsd: 50000, continuationPeriods: 2, continuationUsd: 100000, totalUsd: 150000, ... }
```

## Test

```bash
npm test
```

## Sources and limits

- IRS Instructions for Form 5472: https://www.irs.gov/instructions/i5472
- IRC § 6038A: https://www.law.cornell.edu/uscode/text/26/6038A
- Wyoming Secretary of State fees: https://sos.wyo.gov/Business/docs/BusinessFees.pdf
- Delaware Division of Corporations: https://corp.delaware.gov/paytaxes/

Figures were checked on the dates in `FORM_5472_FACTS_CHECKED_ON` and `STATE_FEES_CHECKED_ON`. States and the IRS change fees and rules; check the official source before you rely on a number. These tools give estimates, not tax or legal advice. For a real filing, ask a US tax professional or [LaunchUS TAX](https://launchus.app/en/pricing).

Pull requests that update a figure must cite the official source.
