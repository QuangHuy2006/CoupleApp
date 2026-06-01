const express = require('express');
const router = express.Router();
const { createWishlist, getWishlists, updateWishlist, deleteWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getWishlists);
router.post('/', protect, createWishlist);
router.put('/:id', protect, updateWishlist);
router.delete('/:id', protect, deleteWishlist);

module.exports = router;