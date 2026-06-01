const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/database');

const getMessages = async (req, res) => {
    try {
        const pool = getPool();
        
        const { rows: coupleRows } = await pool.query(
            "SELECT id FROM couple_pairs WHERE (user1_id = $1 OR user2_id = $1) AND status = 'active'",
            [req.user.id]
        );
        
        if (coupleRows.length === 0) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy cặp đôi' });
        }
        
        const coupleId = coupleRows[0].id;
        
        const { rows: messages } = await pool.query(
            `SELECT m.id, m.sender_id, m.message, m.type, m.media_url, m.created_at, u.full_name 
             FROM messages m 
             JOIN users u ON m.sender_id = u.id 
             WHERE m.couple_id = $1 
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
        
        const { rows: coupleRows } = await pool.query(
            "SELECT id FROM couple_pairs WHERE (user1_id = $1 OR user2_id = $1) AND status = 'active'",
            [req.user.id]
        );
        
        if (coupleRows.length === 0) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy cặp đôi' });
        }
        
        const coupleId = coupleRows[0].id;
        const messageId = uuidv4();
        
        await pool.query(
            'INSERT INTO messages (id, couple_id, sender_id, message, type, media_url) VALUES ($1, $2, $3, $4, $5, $6)',
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

        const { rows: coupleRows } = await pool.query(
            "SELECT id FROM couple_pairs WHERE (user1_id = $1 OR user2_id = $1) AND status = 'active'",
            [userId]
        );

        if (coupleRows.length === 0) {
            return res.json({ success: true, count: 0 });
        }

        const coupleId = coupleRows[0].id;

        const { rows: countRows } = await pool.query(
            'SELECT COUNT(*) as count FROM messages WHERE couple_id = $1 AND sender_id != $2 AND is_read = false',
            [coupleId, userId]
        );

        res.json({ success: true, count: parseInt(countRows[0].count) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        const pool = getPool();
        const userId = req.user.id;

        const { rows: coupleRows } = await pool.query(
            "SELECT id FROM couple_pairs WHERE (user1_id = $1 OR user2_id = $1) AND status = 'active'",
            [userId]
        );

        if (coupleRows.length === 0) {
            return res.json({ success: true });
        }

        const coupleId = coupleRows[0].id;

        await pool.query(
            'UPDATE messages SET is_read = true WHERE couple_id = $1 AND sender_id != $2 AND is_read = false',
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
        
        // Upload to Supabase Storage
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        
        const fileName = `chat/${Date.now()}-${Math.round(Math.random() * 1E9)}${require('path').extname(req.file.originalname || '.jpg')}`;
        
        const { data, error } = await supabase.storage
            .from('photos')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });
        
        if (error) {
            console.error('Supabase storage error:', error);
            return res.status(500).json({ success: false, message: 'Lỗi upload file: ' + error.message });
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName);
        
        res.json({
            success: true,
            url: urlData.publicUrl,
            message: 'Tải lên thành công'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getMessages, sendMessage, getUnreadCount, markAsRead, uploadMedia };
