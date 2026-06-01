const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/database');

const createWishlist = async (req, res) => {
    try {
        const { title, description } = req.body;
        const pool = getPool();
        
        const [coupleRows] = await pool.query(
            'SELECT id FROM couple_pairs WHERE (user1_id = ? OR user2_id = ?) AND status = "active"',
            [req.user.id, req.user.id]
        );
        if (coupleRows.length === 0) return res.status(400).json({ success: false, message: 'Không tìm thấy cặp đôi' });
        const coupleId = coupleRows[0].id;
        const id = uuidv4();
        await pool.query('INSERT INTO wishlists (id, couple_id, title, description) VALUES (?, ?, ?, ?)', [id, coupleId, title, description]);
        res.status(201).json({ success: true, wishlist: { id, title, description, is_done: false, created_at: new Date() } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getWishlists = async (req, res) => {
    try {
        const pool = getPool();
        const [coupleRows] = await pool.query('SELECT id FROM couple_pairs WHERE (user1_id = ? OR user2_id = ?) AND status = "active"', [req.user.id, req.user.id]);
        if (coupleRows.length === 0) return res.status(400).json({ success: false, message: 'Không tìm thấy cặp đôi' });
        const coupleId = coupleRows[0].id;
        const [rows] = await pool.query('SELECT id, title, description, is_done, created_at FROM wishlists WHERE couple_id = ? ORDER BY created_at DESC', [coupleId]);
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
        await pool.query('UPDATE wishlists SET title = ?, description = ?, is_done = ? WHERE id = ?', [title, description, !!is_done, id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteWishlist = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();
        await pool.query('DELETE FROM wishlists WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createWishlist, getWishlists, updateWishlist, deleteWishlist };