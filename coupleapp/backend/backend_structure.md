```text
couple-app-backend/
├── src/
│   ├── config/                 # Cấu hình hệ thống (Database, JWT, Socket)
│   │   ├── db.js               # Kết nối PostgreSQL (Dùng pg-pool hoặc Sequelize/Prisma)
│   │   └── socket.js           # Cấu hình khởi tạo Socket.io cho Realtime Chat
│   │
│   ├── middlewares/            # Bộ lọc bảo mật và xử lý trung gian
│   │   ├── authMiddleware.js   # 🟢 QUAN TRỌNG: Verify Token JWT & Đính kèm user/couple context
│   │   └── errorMiddleware.js  # Xử lý bắt lỗi tập trung (Centralized Error Handler)
│   │
│   ├── controllers/            # Tiếp nhận Request, điều hướng logic và trả về Response
│   │   ├── authController.js   # Xử lý Đăng ký, Đăng nhập, Đăng xuất
│   │   ├── coupleController.js # Xử lý Tạo mã, Nhập mã kết đôi, Đếm ngày yêu
│   │   ├── diaryController.js  # Xử lý Viết nhật ký, lấy Timeline kỷ niệm
│   │   └── wishController.js   # Xử lý Thêm/Sửa/Xóa điều ước chung
│   │
│   ├── services/               # Nơi viết Logic nghiệp vụ chính và các câu lệnh SQL
│   │   ├── authService.js
│   │   ├── coupleService.js
│   │   ├── diaryService.js
│   │   └── chatService.js      # Lưu lịch sử chat vào PostgreSQL
│   │
│   ├── routes/                 # Định tuyến các Endpoint API từ Frontend
│   │   ├── authRoutes.js       # Các API liên quan đến tài khoản
│   │   ├── coupleRoutes.js     # Các API liên quan đến không gian cặp đôi
│   │   ├── diaryRoutes.js      # Các API liên quan đến nhật ký
│   │   ├── wishRoutes.js       # Các API liên quan đến wishlist
│   │   └── index.js            # File gộp tất cả các router lại thành một mối
│   │
│   └── app.js                  # Khởi tạo Express app, cấu hình CORS, tích hợp Socket.io
│
├── .env                        # Lưu biến môi trường bảo mật (DATABASE_URL, JWT_SECRET, PORT)
├── package.json                # Quản lý các thư viện cài đặt (dependencies)
└── server.js                   # Entry Point - File chạy chính để start server (app.listen)
```