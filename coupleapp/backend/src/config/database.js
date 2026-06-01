const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

const connectDB = async () => {
    try {
        // Kết nối trực tiếp (database đã tạo bởi init-database.sql)
        pool = await mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        
        console.log('✅ MySQL kết nối thành công (cổng 3306)');
        return pool;
    } catch (error) {
        console.error('❌ Lỗi kết nối MySQL:', error.message);
        process.exit(1);
    }
};

const getPool = () => {
    if (!pool) {
        throw new Error('Database chưa được kết nối');
    }
    return pool;
};

module.exports = { connectDB, getPool };