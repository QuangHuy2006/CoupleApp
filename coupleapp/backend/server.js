const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const { initSocket } = require('./src/config/socket');
const http = require('http');

const PORT = process.env.PORT || 5000;

// Khởi động server
const startServer = async () => {
    await connectDB();
    
    // Tạo HTTP server cho Socket.IO
    const server = http.createServer(app);
    
    // Khởi tạo Socket.IO
    initSocket(server);
    
    server.listen(PORT, () => {
        console.log(`\n🚀 Server chạy tại http://localhost:${PORT}`);
        console.log(`📝 Các API:`);
        console.log(`   POST   /api/auth/register`);
        console.log(`   POST   /api/auth/login`);
        console.log(`   GET    /api/auth/me`);
        console.log(`   POST   /api/couple/create-code`);
        console.log(`   POST   /api/couple/pair`);
        console.log(`   GET    /api/couple/info`);
        console.log(`   GET    /api/chat/messages`);
        console.log(`   POST   /api/chat/send`);
        console.log(`🔌 Socket.IO đã khởi động`);
    });
};

startServer();