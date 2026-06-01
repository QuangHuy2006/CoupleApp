const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const register = async (email, password, full_name) => {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
        throw new Error('Email đã được đăng ký');
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userId = uuidv4();
    
    await pool.query(
        'INSERT INTO users (id, email, password, full_name) VALUES ($1, $2, $3, $4)',
        [userId, email, hashedPassword, full_name]
    );
    
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    return { token, user: { id: userId, email, full_name: full_name, is_paired: false } };
};

const login = async (email, password) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
        throw new Error('Email hoặc mật khẩu không đúng');
    }
    
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
        throw new Error('Email hoặc mật khẩu không đúng');
    }
    
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            is_paired: user.is_paired,
            partner_name: user.partner_name,
            partner_id: user.partner_id
        }
    };
};

module.exports = { register, login };