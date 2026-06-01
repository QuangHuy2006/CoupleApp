const { Pool } = require('pg');
require('dotenv').config();

let pool = null;

const connectDB = async () => {
    try {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });
        
        // Test connection
        const client = await pool.connect();
        client.release();
        
        console.log('✅ PostgreSQL (Supabase) kết nối thành công');
        return pool;
    } catch (error) {
        console.error('❌ Lỗi kết nối PostgreSQL:', error.message);
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