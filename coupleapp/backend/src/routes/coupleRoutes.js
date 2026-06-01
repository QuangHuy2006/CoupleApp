const express = require('express');
const router = express.Router();
const { createCode, pairWithCode, getCoupleInfo } = require('../controllers/coupleController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/create-code', protect, createCode);
router.post('/pair', protect, pairWithCode);
router.get('/info', protect, getCoupleInfo);

module.exports = router;