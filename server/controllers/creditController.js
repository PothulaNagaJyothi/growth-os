const Company = require('../models/Company');
const CreditTransaction = require('../models/CreditTransaction');
const creditService = require('../services/creditService');
const logger = require('../utils/logger');

// @desc    Get current company credit balance info
// @route   GET /api/credits/balance
// @access  Private
exports.getCompanyBalance = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    const company = await Company.findById(companyId).select('name creditsBalance creditsTotalAllocated creditsTotalPurchased creditsTotalUsed');
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        creditsBalance: company.creditsBalance || 0,
        creditsTotalAllocated: company.creditsTotalAllocated || 0,
        creditsTotalPurchased: company.creditsTotalPurchased || 0,
        creditsTotalUsed: company.creditsTotalUsed || 0,
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current company credit transaction history
// @route   GET /api/credits/transactions
// @access  Private
exports.getCompanyTransactions = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'No company profile associated with this user context' });
    }

    const transactions = await CreditTransaction.find({ companyId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'userId',
        select: 'name email'
      });

    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get global credit settings (Admin only)
// @route   GET /api/credits/admin/settings
// @access  Private/Admin
exports.getAdminSettings = async (req, res, next) => {
  try {
    const settings = await creditService.getCreditSettings();
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update global credit settings (Admin only)
// @route   PATCH /api/credits/admin/settings
// @access  Private/Admin
exports.updateAdminSettings = async (req, res, next) => {
  try {
    const settings = await creditService.updateCreditSettings(req.body);
    res.status(200).json({
      success: true,
      data: settings,
      message: 'Global credit settings updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all companies with credit balances (Admin only)
// @route   GET /api/credits/admin/companies
// @access  Private/Admin
exports.getAllCompaniesBalances = async (req, res, next) => {
  try {
    const companies = await Company.find({})
      .select('name website creditsBalance creditsTotalAllocated creditsTotalPurchased creditsTotalUsed createdAt')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: companies
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually allocate or deduct credits for a company (Admin only)
// @route   POST /api/credits/admin/allocate
// @access  Private/Admin
exports.allocateCreditsManual = async (req, res, next) => {
  try {
    const { companyId, amount, note } = req.body;

    if (!companyId || amount === undefined) {
      return res.status(400).json({ success: false, error: 'Company ID and amount are required' });
    }

    const numericAmount = Math.round(Number(amount));
    if (numericAmount === 0) {
      return res.status(400).json({ success: false, error: 'Amount cannot be zero' });
    }

    const { company, transaction } = await creditService.allocateCredits({
      companyId,
      userId: req.user._id, // Tracks the admin user making the change
      amount: numericAmount,
      type: 'manual_adjustment',
      note: note || `Admin manual adjustment of ${numericAmount} credits`,
      createdBy: 'admin'
    });

    res.status(200).json({
      success: true,
      message: `Successfully adjusted company balance by ${numericAmount} credits.`,
      data: {
        creditsBalance: company.creditsBalance,
        transaction
      }
    });
  } catch (error) {
    next(error);
  }
};
