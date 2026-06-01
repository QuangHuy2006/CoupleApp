const { getPool } = require('../config/database');

const getProfile = async (req, res) => {
    try {
        const pool = getPool();
        const userId = req.user.id;

        // Get user profile with photos
        const [userRows] = await pool.query(
            `SELECT id, email, full_name, phone_number, cccd, user_code, profile_complete, 
                    avatar, is_paired, partner_id, partner_name FROM users WHERE id = ?`,
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: 'User không tìm thấy' });
        }

        // Get user photos
        const [photos] = await pool.query(
            'SELECT id, photo_path, is_primary FROM user_photos WHERE user_id = ? ORDER BY is_primary DESC',
            [userId]
        );

        res.json({ 
            success: true, 
            user: {
                ...userRows[0],
                photos: photos || []
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { full_name, phone_number, cccd } = req.body;
        const userId = req.user.id;
        const pool = getPool();

        // Validate phone number format (Vietnamese phone)
        if (phone_number && !/^0\d{9}$/.test(phone_number.replace(/\s/g, ''))) {
            return res.status(400).json({ 
                success: false, 
                message: 'Số điện thoại không hợp lệ' 
            });
        }

        // Validate CCCD format (Vietnam ID card - 12 digits)
        if (cccd && !/^\d{12}$/.test(cccd)) {
            return res.status(400).json({ 
                success: false, 
                message: 'CCCD phải là 12 chữ số' 
            });
        }

        // Check if CCCD already exists
        if (cccd) {
            const [existingCCCD] = await pool.query(
                'SELECT id FROM users WHERE cccd = ? AND id != ?',
                [cccd, userId]
            );
            if (existingCCCD.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'CCCD này đã được đăng ký' 
                });
            }
        }

        // Convert empty strings to null for unique constraints
        const finalPhone = phone_number || null;
        const finalCCCD = cccd || null;

        // Update profile
        await pool.query(
            'UPDATE users SET full_name = ?, phone_number = ?, cccd = ? WHERE id = ?',
            [full_name || req.user.full_name, finalPhone, finalCCCD, userId]
        );

        // Check if profile is complete (has phone, cccd, and 3+ photos)
        const [photos] = await pool.query(
            'SELECT COUNT(*) as count FROM user_photos WHERE user_id = ?',
            [userId]
        );

        const profileComplete = phone_number && cccd && photos[0].count >= 3;
        
        if (profileComplete) {
            await pool.query('UPDATE users SET profile_complete = TRUE WHERE id = ?', [userId]);
        }

        // Get updated user
        const [rows] = await pool.query(
            `SELECT id, email, full_name, phone_number, cccd, user_code, profile_complete, 
                    avatar, is_paired, partner_id, partner_name FROM users WHERE id = ?`,
            [userId]
        );

        res.json({ 
            success: true, 
            message: 'Hồ sơ đã được cập nhật',
            user: rows[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getProfileCompletion = async (req, res) => {
    try {
        const userId = req.user.id;
        const pool = getPool();

        const [userRows] = await pool.query(
            'SELECT phone_number, cccd FROM users WHERE id = ?',
            [userId]
        );

        const [photoRows] = await pool.query(
            'SELECT COUNT(*) as count FROM user_photos WHERE user_id = ?',
            [userId]
        );

        const user = userRows[0];
        const photoCount = photoRows[0].count;

        const completion = {
            hasPhone: !!user.phone_number,
            hasCCCD: !!user.cccd,
            hasPhotos: photoCount >= 3,
            photoCount,
            profileComplete: !!user.phone_number && !!user.cccd && photoCount >= 3,
            percentage: Math.round(
                ((!!user.phone_number ? 1 : 0) + 
                 (!!user.cccd ? 1 : 0) + 
                 (photoCount >= 3 ? 1 : 0)) / 3 * 100
            )
        };

        res.json({ success: true, completion });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const uploadAvatar = async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const pool = getPool();
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn một ảnh đại diện' });
        }

        const PHOTO_UPLOAD_DIR = path.join(__dirname, '../../public/photos');
        if (!fs.existsSync(PHOTO_UPLOAD_DIR)) {
            fs.mkdirSync(PHOTO_UPLOAD_DIR, { recursive: true });
        }

        // Generate filename
        const timestamp = Date.now();
        const fileName = `avatar_${userId}_${timestamp}.jpg`;
        const filePath = path.join(PHOTO_UPLOAD_DIR, fileName);

        // Delete old avatar if exists
        const [userRows] = await pool.query('SELECT avatar FROM users WHERE id = ?', [userId]);
        if (userRows.length > 0 && userRows[0].avatar) {
            const oldAvatarPath = path.join(__dirname, '../../public', userRows[0].avatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        // Save new file
        fs.writeFileSync(filePath, req.file.buffer);
        const photoPath = `/photos/${fileName}`;

        // Update DB
        await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [photoPath, userId]);

        res.json({
            success: true,
            message: 'Ảnh đại diện đã được cập nhật',
            avatar: photoPath
        });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ success: false, message: 'Lỗi upload ảnh: ' + error.message });
    }
};

module.exports = { getProfile, updateProfile, getProfileCompletion, uploadAvatar };