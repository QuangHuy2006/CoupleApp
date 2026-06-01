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
        const pool = getPool();

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
        await pool.query(
            'UPDATE users SET latitude = ?, longitude = ? WHERE id = ?',
            [latitude, longitude, userId]
        );

        // Save location history
        const locationId = uuidv4();
        await pool.query(
            'INSERT INTO user_locations (id, user_id, latitude, longitude) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP',
            [locationId, userId, latitude, longitude, latitude, longitude]
        );

        // Get partner info if paired
        let partnerLocation = null;
        const [userRows] = await pool.query(
            'SELECT is_paired, partner_id FROM users WHERE id = ?',
            [userId]
        );

        if (userRows[0].is_paired && userRows[0].partner_id) {
            const [partnerRows] = await pool.query(
                'SELECT latitude, longitude FROM users WHERE id = ?',
                [userRows[0].partner_id]
            );

            if (partnerRows.length > 0 && partnerRows[0].latitude && partnerRows[0].longitude) {
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
        const pool = getPool();

        // Get user's partner
        const [userRows] = await pool.query(
            'SELECT is_paired, partner_id FROM users WHERE id = ?',
            [userId]
        );

        if (!userRows[0].is_paired || !userRows[0].partner_id) {
            return res.json({
                success: true,
                message: 'Bạn chưa kết đôi',
                partnerLocation: null
            });
        }

        // Get partner location
        const partnerId = userRows[0].partner_id;
        const [partnerRows] = await pool.query(
            'SELECT id, latitude, longitude FROM users WHERE id = ?',
            [partnerId]
        );

        if (partnerRows.length === 0 || !partnerRows[0].latitude || !partnerRows[0].longitude) {
            return res.json({
                success: true,
                message: 'Người yêu của bạn chưa chia sẻ vị trí',
                partnerLocation: null
            });
        }

        // Get current user location
        const [currentUserRows] = await pool.query(
            'SELECT latitude, longitude FROM users WHERE id = ?',
            [userId]
        );

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
        const [locationHistory] = await pool.query(
            'SELECT updated_at FROM user_locations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
            [partnerId]
        );

        res.json({
            success: true,
            partnerLocation: {
                latitude: partner.latitude,
                longitude: partner.longitude,
                distance,
                direction,
                lastUpdate: locationHistory.length > 0 ? locationHistory[0].updated_at : null
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
        const pool = getPool();

        // Get location history for specified days
        const [locations] = await pool.query(
            `SELECT id, latitude, longitude, updated_at 
             FROM user_locations 
             WHERE user_id = ? AND updated_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
             ORDER BY updated_at DESC
             LIMIT 100`,
            [userId, parseInt(days)]
        );

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
        const pool = getPool();

        await pool.query('DELETE FROM user_locations WHERE user_id = ?', [userId]);

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
