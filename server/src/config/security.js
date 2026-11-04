const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || /^(change.?me|your_|fallback|generate|replace)/i.test(secret)) {
    throw new Error('JWT_SECRET must be configured with at least 32 non-placeholder characters.');
  }
  return secret;
};

const assertRequiredConfiguration = () => {
  getJwtSecret();
  require('./investmentPlans').assertInvestmentPlanConfiguration();
  require('./referral').assertReferralConfiguration();
};

module.exports = { getJwtSecret, assertRequiredConfiguration };
