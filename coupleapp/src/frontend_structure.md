```text
couple-app-frontend/
├── public/
├── src/
│   ├── assets/             # Hình ảnh static, icons, bộ sticker, wallpapers mặc định
│   │   └── images/
│   │
│   ├── api/                # Tầng quản lý các hàm gọi API (Dùng Axios hoặc Fetch)
│   │   ├── axiosClient.js  # Cấu hình Axios: tự động đính kèm JWT Token vào Header
│   │   ├── authApi.js      # Gọi các endpoint đăng ký, đăng nhập
│   │   ├── coupleApi.js    # Gọi các endpoint liên quan đến kết đôi, thông tin ngày yêu
│   │   └── diaryApi.js     # Gọi các endpoint lấy/tạo nhật ký kỷ niệm
│   │
│   ├── components/         # Các component dùng chung cho toàn bộ ứng dụng
│   │   ├── common/         # Component nhỏ lẻ: Button, Input, Loading, Avatar
│   │   └── layout/         # Các khung giao diện: MobileLayout, BottomNav (Thanh menu dưới)
│   │
│   ├── context/            # Quản lý Trạng thái toàn cục (Global State) của ứng dụng
│   │   └── AuthContext.tsx # 🟢 QUAN TRỌNG: Lưu thông tin User đăng nhập & Trạng thái đã kết đôi chưa
│   │
│   ├── pages/              # Các màn hình chính (Mỗi folder chứa giao diện của màn hình đó)
│   │   ├── auth/
│   │   │   ├── Login.tsx   # Màn hình Đăng nhập
│   │   │   └── Register.tsx# Màn hình Đăng ký
│   │   ├── pairing/
│   │   │   └── Pairing.tsx # Màn hình Tạo/Nhập mã kết đôi (Cho Single User)
│   │   ├── dashboard/
│   │   │   └── Home.tsx    # Màn hình chính: Hiển thị Avatar cặp đôi, Đếm số ngày yêu
│   │   ├── diary/
│   │   │   ├── DiaryList.tsx # Màn hình Timeline danh sách kỷ niệm
│   │   │   └── AddDiary.tsx  # Màn hình Viết nhật ký mới (Có upload ảnh)
│   │   └── chat/
│   │       └── Chat.tsx    # Màn hình Nhắn tin Realtime
│   │
│   ├── routes/             # Cấu hình phân trang và chặn quyền truy cập (Protected Routes)
│   │   └── AppRoutes.tsx   # Điều hướng: Chưa đăng nhập -> Auth, Chưa kết đôi -> Pairing, OK -> Home
│   │
│   ├── App.tsx             # Gộp các Context Provider và Bộ định tuyến Routes
│   └── main.tsx            # Entry point của React (Khởi tạo DOM)
│
├── .env                    # Lưu biến môi trường (VITE_API_URL=http://localhost:5000)
├── package.json
└── vite.config.js          # Nếu bạn dùng Vite (khuyên dùng vì nó nhanh hơn CRA)
```