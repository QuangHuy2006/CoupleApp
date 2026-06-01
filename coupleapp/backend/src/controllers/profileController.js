const { getPool } = require('../config/database');

const getProfile = async (req, res) => {
    try {
        const pool = getPool();
        const userId = req.user.id;

        // Get user profile with photos
        const { rows: userRows } = await pool.query(
            `SELECT id, email, full_name, phone_number, cccd, user_code, profile_complete, 
                    avatar, is_paired, partner_id, partner_name FROM users WHERE id = $1`,
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: 'User không tìm thấy' });
        }

        // Get user photos
        const { rows: photos } = await pool.query(
            'SELECT id, photo_path, is_primary FROM user_photos WHERE user_id = $1 ORDER BY is_primary DESC',
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
            const { rows: existingCCCD } = await pool.query(
                'SELECT id FROM users WHERE cccd = $1 AND id != $2',
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
            'UPDATE users SET full_name = $1, phone_number = $2, cccd = $3 WHERE id = $4',
            [full_name || req.user.full_name, finalPhone, finalCCCD, userId]
        );

        // Check if profile is complete (has phone, cccd, and 3+ photos)
        const { rows: photoCountRows } = await pool.query(
            'SELECT COUNT(*) as count FROM user_photos WHERE user_id = $1',
            [userId]
        );

        const profileComplete = phone_number && cccd && parseInt(photoCountRows[0].count) >= 3;
        
        if (profileComplete) {
            await pool.query('UPDATE users SET profile_complete = TRUE WHERE id = $1', [userId]);
        }

        // Get updated user
        const { rows } = await pool.query(
            `SELECT id, email, full_name, phone_number, cccd, user_code, profile_complete, 
                    avatar, is_paired, partner_id, partner_name FROM users WHERE id = $1`,
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

        const { rows: userRows } = await pool.query(
            'SELECT phone_number, cccd FROM users WHERE id = $1',
            [userId]
        );

        const { rows: photoRows } = await pool.query(
            'SELECT COUNT(*) as count FROM user_photos WHERE user_id = $1',
            [userId]
        );

        const user = userRows[0];
        const photoCount = parseInt(photoRows[0].count);

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
        const pool = getPool();
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn một ảnh đại diện' });
        }

        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

        // Delete old avatar if exists
        const { rows: userRows } = await pool.query('SELECT avatar FROM users WHERE id = $1', [userId]);
        if (userRows.length > 0 && userRows[0].avatar) {
            try {
                const url = userRows[0].avatar;
                const pathMatch = url.match(/\/photos\/(.+)$/);
                if (pathMatch) {
                    await supabase.storage.from('photos').remove([pathMatch[1]]);
                }
            } catch (err) {
                console.error('Error deleting old avatar:', err.message);
            }
        }

        // Upload new avatar to Supabase Storage
        const timestamp = Date.now();
        const fileName = `avatars/avatar_${userId}_${timestamp}.jpg`;

        const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (uploadError) {
            return res.status(500).json({ success: false, message: 'Lỗi upload ảnh: ' + uploadError.message });
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName);
        const photoPath = urlData.publicUrl;

        // Update DB
        await pool.query('UPDATE users SET avatar = $1 WHERE id = $2', [photoPath, userId]);

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