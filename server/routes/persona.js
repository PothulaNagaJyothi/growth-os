const express = require('express');
const {
  getPersonas,
  createPersona,
  updatePersona,
  deletePersona,
} = require('../controllers/personaController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Secure all endpoints under auth shield
router.use(protect);

router.route('/')
  .get(getPersonas)
  .post(createPersona);

router.route('/:id')
  .put(updatePersona)
  .delete(deletePersona);

module.exports = router;
