const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

let supabase = null;

const connectDB = async () => {
    try {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
            throw new Error('Thiếu cấu hình SUPABASE_URL hoặc SUPABASE_KEY');
        }

        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        
        console.log('✅ Kết nối Supabase thành công');
        return supabase;
    } catch (error) {
        console.error('❌ Lỗi cấu hình Supabase:', error.message);
        process.exit(1);
    }
};

const getPool = () => {
    if (!supabase) {
        throw new Error('Supabase chưa được khởi tạo');
    }
    return supabase;
};

// Vẫn giữ tên hàm getPool để giảm lỗi khi import ở các file khác,
// nhưng thực chất nó trả về supabase client.
module.exports = { connectDB, getPool };