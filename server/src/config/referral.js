const defaultLevels = [
  { level: 1, percentage: 5 },
  { level: 2, percentage: 3 },
  { level: 3, percentage: 2 },
  { level: 4, percentage: 1 },
];

const parseLevels = () => {
  const raw = process.env.REFERRAL_LEVELS;

  if (!raw) {
    return defaultLevels;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) {
      return parsed.map((item) => ({
        level: Number(item.level || 1),
        percentage: Number(item.percentage || 0),
      }));
    }
  } catch (error) {
    console.warn('Invalid REFERRAL_LEVELS config. Falling back to defaults.');
  }

  return defaultLevels;
};

module.exports = {
  referralConfig: {
    maxLevels: Number(process.env.REFERRAL_MAX_LEVELS || 4),
    levels: parseLevels(),
    minEligibleInvestmentAmount: Number(process.env.MIN_ELIGIBLE_INVESTMENT_AMOUNT || 0),
    developmentNote:
      'Sample commission values are intentionally kept in configuration for easy adjustment. They are sample values only and should be reviewed before production use.',
  },
};
