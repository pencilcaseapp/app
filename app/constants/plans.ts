import { FREE_DOCUMENT_LIMIT } from './subscription';

/*
 * The plans as the pricing cards show them, kept in one place so the
 * upgrade prompts and the subscription settings cannot drift apart.
 */
export const FREE_PLAN = {
  plan: 'Pencil Case Free',
  amount: '0 €',
  period: '/ year',
  features: [
    `${FREE_DOCUMENT_LIMIT} docs`,
    'Hosted in the EU',
    'Support small tech',
    'No tracking',
  ],
  missingFeatures: [
    'Unlimited docs',
    'Access control for collaboration',
  ],
  finePrint: 'Free plan for life.',
};

export const PRO_PLAN = {
  plan: 'Pencil Case Pro',
  amount: '25 €',
  period: '/ year',
  features: [
    'Unlimited docs',
    'Access control for collaboration',
    'Hosted in the EU',
    'No tracking',
    'Support small tech',
    'Support development',
  ],
};

/*
 * The plans as the feature matrix compares them: one row per feature,
 * a value to print or whether the plan includes it, free then pro.
 */
export const PLAN_MATRIX_PLANS = [
  { name: 'Free' },
  { name: 'Pro', emphasis: true },
];

export const PLAN_MATRIX_ROWS = [
  { label: 'Docs', cells: [String(FREE_DOCUMENT_LIMIT), 'Unlimited'] },
  { label: 'Access control for collaboration', cells: [false, true] },
  { label: 'Hosted in the EU', cells: [true, true] },
  { label: 'No tracking', cells: [true, true] },
  { label: 'Support small tech', cells: [true, true] },
  { label: 'Support development', cells: [false, true] },
];
