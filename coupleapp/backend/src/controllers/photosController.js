const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/database');
const fs = require('fs');
const path = require('path');

const PHOTO_UPLOAD_DIR = path.join(__dirname, '../../public/photos');

// Ensure photo directory exists
if (!fs.existsSync(PHOTO_UPLOAD_DIR)) {
    fs.mkdirSync(PHOTO_UPLOAD_DIR, { recursive: true });
}

const uploadPhotos = async (req, res) => {
    try {
        const pool = getPool();
        const userId = req.user.id;
        
        // Check if files exist
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất một ảnh' });
        }

        // Validate minimum 3 photos
        const totalPhotos = req.files.length;
        if (totalPhotos < 3) {
            return res.status(400).json({ 
                success: false, 
                message: `Vui lòng chọn ít nhất 3 ảnh (hiện có ${totalPhotos})` 
            });
        }

        // Validate maximum 10 photos
        if (totalPhotos > 10) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tối đa 10 ảnh cho mỗi lần upload' 
            });
        }

        const uploadedPhotos = [];
        const photoIds = [];

        // Delete old photos from database and file system
        const [oldPhotos] = await pool.query('SELECT id, photo_path FROM user_photos WHERE user_id = ?', [userId]);
        for (const photo of oldPhotos) {
            try {
                const fullPath = path.join(__dirname, '../../public', photo.photo_path);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            } catch (err) {
                console.error(`Error deleting photo: ${err.message}`);
            }
        }

        // Delete old photo records
        await pool.query('DELETE FROM user_photos WHERE user_id = ?', [userId]);

        // Save new photos
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const photoId = uuidv4();
            const timestamp = Date.now();
            const fileName = `${userId}_${timestamp}_${i}.jpg`;
            const filePath = path.join(PHOTO_UPLOAD_DIR, fileName);

            // Save file
            fs.writeFileSync(filePath, file.buffer);

            // Save to database
            const photoPath = `/photos/${fileName}`;
            await pool.query(
                'INSERT INTO user_photos (id, user_id, photo_path, is_primary) VALUES (?, ?, ?, ?)',
                [photoId, userId, photoPath, i === 0]
            );

            photoIds.push(photoId);
            uploadedPhotos.push({
                id: photoId,
                photo_path: photoPath,
                is_primary: i === 0
            });
        }

        // Update profile_complete if this is the first upload with 3+ photos
        await pool.query(
            'UPDATE users SET profile_complete = TRUE WHERE id = ? AND phone_number IS NOT NULL AND cccd IS NOT NULL',
            [userId]
        );

        res.json({
            success: true,
            message: `${totalPhotos} ảnh đã được tải lên thành công`,
            photos: uploadedPhotos
        });
    } catch (error) {
        console.error('Photo upload error:', error);
        res.status(500).json({ success: false, message: 'Lỗi upload ảnh: ' + error.message });
    }
};

const getPhotos = async (req, res) => {
    try {
        const pool = getPool();
        const { userId } = req.params;

        const [photos] = await pool.query(
            'SELECT id, photo_path, is_primary, created_at FROM user_photos WHERE user_id = ? ORDER BY is_primary DESC, created_at ASC',
            [userId]
        );

        res.json({
            success: true,
            photos: photos || []
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deletePhoto = async (req, res) => {
    try {
        const pool = getPool();
        const { photoId } = req.params;
        const userId = req.user.id;

        // Get photo info
        const [photos] = await pool.query(
            'SELECT id, photo_path FROM user_photos WHERE id = ? AND user_id = ?',
            [photoId, userId]
        );

        if (photos.length === 0) {
            return res.status(404).json({ success: false, message: 'Ảnh không tìm thấy' });
        }

        const photo = photos[0];

        // Delete file from disk
        try {
            const fullPath = path.join(__dirname, '../../public', photo.photo_path);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        } catch (err) {
            console.error(`Error deleting photo file: ${err.message}`);
        }

        // Delete from database
        await pool.query('DELETE FROM user_photos WHERE id = ?', [photoId]);

        // Check remaining photos
        const [remainingPhotos] = await pool.query(
            'SELECT COUNT(*) as count FROM user_photos WHERE user_id = ?',
            [userId]
        );

        if (remainingPhotos[0].count < 3) {
            await pool.query('UPDATE users SET profile_complete = FALSE WHERE id = ?', [userId]);
        }

        res.json({ success: true, message: 'Ảnh đã được xóa' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const setPrimaryPhoto = async (req, res) => {
    try {
        const pool = getPool();
        const { photoId } = req.params;
        const userId = req.user.id;

        // Verify photo belongs to user
        const [photos] = await pool.query(
            'SELECT id FROM user_photos WHERE id = ? AND user_id = ?',
            [photoId, userId]
        );

        if (photos.length === 0) {
            return res.status(404).json({ success: false, message: 'Ảnh không tìm thấy' });
        }

        // Remove primary status from all user photos
        await pool.query('UPDATE user_photos SET is_primary = FALSE WHERE user_id = ?', [userId]);

        // Set this photo as primary
        await pool.query('UPDATE user_photos SET is_primary = TRUE WHERE id = ?', [photoId]);

        res.json({ success: true, message: 'Ảnh đã được đặt làm ảnh chính' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { uploadPhotos, getPhotos, deletePhoto, setPrimaryPhoto };
