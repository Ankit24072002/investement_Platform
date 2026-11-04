const getInvestmentPlans = () => {
  const raw = process.env.INVESTMENT_PLANS;
  const isProduction = process.env.NODE_ENV === 'production';
  if (!raw) return isProduction ? [] : getDevelopmentPlans();

  let plans;
  try {
    plans = JSON.parse(raw);
  } catch {
    throw new Error('INVESTMENT_PLANS must be a valid JSON array.');
  }

  if (!Array.isArray(plans)) {
    throw new Error('INVESTMENT_PLANS must be a JSON array.');
  }

  if (plans.length === 0 && !isProduction) {
    return getDevelopmentPlans();
  }

  const ids = new Set();
  return plans.map((plan) => {
    if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
      throw new Error('Each investment plan must be a JSON object.');
    }

    const id = String(plan.id || '').trim();
    const name = String(plan.name || '').trim();
    const description = String(plan.description || '').trim();
    const minAmount = Number(plan.minAmount);
    const maxAmount = Number(plan.maxAmount);
    const durationDays = Number(plan.durationDays);
    const dailyROIPercentage = Number(plan.dailyROIPercentage);

    if (
      !id ||
      ids.has(id) ||
      !name ||
      !description ||
      !Number.isFinite(minAmount) ||
      minAmount <= 0 ||
      !Number.isFinite(maxAmount) ||
      maxAmount < minAmount ||
      !Number.isInteger(durationDays) ||
      durationDays < 1 ||
      !Number.isFinite(dailyROIPercentage) ||
      dailyROIPercentage <= 0
    ) {
      throw new Error(`Invalid investment plan configuration for "${id || 'unnamed'}".`);
    }

    ids.add(id);
    return { id, name, description, minAmount, maxAmount, durationDays, dailyROIPercentage };
  });
};

const getDevelopmentPlans = () => [
  {
    id: 'development-example',
    name: 'Development Example',
    description: 'Illustrative testing terms only; not a company-approved plan or a promise of returns.',
    minAmount: 10000,
    maxAmount: 10000,
    durationDays: 30,
    dailyROIPercentage: 1,
  },
];

const assertInvestmentPlanConfiguration = () => {
  const plans = getInvestmentPlans();
  if (process.env.NODE_ENV === 'production' && plans.length === 0) {
    throw new Error('Configure at least one reviewed investment plan before starting in production.');
  }
};

module.exports = { getInvestmentPlans, assertInvestmentPlanConfiguration };
