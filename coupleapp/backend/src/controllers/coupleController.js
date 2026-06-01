const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/database');

const createCode = async (req, res) => {
    try {
        const pool = getPool();
        const pairCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const coupleId = uuidv4();
        
        await pool.query(
            'INSERT INTO couple_pairs (id, code, user1_id, status) VALUES ($1, $2, $3, $4)',
            [coupleId, pairCode, req.user.id, 'pending']
        );
        
        await pool.query('UPDATE users SET pair_code = $1 WHERE id = $2', [pairCode, req.user.id]);
        
        res.json({ success: true, code: pairCode });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const pairWithCode = async (req, res) => {
    try {
        const { code } = req.body;
        const pool = getPool();
        
        // Tìm cặp đôi theo code
        const { rows: coupleRows } = await pool.query(
            "SELECT id, user1_id FROM couple_pairs WHERE code = $1 AND status = 'pending' AND user2_id IS NULL",
            [code]
        );
        
        if (coupleRows.length === 0) {
            return res.status(400).json({ success: false, message: 'Mã kết đôi không hợp lệ' });
        }
        
        const couple = coupleRows[0];
        
        // Cập nhật cặp đôi
        await pool.query(
            "UPDATE couple_pairs SET user2_id = $1, status = 'active', paired_at = NOW() WHERE id = $2",
            [req.user.id, couple.id]
        );
        
        // Lấy tên user1
        const { rows: user1Rows } = await pool.query('SELECT full_name FROM users WHERE id = $1', [couple.user1_id]);
        const user1Name = user1Rows[0].full_name;
        
        // Cập nhật user2
        await pool.query(
            'UPDATE users SET is_paired = TRUE, partner_id = $1, partner_name = $2, pair_code = NULL WHERE id = $3',
            [couple.user1_id, user1Name, req.user.id]
        );
        
        // Lấy tên user2
        const { rows: user2Rows } = await pool.query('SELECT full_name FROM users WHERE id = $1', [req.user.id]);
        const user2Name = user2Rows[0].full_name;
        
        // Cập nhật user1
        await pool.query(
            'UPDATE users SET is_paired = TRUE, partner_id = $1, partner_name = $2, pair_code = NULL WHERE id = $3',
            [req.user.id, user2Name, couple.user1_id]
        );
        
        // Return updated user data
        const { rows: updatedUserRows } = await pool.query(
            'SELECT id, email, full_name, is_paired, partner_id, partner_name FROM users WHERE id = $1',
            [req.user.id]
        );
        
        res.json({ 
            success: true, 
            message: '💑 Kết đôi thành công!',
            user: updatedUserRows[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getCoupleInfo = async (req, res) => {
    try {
        const pool = getPool();
        let coupleInfo = {};
        
        if (req.user.is_paired && req.user.partner_id) {
            const { rows: partnerRows } = await pool.query(
                'SELECT full_name, email, avatar FROM users WHERE id = $1',
                [req.user.partner_id]
            );
            
            if (partnerRows.length > 0) {
                coupleInfo.partner = partnerRows[0];
            }
        }
        
        res.json({ success: true, couple: coupleInfo });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createCode, pairWithCode, getCoupleInfo };