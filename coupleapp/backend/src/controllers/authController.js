const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/database');

// Function to generate unique user code (fixed, non-random)
const generateUniqueUserCode = async (pool) => {
    let code;
    let isUnique = false;
    
    while (!isUnique) {
        // Generate 6-character code: 4 letters + 2 numbers
        const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ'; // Exclude I, L, O for clarity
        const numbers = '0123456789';
        
        let tempCode = '';
        for (let i = 0; i < 4; i++) {
            tempCode += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        for (let i = 0; i < 2; i++) {
            tempCode += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
        
        // Check if code already exists
        const { rows: existing } = await pool.query('SELECT user_code FROM users WHERE user_code = $1', [tempCode]);
        if (existing.length === 0) {
            code = tempCode;
            isUnique = true;
        }
    }
    
    return code;
};

const register = async (req, res) => {
    try {
        const { email, password, full_name } = req.body;
        const pool = getPool();
        
        // Kiểm tra email tồn tại
        const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email đã được đăng ký' });
        }
        
        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userId = uuidv4();
        
        // Generate unique user code
        const userCode = await generateUniqueUserCode(pool);
        
        // Tạo user
        await pool.query(
            'INSERT INTO users (id, email, password, full_name, user_code, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
            [userId, email, hashedPassword, full_name, userCode]
        );
        
        // Tạo token
        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
        
        res.status(201).json({
            success: true,
            token,
            user: { 
                id: userId, 
                email, 
                full_name,
                user_code: userCode,
                profile_complete: false,
                is_paired: false,
                partner_name: undefined,
                partner_id: undefined
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const pool = getPool();
        
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
        }
        
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
        }
        
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                user_code: user.user_code,
                profile_complete: user.profile_complete,
                is_paired: user.is_paired,
                partner_name: user.partner_name,
                partner_id: user.partner_id,
                avatar: user.avatar
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
    }
};

const getMe = async (req, res) => {
    res.json({ success: true, user: req.user });
};

module.exports = { register, login, getMe };