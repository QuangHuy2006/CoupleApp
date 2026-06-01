const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const createPairCode = async (userId) => {
    const pairCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const coupleId = uuidv4();
    
    await pool.query(
        'INSERT INTO couple_pairs (id, code, user1_id, status) VALUES ($1, $2, $3, $4)',
        [coupleId, pairCode, userId, 'pending']
    );
    
    await pool.query('UPDATE users SET pair_code = $1 WHERE id = $2', [pairCode, userId]);
    
    return { code: pairCode };
};

const pairWithCode = async (userId, code) => {
    const coupleResult = await pool.query(
        'SELECT id, user1_id FROM couple_pairs WHERE code = $1 AND status = $2 AND user2_id IS NULL',
        [code, 'pending']
    );
    
    if (coupleResult.rows.length === 0) {
        throw new Error('Mã kết đôi không hợp lệ');
    }
    
    const couple = coupleResult.rows[0];
    
    await pool.query(
        'UPDATE couple_pairs SET user2_id = $1, status = $2, paired_at = NOW() WHERE id = $3',
        [userId, 'active', couple.id]
    );
    
    const user1Result = await pool.query('SELECT full_name FROM users WHERE id = $1', [couple.user1_id]);
    const user1Name = user1Result.rows[0].full_name;
    
    await pool.query(
        'UPDATE users SET is_paired = TRUE, partner_id = $1, partner_name = $2, pair_code = NULL WHERE id = $3',
        [couple.user1_id, user1Name, userId]
    );
    
    const user2Result = await pool.query('SELECT full_name FROM users WHERE id = $1', [userId]);
    const user2Name = user2Result.rows[0].full_name;
    
    await pool.query(
        'UPDATE users SET is_paired = TRUE, partner_id = $1, partner_name = $2, pair_code = NULL WHERE id = $3',
        [userId, user2Name, couple.user1_id]
    );
    
    return { success: true, message: 'Kết đôi thành công' };
};

const getCoupleInfo = async (userId, isPaired, partnerId) => {
    if (!isPaired || !partnerId) {
        return { couple: {} };
    }
    
    const partnerResult = await pool.query(
        'SELECT full_name, email, avatar FROM users WHERE id = $1',
        [partnerId]
    );
    
    return { couple: { partner: partnerResult.rows[0] || null } };
};

module.exports = { createPairCode, pairWithCode, getCoupleInfo };