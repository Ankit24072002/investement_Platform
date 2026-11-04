const defaultLevels = [
  { level: 1, percentage: 5 },
  { level: 2, percentage: 3 },
  { level: 3, percentage: 2 },
  { level: 4, percentage: 1 },
];

const configuredMaxLevels = Number(process.env.REFERRAL_MAX_LEVELS || 4);
if (!Number.isInteger(configuredMaxLevels) || configuredMaxLevels < 0) {
  throw new Error('REFERRAL_MAX_LEVELS must be a non-negative integer.');
}
const maxLevels = configuredMaxLevels;

const parseLevels = () => {
  const raw = process.env.REFERRAL_LEVELS;
  let parsed = defaultLevels;
  try {
    if (raw) parsed = JSON.parse(raw);
  } catch {
    throw new Error('REFERRAL_LEVELS must be a valid JSON array.');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('REFERRAL_LEVELS must be a JSON array.');
  }

  const seenLevels = new Set();
  const normalized = parsed.map((item) => {
    const level = Number(item?.level);
    const percentage = Number(item?.percentage);
    if (!Number.isInteger(level) || level < 1 || !Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
      throw new Error('Each referral level must have a positive integer level and percentage from 0 to 100.');
    }
    if (seenLevels.has(level)) throw new Error(`REFERRAL_LEVELS contains duplicate level ${level}.`);
    seenLevels.add(level);
    return { level, percentage };
  });

  const activeLevels = normalized.filter((entry) => entry.level <= maxLevels).sort((left, right) => left.level - right.level);
  if (activeLevels.reduce((sum, entry) => sum + entry.percentage, 0) > 100) {
    throw new Error('The combined referral commission percentages cannot exceed 100.');
  }
  return activeLevels;
};

const configuredMinimum = Number(process.env.MIN_ELIGIBLE_INVESTMENT_AMOUNT || 0);
if (!Number.isFinite(configuredMinimum) || configuredMinimum < 0) {
  throw new Error('MIN_ELIGIBLE_INVESTMENT_AMOUNT must be a non-negative number.');
}

const assertReferralConfiguration = () => {
  if (process.env.NODE_ENV === 'production' && (!process.env.REFERRAL_MAX_LEVELS || !process.env.REFERRAL_LEVELS)) {
    throw new Error('Configure reviewed REFERRAL_MAX_LEVELS and REFERRAL_LEVELS before starting in production.');
  }
};

module.exports = {
  referralConfig: {
    maxLevels,
    levels: parseLevels(),
    minEligibleInvestmentAmount: configuredMinimum,
  },
  assertReferralConfiguration,
};
