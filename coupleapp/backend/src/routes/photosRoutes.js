const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middlewares/authMiddleware');
const { uploadPhotos, getPhotos, deletePhoto, setPrimaryPhoto } = require('../controllers/photosController');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB per file
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Chỉ chấp nhận file ảnh'));
        }
        cb(null, true);
    }
});

// POST /api/photos/upload - Upload multiple photos
router.post('/upload', protect, upload.array('photos', 10), uploadPhotos);

// GET /api/photos/:userId - Get user's photos
router.get('/:userId', getPhotos);

// DELETE /api/photos/:photoId - Delete a photo
router.delete('/:photoId', protect, deletePhoto);

// PUT /api/photos/:photoId/primary - Set as primary photo
router.put('/:photoId/primary', protect, setPrimaryPhoto);

module.exports = router;
