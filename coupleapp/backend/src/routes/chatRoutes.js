const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, getUnreadCount, markAsRead, uploadMedia } = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/messages', protect, getMessages);
router.post('/send', protect, sendMessage);
router.get('/unread', protect, getUnreadCount);
router.put('/read', protect, markAsRead);
router.post('/upload', protect, upload.single('media'), uploadMedia);

module.exports = router;
