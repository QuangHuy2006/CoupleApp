const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/database');
const path = require('path');

const getMessages = async (req, res) => {
    try {
        const supabase = getPool();
        
        // Find active couple
        const { data: coupleRows, error: coupleError } = await supabase
            .from('couple_pairs')
            .select('id')
            .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`)
            .eq('status', 'active');
            
        if (coupleError) throw coupleError;
        
        if (!coupleRows || coupleRows.length === 0) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy cặp đôi' });
        }
        
        const coupleId = coupleRows[0].id;
        
        // Supabase join syntax: select('id, sender_id, message, type, media_url, created_at, users!inner(full_name)')
        const { data: messagesData, error: msgError } = await supabase
            .from('messages')
            .select(`
                id, sender_id, message, type, media_url, created_at,
                users!inner ( full_name )
            `)
            .eq('couple_id', coupleId)
            .order('created_at', { ascending: true })
            .limit(100);
            
        if (msgError) throw msgError;
        
        // Flatten the users join
        const messages = messagesData.map(m => ({
            id: m.id,
            sender_id: m.sender_id,
            message: m.message,
            type: m.type,
            media_url: m.media_url,
            created_at: m.created_at,
            full_name: m.users.full_name
        }));
        
        res.json({ success: true, messages, coupleId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { message, type = 'text', media_url = null } = req.body;
        const supabase = getPool();
        
        if ((!message || message.trim() === '') && !media_url) {
            return res.status(400).json({ success: false, message: 'Tin nhắn không được trống' });
        }
        
        const { data: coupleRows, error: coupleError } = await supabase
            .from('couple_pairs')
            .select('id')
            .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`)
            .eq('status', 'active');
            
        if (coupleError) throw coupleError;
        
        if (!coupleRows || coupleRows.length === 0) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy cặp đôi' });
        }
        
        const coupleId = coupleRows[0].id;
        const messageId = uuidv4();
        
        const { error: insertError } = await supabase
            .from('messages')
            .insert([{
                id: messageId,
                couple_id: coupleId,
                sender_id: req.user.id,
                message: message || null,
                type,
                media_url
            }]);
            
        if (insertError) throw insertError;
        
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
        const supabase = getPool();
        const userId = req.user.id;

        const { data: coupleRows, error: coupleError } = await supabase
            .from('couple_pairs')
            .select('id')
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
            .eq('status', 'active');

        if (coupleError) throw coupleError;

        if (!coupleRows || coupleRows.length === 0) {
            return res.json({ success: true, count: 0 });
        }

        const coupleId = coupleRows[0].id;

        const { count, error: countError } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('couple_id', coupleId)
            .neq('sender_id', userId)
            .eq('is_read', false);
            
        if (countError) throw countError;

        res.json({ success: true, count: count || 0 });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        const supabase = getPool();
        const userId = req.user.id;

        const { data: coupleRows, error: coupleError } = await supabase
            .from('couple_pairs')
            .select('id')
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
            .eq('status', 'active');

        if (coupleError) throw coupleError;

        if (!coupleRows || coupleRows.length === 0) {
            return res.json({ success: true });
        }

        const coupleId = coupleRows[0].id;

        const { error: updateError } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('couple_id', coupleId)
            .neq('sender_id', userId)
            .eq('is_read', false);
            
        if (updateError) throw updateError;

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
        
        // Supabase storage
        const supabase = getPool();
        
        const fileName = `chat/${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname || '.jpg')}`;
        
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
