# 🚀 CoupleApp - Quick Setup

## ⚡ FIRST TIME SETUP

### Step 1: Install Dependencies
**Double-click**: `install-deps.bat`

Or manually:
```bash
cd backend
npm install

cd ..
npm install
```

### Step 2: Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```

**Expected output**:
```
✅ MySQL kết nối thành công
✅ Các bảng đã được tạo
🚀 Server chạy tại http://localhost:5000
🔌 Socket.IO đã khởi động
```

### Step 3: Start Frontend (Terminal 2)
```bash
npm run dev
```

**Expected output**:
```
VITE v8.0.12  ready in XXX ms

➜  Local:   http://localhost:5173/
```

---

## ✅ Verify It's Working

1. Open http://localhost:5173 in your browser
2. Should see CoupleApp login page
3. Check browser console (F12) - no red errors

---

## 🧪 Test The App

### Create Test Accounts:
1. **User A**: email: `user.a@test.com`, password: `123456`
2. **User B**: email: `user.b@test.com`, password: `123456`

### Test Pairing:
1. Login as User A → Go to /pairing → Click "Tạo mã"
2. Copy the code
3. Open new browser/incognito → Login as User B
4. Go to /pairing → Click "Nhập mã" → Paste code → Click "Kết đôi ngay"

### Test Chat:
1. **User A** goes to /chat and sends: "Hello!"
2. **User B** should see it instantly in their /chat
3. User B replies: "Hi there!"
4. Both see messages real-time 💬

---

## 🆘 If npm install fails

**Issue**: "npm command not found"
- Make sure Node.js is installed: https://nodejs.org
- Restart your terminal after installing Node.js

**Issue**: Port 5000 already in use
- Change `PORT=5000` to `PORT=5001` in `backend/.env`

**Issue**: MySQL connection error
- Verify MySQL is running
- Check `.env` credentials match your MySQL setup

---

## 📂 Project Structure

```
coupleapp/
├── backend/          ← Node.js server
│   ├── src/
│   ├── .env
│   └── server.js
├── src/              ← React frontend
│   ├── pages/
│   ├── api/
│   └── App.tsx
├── install-deps.bat  ← Click to install
└── package.json
```

---

## 📚 Documentation

Full setup guides in session workspace:
- `QUICK_START.md`
- `SETUP_GUIDE.md`
- `CODE_CHANGES.md`
- `VISUAL_GUIDE.md`

---

**Ready? Let's go! 💕**
