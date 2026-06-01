const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/database');

// Helper function to calculate distance between two coordinates (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
};

// Helper function to get direction between coordinates
const getDirection = (lat1, lon1, lat2, lon2) => {
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const angle = Math.atan2(dLat, dLon) * 180 / Math.PI;
    
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round((angle + 180) / 45) % 8;
    return directions[index];
};

const updateLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const userId = req.user.id;
        const supabase = getPool();

        // Validate coordinates
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return res.status(400).json({ 
                success: false, 
                message: 'Latitude và longitude phải là số' 
            });
        }

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({ 
                success: false, 
                message: 'Latitude và longitude không hợp lệ' 
            });
        }

        // Update current location in users table
        const { error: updateError } = await supabase
            .from('users')
            .update({ latitude, longitude })
            .eq('id', userId);
            
        if (updateError) throw updateError;

        // Save location history
        const locationId = uuidv4();
        const { error: insertError } = await supabase
            .from('user_locations')
            .insert([{
                id: locationId,
                user_id: userId,
                latitude,
                longitude
            }]);
            
        if (insertError) throw insertError;

        // Get partner info if paired
        let partnerLocation = null;
        const { data: userRows, error: userError } = await supabase
            .from('users')
            .select('is_paired, partner_id')
            .eq('id', userId);
            
        if (userError) throw userError;

        if (userRows && userRows.length > 0 && userRows[0].is_paired && userRows[0].partner_id) {
            const { data: partnerRows, error: partnerError } = await supabase
                .from('users')
                .select('latitude, longitude')
                .eq('id', userRows[0].partner_id);

            if (partnerError) throw partnerError;

            if (partnerRows && partnerRows.length > 0 && partnerRows[0].latitude && partnerRows[0].longitude) {
                const distance = calculateDistance(
                    latitude, longitude,
                    partnerRows[0].latitude, partnerRows[0].longitude
                );
                const direction = getDirection(
                    latitude, longitude,
                    partnerRows[0].latitude, partnerRows[0].longitude
                );

                partnerLocation = {
                    latitude: partnerRows[0].latitude,
                    longitude: partnerRows[0].longitude,
                    distance: `${distance} km`,
                    direction: direction
                };
            }
        }

        res.json({
            success: true,
            message: 'Vị trí đã được cập nhật',
            location: {
                latitude,
                longitude,
                updated_at: new Date()
            },
            partnerLocation
        });
    } catch (error) {
        console.error('Location update error:', error);
        res.status(500).json({ success: false, message: 'Lỗi cập nhật vị trí: ' + error.message });
    }
};

const getPartnerLocation = async (req, res) => {
    try {
        const userId = req.user.id;
        const supabase = getPool();

        // Get user's partner
        const { data: userRows, error: userError } = await supabase
            .from('users')
            .select('is_paired, partner_id')
            .eq('id', userId);

        if (userError) throw userError;

        if (!userRows || userRows.length === 0 || !userRows[0].is_paired || !userRows[0].partner_id) {
            return res.json({
                success: true,
                message: 'Bạn chưa kết đôi',
                partnerLocation: null
            });
        }

        // Get partner location
        const partnerId = userRows[0].partner_id;
        const { data: partnerRows, error: partnerError } = await supabase
            .from('users')
            .select('id, latitude, longitude')
            .eq('id', partnerId);

        if (partnerError) throw partnerError;

        if (!partnerRows || partnerRows.length === 0 || !partnerRows[0].latitude || !partnerRows[0].longitude) {
            return res.json({
                success: true,
                message: 'Người yêu của bạn chưa chia sẻ vị trí',
                partnerLocation: null
            });
        }

        // Get current user location
        const { data: currentUserRows, error: currentError } = await supabase
            .from('users')
            .select('latitude, longitude')
            .eq('id', userId);

        if (currentError) throw currentError;

        const partner = partnerRows[0];
        const currentUser = currentUserRows[0];

        let distance = 'N/A';
        let direction = 'N/A';

        if (currentUser.latitude && currentUser.longitude) {
            distance = calculateDistance(
                currentUser.latitude, currentUser.longitude,
                partner.latitude, partner.longitude
            );
            direction = getDirection(
                currentUser.latitude, currentUser.longitude,
                partner.latitude, partner.longitude
            );
        }

        // Get last update time
        const { data: locationHistory, error: historyError } = await supabase
            .from('user_locations')
            .select('updated_at')
            .eq('user_id', partnerId)
            .order('updated_at', { ascending: false })
            .limit(1);

        if (historyError) throw historyError;

        res.json({
            success: true,
            partnerLocation: {
                latitude: partner.latitude,
                longitude: partner.longitude,
                distance,
                direction,
                lastUpdate: locationHistory && locationHistory.length > 0 ? locationHistory[0].updated_at : null
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getLocationHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { days = 7 } = req.query;
        const supabase = getPool();

        // Calculate date limit
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - parseInt(days));

        // Get location history for specified days
        const { data: locations, error } = await supabase
            .from('user_locations')
            .select('id, latitude, longitude, updated_at')
            .eq('user_id', userId)
            .gte('updated_at', limitDate.toISOString())
            .order('updated_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        res.json({
            success: true,
            locations: locations || []
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteLocationHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const supabase = getPool();

        const { error } = await supabase
            .from('user_locations')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ success: true, message: 'Lịch sử vị trí đã được xóa' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { 
    updateLocation, 
    getPartnerLocation, 
    getLocationHistory,
    deleteLocationHistory,
    calculateDistance,
    getDirection
};
