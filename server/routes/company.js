const express = require('express');
const { getCompany, createCompany, updateCompany } = require('../controllers/companyController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Secure all company routes

router.route('/')
  .get(getCompany)
  .post(createCompany);

router.route('/:id')
  .put(updateCompany);

module.exports = router;
