const { getPool } = require('../config/database');

const updateAnniversary = async (req, res) => {
    try {
        const { date } = req.body; // expected format: YYYY-MM-DD
        const pool = getPool();
        
        // Find couple by user
        const [coupleRows] = await pool.query(
            'SELECT id, user1_id, user2_id FROM couple_pairs WHERE (user1_id = ? OR user2_id = ?) AND status = "active"',
            [req.user.id, req.user.id]
        );
        
        if (coupleRows.length === 0) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy cặp đôi' });
        }
        const couple = coupleRows[0];
        
        // Update both users' anniversary_date
        await pool.query('UPDATE users SET anniversary_date = ? WHERE id IN (?, ?)', [date, couple.user1_id, couple.user2_id]);
        
        res.json({ success: true, message: 'Cập nhật ngày kỷ niệm thành công', date });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { updateAnniversary };