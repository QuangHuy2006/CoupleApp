const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { getPool } = require('./database');

let io = null;
const userSockets = {}; // Map của userId -> socketId

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });
    
    // Middleware để xác thực JWT
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Không có token'));
        }
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            next();
        } catch (error) {
            next(new Error('Token không hợp lệ'));
        }
    });
    
    // Xử lý kết nối
    io.on('connection', (socket) => {
        console.log(`✅ User ${socket.userId} kết nối. Socket ID: ${socket.id}`);
        userSockets[socket.userId] = socket.id;
        
        // Lắng nghe tin nhắn
        socket.on('send_message', async (data) => {
            try {
                const { message, type = 'text', media_url = null, coupleId, partnerId } = data;
                const supabase = getPool();
                const { v4: uuidv4 } = require('uuid');
                
                const messageId = uuidv4();
                const timestamp = new Date();
                
                // Lưu vào DB
                const { error: insertError } = await supabase
                    .from('messages')
                    .insert([{
                        id: messageId,
                        couple_id: coupleId,
                        sender_id: socket.userId,
                        message: message || null,
                        type,
                        media_url,
                        created_at: timestamp.toISOString()
                    }]);
                    
                if (insertError) throw insertError;
                
                // Lấy thông tin user gửi
                const { data: userRows, error: userError } = await supabase
                    .from('users')
                    .select('full_name')
                    .eq('id', socket.userId);
                    
                if (userError) throw userError;
                const senderName = userRows?.[0]?.full_name || 'Bạn';
                
                // Gửi tin nhắn cho partner
                if (partnerId && userSockets[partnerId]) {
                    io.to(userSockets[partnerId]).emit('receive_message', {
                        id: messageId,
                        sender_id: socket.userId,
                        message,
                        type,
                        media_url,
                        created_at: timestamp,
                        full_name: senderName
                    });
                }
                
                // Xác nhận với người gửi
                socket.emit('message_sent', {
                    id: messageId,
                    sender_id: socket.userId,
                    message,
                    type,
                    media_url,
                    created_at: timestamp,
                    full_name: senderName
                });
            } catch (error) {
                console.error('Lỗi khi lưu tin nhắn:', error);
                socket.emit('error', { message: 'Lỗi khi gửi tin nhắn' });
            }
        });
        
        // Lắng nghe typing indicator
        socket.on('typing', (data) => {
            const { partnerId } = data;
            if (partnerId && userSockets[partnerId]) {
                io.to(userSockets[partnerId]).emit('partner_typing', {
                    userId: socket.userId
                });
            }
        });
        
        // Lắng nghe stop typing
        socket.on('stop_typing', (data) => {
            const { partnerId } = data;
            if (partnerId && userSockets[partnerId]) {
                io.to(userSockets[partnerId]).emit('partner_stop_typing', {
                    userId: socket.userId
                });
            }
        });
        
        // --- WebRTC Signaling for Calls ---
        
        // Gọi cho partner
        socket.on('call_user', (data) => {
            const { partnerId, signalData, from, callerName, type, room } = data;
            if (partnerId && userSockets[partnerId]) {
                socket.join(room);
                io.to(userSockets[partnerId]).emit('incoming_call', {
                    signal: signalData,
                    from,
                    callerName,
                    type,
                    room
                });
            }
        });

        // Trả lời cuộc gọi
        socket.on('answer_call', (data) => {
            const { signal, room, to } = data;
            socket.join(room);
            if (to && userSockets[to]) {
                io.to(userSockets[to]).emit('call_answered', { signal });
            }
        });

        // Từ chối cuộc gọi
        socket.on('reject_call', (data) => {
            const { to } = data;
            if (to && userSockets[to]) {
                io.to(userSockets[to]).emit('call_rejected');
            }
        });

        // Gửi ICE Candidate
        socket.on('ice_candidate', (data) => {
            const { candidate, room, to } = data;
            if (room) {
                socket.to(room).emit('ice_candidate', { candidate });
            } else if (to && userSockets[to]) {
                io.to(userSockets[to]).emit('ice_candidate', { candidate });
            }
        });

        // Kết thúc cuộc gọi
        socket.on('end_call', (data) => {
            const { room } = data;
            if (room) {
                socket.to(room).emit('call_ended');
                socket.leave(room);
            }
        });

        // Xử lý ngắt kết nối
        socket.on('disconnect', () => {
            console.log(`❌ User ${socket.userId} ngắt kết nối`);
            delete userSockets[socket.userId];
        });
    });
    
    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO chưa được khởi tạo');
    }
    return io;
};

module.exports = { initSocket, getIO, userSockets };
