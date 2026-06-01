const express = require('express');
const router = express.Router();
const { updateAnniversary } = require('../controllers/anniversaryController');
const { protect } = require('../middlewares/authMiddleware');

router.put('/', protect, updateAnniversary);

module.exports = router;