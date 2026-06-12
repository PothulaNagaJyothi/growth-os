const Company = require('../models/Company');
const User = require('../models/User');

// @desc    Get active company details
// @route   GET /api/company
// @access  Private
exports.getCompany = async (req, res, next) => {
  try {
    if (!req.user.companyId) {
      return res.status(404).json({ success: false, error: 'No company associated with this user' });
    }

    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create company details
// @route   POST /api/company
// @access  Private
exports.createCompany = async (req, res, next) => {
  try {
    // If user already has a company, block creation
    if (req.user.companyId) {
      return res.status(400).json({ success: false, error: 'User already has an associated company' });
    }

    const { companyName, website, industry, productDescription, targetAudience, brandVoice, competitors } = req.body;

    const company = await Company.create({
      companyName,
      website,
      industry,
      productDescription,
      targetAudience,
      brandVoice,
      competitors,
      createdBy: req.user.id,
    });

    // Update user's company ID
    await User.findByIdAndUpdate(req.user.id, { companyId: company._id });
    req.user.companyId = company._id;

    res.status(201).json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update company details
// @route   PUT /api/company/:id
// @access  Private
exports.updateCompany = async (req, res, next) => {
  try {
    let company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    // Make sure user belongs to this company or is creator
    if (req.user.companyId.toString() !== company._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to modify this company' });
    }

    company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
};
