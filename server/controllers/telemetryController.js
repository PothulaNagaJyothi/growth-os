const Telemetry = require('../models/Telemetry');

// @desc    Get aggregated telemetry stats and recent logs
// @route   GET /api/telemetry/stats
// @access  Private
exports.getTelemetryStats = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    // Aggregate totals
    const totals = await Telemetry.aggregate([
      { $match: { companyId: new require('mongoose').Types.ObjectId(companyId), processType: { $ne: 'image_generation' } } },
      {
        $group: {
          _id: null,
          totalPromptTokens: { $sum: '$promptTokens' },
          totalCompletionTokens: { $sum: '$completionTokens' },
          totalTokens: { $sum: '$totalTokens' },
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = totals[0] || {
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      count: 0
    };

    // Aggregate process breakdown
    const breakdown = await Telemetry.aggregate([
      { $match: { companyId: new require('mongoose').Types.ObjectId(companyId), processType: { $ne: 'image_generation' } } },
      {
        $group: {
          _id: '$processType',
          count: { $sum: 1 },
          promptTokens: { $sum: '$promptTokens' },
          completionTokens: { $sum: '$completionTokens' },
          totalTokens: { $sum: '$totalTokens' }
        }
      },
      { $sort: { totalTokens: -1 } }
    ]);

    // Retrieve last 20 raw telemetry logs
    const logs = await Telemetry.find({ companyId, processType: { $ne: 'image_generation' } })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: {
        summary: stats,
        breakdown,
        logs
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get global telemetry stats and recent logs across all companies
// @route   GET /api/telemetry/global-stats
// @access  Private/Admin
exports.getGlobalTelemetryStats = async (req, res, next) => {
  try {
    // Aggregate totals across all companies
    const totals = await Telemetry.aggregate([
      { $match: { processType: { $ne: 'image_generation' } } },
      {
        $group: {
          _id: null,
          totalPromptTokens: { $sum: '$promptTokens' },
          totalCompletionTokens: { $sum: '$completionTokens' },
          totalTokens: { $sum: '$totalTokens' },
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = totals[0] || {
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      count: 0
    };

    // Aggregate process breakdown across all companies
    const breakdown = await Telemetry.aggregate([
      { $match: { processType: { $ne: 'image_generation' } } },
      {
        $group: {
          _id: '$processType',
          count: { $sum: 1 },
          promptTokens: { $sum: '$promptTokens' },
          completionTokens: { $sum: '$completionTokens' },
          totalTokens: { $sum: '$totalTokens' }
        }
      },
      { $sort: { totalTokens: -1 } }
    ]);

    // Retrieve last 50 raw telemetry logs across all companies
    const logs = await Telemetry.find({ processType: { $ne: 'image_generation' } })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate({
        path: 'companyId',
        select: 'companyName'
      });

    res.status(200).json({
      success: true,
      data: {
        summary: stats,
        breakdown,
        logs
      }
    });
  } catch (error) {
    next(error);
  }
};

