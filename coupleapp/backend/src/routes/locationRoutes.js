const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { 
    updateLocation, 
    getPartnerLocation, 
    getLocationHistory,
    deleteLocationHistory
} = require('../controllers/locationController');

// POST /api/location/update - Update user location
router.post('/update', protect, updateLocation);

// GET /api/location/partner - Get partner's location
router.get('/partner', protect, getPartnerLocation);

// GET /api/location/history - Get location history
router.get('/history', protect, getLocationHistory);

// DELETE /api/location/history - Delete location history
router.delete('/history', protect, deleteLocationHistory);

module.exports = router;
