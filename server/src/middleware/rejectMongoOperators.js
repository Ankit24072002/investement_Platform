const hasUnsafeMongoKey = (value) => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some(hasUnsafeMongoKey);
  }

  return Object.entries(value).some(
    ([key, nestedValue]) => key.startsWith('$') || key.includes('.') || hasUnsafeMongoKey(nestedValue)
  );
};

const rejectMongoOperators = (req, res, next) => {
  if (hasUnsafeMongoKey(req.body) || hasUnsafeMongoKey(req.query) || hasUnsafeMongoKey(req.params)) {
    return res.status(400).json({
      success: false,
      message: 'Request contains unsupported field names.',
    });
  }

  return next();
};

module.exports = rejectMongoOperators;
