const express = require('express');
const router = express.Router();
const {
  getCompanyBalance,
  getCompanyTransactions,
  getAdminSettings,
  updateAdminSettings,
  getAllCompaniesBalances,
  allocateCreditsManual
} = require('../controllers/creditController');
const { protect, authorize } = require('../middleware/auth');

// Public company credit routes
router.get('/balance', protect, getCompanyBalance);
router.get('/transactions', protect, getCompanyTransactions);

// Admin-only credit routes
router.get('/admin/settings', protect, authorize('admin'), getAdminSettings);
router.patch('/admin/settings', protect, authorize('admin'), updateAdminSettings);
router.get('/admin/companies', protect, authorize('admin'), getAllCompaniesBalances);
router.post('/admin/allocate', protect, authorize('admin'), allocateCreditsManual);

module.exports = router;
