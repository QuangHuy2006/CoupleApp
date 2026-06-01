const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/database');

const getMessages = async (req, res) => {
    try {
        const pool = getPool();
        
        // Lấy couple_id từ user (nếu user là user1 hoặc user2)
        const [coupleRows] = await pool.query(
            'SELECT id FROM couple_pairs WHERE (user1_id = ? OR user2_id = ?) AND status = "active"',
            [req.user.id, req.user.id]
        );
        
        if (coupleRows.length === 0) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy cặp đôi' });
        }
        
        const coupleId = coupleRows[0].id;
        
        // Lấy danh sách tin nhắn
        const [messages] = await pool.query(
            `SELECT m.id, m.sender_id, m.message, m.type, m.media_url, m.created_at, u.full_name 
             FROM messages m 
             JOIN users u ON m.sender_id = u.id 
             WHERE m.couple_id = ? 
             ORDER BY m.created_at ASC 
             LIMIT 100`,
            [coupleId]
        );
        
        res.json({ success: true, messages, coupleId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { message, type = 'text', media_url = null } = req.body;
        const pool = getPool();
        
        if ((!message || message.trim() === '') && !media_url) {
            return res.status(400).json({ success: false, message: 'Tin nhắn không được trống' });
        }
        
        // Lấy couple_id
        const [coupleRows] = await pool.query(
            'SELECT id FROM couple_pairs WHERE (user1_id = ? OR user2_id = ?) AND status = "active"',
            [req.user.id, req.user.id]
        );
        
        if (coupleRows.length === 0) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy cặp đôi' });
        }
        
        const coupleId = coupleRows[0].id;
        const messageId = uuidv4();
        
        // Lưu tin nhắn vào DB
        await pool.query(
            'INSERT INTO messages (id, couple_id, sender_id, message, type, media_url) VALUES (?, ?, ?, ?, ?, ?)',
            [messageId, coupleId, req.user.id, message || null, type, media_url]
        );
        
        res.json({ 
            success: true, 
            messageId,
            message: {
                id: messageId,
                sender_id: req.user.id,
                message,
                type,
                media_url,
                created_at: new Date(),
                full_name: req.user.full_name
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const pool = getPool();
        const userId = req.user.id;

        // Find active couple
        const [coupleRows] = await pool.query(
            'SELECT id FROM couple_pairs WHERE (user1_id = ? OR user2_id = ?) AND status = "active"',
            [userId, userId]
        );

        if (coupleRows.length === 0) {
            return res.json({ success: true, count: 0 });
        }

        const coupleId = coupleRows[0].id;

        // Count unread messages from partner
        const [countRows] = await pool.query(
            'SELECT COUNT(*) as count FROM messages WHERE couple_id = ? AND sender_id != ? AND is_read = 0',
            [coupleId, userId]
        );

        res.json({ success: true, count: countRows[0].count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        const pool = getPool();
        const userId = req.user.id;

        // Find active couple
        const [coupleRows] = await pool.query(
            'SELECT id FROM couple_pairs WHERE (user1_id = ? OR user2_id = ?) AND status = "active"',
            [userId, userId]
        );

        if (coupleRows.length === 0) {
            return res.json({ success: true });
        }

        const coupleId = coupleRows[0].id;

        // Mark partner's messages as read
        await pool.query(
            'UPDATE messages SET is_read = 1 WHERE couple_id = ? AND sender_id != ? AND is_read = 0',
            [coupleId, userId]
        );

        res.json({ success: true, message: 'Đã đánh dấu đọc tin nhắn' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const uploadMedia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Không có file được tải lên' });
        }
        
        const url = `/photos/${req.file.filename}`;
        
        res.json({
            success: true,
            url,
            message: 'Tải lên thành công'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getMessages, sendMessage, getUnreadCount, markAsRead, uploadMedia };
