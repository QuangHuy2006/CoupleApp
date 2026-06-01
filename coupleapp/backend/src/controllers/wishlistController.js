const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/database');

const createWishlist = async (req, res) => {
    try {
        const { title, description } = req.body;
        const pool = getPool();
        
        const { rows: coupleRows } = await pool.query(
            "SELECT id FROM couple_pairs WHERE (user1_id = $1 OR user2_id = $1) AND status = 'active'",
            [req.user.id]
        );
        if (coupleRows.length === 0) return res.status(400).json({ success: false, message: 'Không tìm thấy cặp đôi' });
        const coupleId = coupleRows[0].id;
        const id = uuidv4();
        await pool.query('INSERT INTO wishlists (id, couple_id, title, description) VALUES ($1, $2, $3, $4)', [id, coupleId, title, description]);
        res.status(201).json({ success: true, wishlist: { id, title, description, is_done: false, created_at: new Date() } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getWishlists = async (req, res) => {
    try {
        const pool = getPool();
        const { rows: coupleRows } = await pool.query("SELECT id FROM couple_pairs WHERE (user1_id = $1 OR user2_id = $1) AND status = 'active'", [req.user.id]);
        if (coupleRows.length === 0) return res.status(400).json({ success: false, message: 'Không tìm thấy cặp đôi' });
        const coupleId = coupleRows[0].id;
        const { rows } = await pool.query('SELECT id, title, description, is_done, created_at FROM wishlists WHERE couple_id = $1 ORDER BY created_at DESC', [coupleId]);
        res.json({ success: true, wishlists: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateWishlist = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, is_done } = req.body;
        const pool = getPool();
        await pool.query('UPDATE wishlists SET title = $1, description = $2, is_done = $3 WHERE id = $4', [title, description, !!is_done, id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteWishlist = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();
        await pool.query('DELETE FROM wishlists WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createWishlist, getWishlists, updateWishlist, deleteWishlist };