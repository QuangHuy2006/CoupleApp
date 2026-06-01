const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getProfile, updateProfile, getProfileCompletion, uploadAvatar } = require('../controllers/profileController');
const { protect } = require('../middlewares/authMiddleware');

// Configure multer for avatar upload
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Chỉ chấp nhận file ảnh'));
        }
        cb(null, true);
    }
});

router.get('/me', protect, getProfile);
router.put('/update', protect, updateProfile);
router.get('/completion/status', protect, getProfileCompletion);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

module.exports = router;