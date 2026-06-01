const { getPool } = require('../config/database');

const getProfile = async (req, res) => {
    try {
        const supabase = getPool();
        const userId = req.user.id;

        // Get user profile
        const { data: userRows, error: userError } = await supabase
            .from('users')
            .select(`
                id, email, full_name, phone_number, cccd, user_code, profile_complete, 
                avatar, is_paired, partner_id, partner_name
            `)
            .eq('id', userId);

        if (userError) throw userError;

        if (!userRows || userRows.length === 0) {
            return res.status(404).json({ success: false, message: 'User không tìm thấy' });
        }

        // Get user photos
        const { data: photos, error: photoError } = await supabase
            .from('user_photos')
            .select('id, photo_path, is_primary')
            .eq('user_id', userId)
            .order('is_primary', { ascending: false });

        if (photoError) throw photoError;

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
        const supabase = getPool();

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
            const { data: existingCCCD, error: cccdError } = await supabase
                .from('users')
                .select('id')
                .eq('cccd', cccd)
                .neq('id', userId);

            if (cccdError) throw cccdError;

            if (existingCCCD && existingCCCD.length > 0) {
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
        const { error: updateError } = await supabase
            .from('users')
            .update({
                full_name: full_name || req.user.full_name,
                phone_number: finalPhone,
                cccd: finalCCCD
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        // Check if profile is complete (has phone, cccd, and 3+ photos)
        const { count: photoCount, error: countError } = await supabase
            .from('user_photos')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (countError) throw countError;

        const profileComplete = phone_number && cccd && photoCount >= 3;
        
        if (profileComplete) {
            await supabase
                .from('users')
                .update({ profile_complete: true })
                .eq('id', userId);
        }

        // Get updated user
        const { data: rows, error: userError } = await supabase
            .from('users')
            .select(`
                id, email, full_name, phone_number, cccd, user_code, profile_complete, 
                avatar, is_paired, partner_id, partner_name
            `)
            .eq('id', userId);

        if (userError) throw userError;

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
        const supabase = getPool();

        const { data: userRows, error: userError } = await supabase
            .from('users')
            .select('phone_number, cccd')
            .eq('id', userId);

        if (userError) throw userError;

        const { count: photoCount, error: photoError } = await supabase
            .from('user_photos')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (photoError) throw photoError;

        const user = userRows[0];
        
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
        const supabase = getPool();
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn một ảnh đại diện' });
        }

        // Delete old avatar if exists
        const { data: userRows, error: findError } = await supabase
            .from('users')
            .select('avatar')
            .eq('id', userId);
            
        if (!findError && userRows && userRows.length > 0 && userRows[0].avatar) {
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
        const { error: updateError } = await supabase
            .from('users')
            .update({ avatar: photoPath })
            .eq('id', userId);

        if (updateError) throw updateError;

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