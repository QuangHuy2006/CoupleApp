const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/database');

const uploadPhotos = async (req, res) => {
    try {
        const supabase = getPool();
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

        // Delete old photos from Supabase Storage
        const { data: oldPhotos, error: oldPhotosError } = await supabase
            .from('user_photos')
            .select('id, photo_path')
            .eq('user_id', userId);

        if (!oldPhotosError && oldPhotos) {
            for (const photo of oldPhotos) {
                try {
                    // Extract file path from URL for Supabase deletion
                    const url = photo.photo_path;
                    const pathMatch = url.match(/\/photos\/(.+)$/);
                    if (pathMatch) {
                        await supabase.storage.from('photos').remove([pathMatch[1]]);
                    }
                } catch (err) {
                    console.error(`Error deleting photo from storage: ${err.message}`);
                }
            }
        }

        // Delete old photo records
        await supabase
            .from('user_photos')
            .delete()
            .eq('user_id', userId);

        // Save new photos
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const photoId = uuidv4();
            const timestamp = Date.now();
            const fileName = `profiles/${userId}_${timestamp}_${i}.jpg`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('photos')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                continue;
            }

            // Get public URL
            const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName);
            const photoPath = urlData.publicUrl;

            // Save to database
            await supabase
                .from('user_photos')
                .insert([{
                    id: photoId,
                    user_id: userId,
                    photo_path: photoPath,
                    is_primary: i === 0
                }]);

            photoIds.push(photoId);
            uploadedPhotos.push({
                id: photoId,
                photo_path: photoPath,
                is_primary: i === 0
            });
        }

        // Update profile_complete if phone_number and cccd are not null
        const { data: userRow } = await supabase
            .from('users')
            .select('phone_number, cccd')
            .eq('id', userId)
            .single();

        if (userRow && userRow.phone_number && userRow.cccd) {
            await supabase
                .from('users')
                .update({ profile_complete: true })
                .eq('id', userId);
        }

        res.json({
            success: true,
            message: `${uploadedPhotos.length} ảnh đã được tải lên thành công`,
            photos: uploadedPhotos
        });
    } catch (error) {
        console.error('Photo upload error:', error);
        res.status(500).json({ success: false, message: 'Lỗi upload ảnh: ' + error.message });
    }
};

const getPhotos = async (req, res) => {
    try {
        const supabase = getPool();
        const { userId } = req.params;

        const { data: photos, error } = await supabase
            .from('user_photos')
            .select('id, photo_path, is_primary, created_at')
            .eq('user_id', userId)
            .order('is_primary', { ascending: false })
            .order('created_at', { ascending: true });

        if (error) throw error;

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
        const supabase = getPool();
        const { photoId } = req.params;
        const userId = req.user.id;

        // Get photo info
        const { data: photos, error: findError } = await supabase
            .from('user_photos')
            .select('id, photo_path')
            .eq('id', photoId)
            .eq('user_id', userId);

        if (findError) throw findError;

        if (!photos || photos.length === 0) {
            return res.status(404).json({ success: false, message: 'Ảnh không tìm thấy' });
        }

        const photo = photos[0];

        // Delete file from Supabase Storage
        try {
            const url = photo.photo_path;
            const pathMatch = url.match(/\/photos\/(.+)$/);
            if (pathMatch) {
                await supabase.storage.from('photos').remove([pathMatch[1]]);
            }
        } catch (err) {
            console.error(`Error deleting photo file: ${err.message}`);
        }

        // Delete from database
        await supabase
            .from('user_photos')
            .delete()
            .eq('id', photoId);

        // Check remaining photos
        const { count, error: countError } = await supabase
            .from('user_photos')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (!countError && count < 3) {
            await supabase
                .from('users')
                .update({ profile_complete: false })
                .eq('id', userId);
        }

        res.json({ success: true, message: 'Ảnh đã được xóa' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const setPrimaryPhoto = async (req, res) => {
    try {
        const supabase = getPool();
        const { photoId } = req.params;
        const userId = req.user.id;

        // Verify photo belongs to user
        const { data: photos, error: findError } = await supabase
            .from('user_photos')
            .select('id')
            .eq('id', photoId)
            .eq('user_id', userId);

        if (findError) throw findError;

        if (!photos || photos.length === 0) {
            return res.status(404).json({ success: false, message: 'Ảnh không tìm thấy' });
        }

        // Remove primary status from all user photos
        await supabase
            .from('user_photos')
            .update({ is_primary: false })
            .eq('user_id', userId);

        // Set this photo as primary
        await supabase
            .from('user_photos')
            .update({ is_primary: true })
            .eq('id', photoId);

        res.json({ success: true, message: 'Ảnh đã được đặt làm ảnh chính' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { uploadPhotos, getPhotos, deletePhoto, setPrimaryPhoto };
