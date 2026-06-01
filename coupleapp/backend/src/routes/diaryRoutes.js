const express = require('express');
const router = express.Router();
const { createDiary, getDiaries, getDiaryDetail, deleteDiary } = require('../controllers/diaryController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/create', protect, createDiary);
router.get('/list', protect, getDiaries);
router.get('/:diaryId', protect, getDiaryDetail);
router.delete('/:diaryId', protect, deleteDiary);

module.exports = router;
