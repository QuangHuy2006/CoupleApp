# ⚠️ QUICK FIX - Install Dependencies

## The Error
```
Error: Cannot find module 'socket.io'
```

This happens because npm dependencies haven't been installed yet.

---

## ✅ Solution (2 Steps)

### Step 1️⃣ Open Command Prompt
- Press `Windows + R`
- Type: `cmd`
- Press `Enter`

### Step 2️⃣ Run Install Commands

**Copy & paste this into Command Prompt:**

```bash
cd C:\Users\tonph\Desktop\CoupleApp\coupleapp\backend
npm install
```

Wait for it to finish (will show "added 123 packages" or similar).

Then:

```bash
cd ..
npm install
```

Wait for it to finish again.

---

## 🎉 Now You're Ready!

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

Wait for this message:
```
🚀 Server chạy tại http://localhost:5000
🔌 Socket.IO đã khởi động
```

### Terminal 2 - Frontend (new terminal)
```bash
npm run dev
```

Wait for this message:
```
➜  Local:   http://localhost:5173/
```

---

## ✅ Test It!

1. Open http://localhost:5173
2. Register 2 users
3. Pair them with code
4. Chat real-time! 💬

---

## 🆘 Still Having Issues?

**Socket.io still not found?**
- Make sure the install finished (check for "added X packages")
- Try: `cd backend && npm install socket.io`

**Port 5000 in use?**
- Change backend/.env: `PORT=5001`

**MySQL error?**
- Check MySQL is running
- Verify backend/.env credentials

---

**Need help? Check SETUP.md in the project folder!** 📖
