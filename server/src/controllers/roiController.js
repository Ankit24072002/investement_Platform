const ROIHistory = require('../models/ROIHistory');

const getROIHistory = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filter = { userId: req.user._id };
    const [items, total] = await Promise.all([
      ROIHistory.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit),
      ROIHistory.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: 'ROI history fetched successfully.',
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to fetch ROI history.' });
  }
};

module.exports = { getROIHistory };
