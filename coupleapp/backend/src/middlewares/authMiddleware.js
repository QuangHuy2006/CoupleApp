const jwt = require('jsonwebtoken');
const { getPool } = require('../config/database');

const protect = async (req, res, next) => {
    let token;
    
    // Kiểm tra token trong Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    // Nếu không có token, return 401
    if (!token) {
        return res.status(401).json({ success: false, message: 'Không có token xác thực. Gửi: Authorization: Bearer <token>' });
    }
    
    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Lấy user từ database
        const supabase = getPool();
        const { data: rows, error } = await supabase
            .from('users')
            .select('id, email, full_name, user_code, profile_complete, phone_number, cccd, is_paired, partner_name, partner_id, avatar, latitude, longitude')
            .eq('id', decoded.id);
            
        if (error || !rows || rows.length === 0) {
            return res.status(401).json({ success: false, message: 'User không tồn tại' });
        }
        
        req.user = rows[0];
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc hết hạn' });
    }
};

module.exports = { protect };