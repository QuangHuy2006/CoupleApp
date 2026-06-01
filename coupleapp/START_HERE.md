# 🎉 CoupleApp - Optimization Complete!

## Quick Start (5 minutes)

### Backend
```bash
cd backend
npm install
npm run dev
```
✅ Backend runs on `http://localhost:5000`

### Frontend  
```bash
npm install
npm run dev
```
✅ Frontend runs on `http://localhost:5173`

---

## 🎯 What's New?

### 1. Enhanced Profile System 👤
- CCCD validation
- Phone number validation
- Upload 3+ photos of yourself
- Profile completion tracking

### 2. Fixed Unique Code 🔐
- Each user gets a unique 6-character code at registration
- Code never changes (e.g., "ABCD12")
- Use this code to connect with your partner

### 3. Location Sharing 📍
- Share your real-time location with your partner
- Auto-updates every 5 minutes
- See distance & direction between you two
- View on Google Maps

---

## 🚀 New User Flow

```
1. Register → Get unique code (e.g., ABCD12)
   ↓
2. Complete Profile → Enter phone + CCCD + upload 3+ photos
   ↓
3. Share Location → Enable location tracking
   ↓
4. Connect → Use partner's code to connect
   ↓
5. Track Together → See each other on map!
```

---

## 📋 Configuration Required

### 1. Google Maps (for location display)
- Get API key: https://console.cloud.google.com
- Add to `frontend/.env`:
  ```env
  VITE_GOOGLE_MAPS_API_KEY=your_key_here
  ```

### 2. Update index.html
Add before `</body>`:
```html
<script>
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
  document.head.appendChild(script);
</script>
```

---

## 🧪 Test It

### Register New User
1. Go to http://localhost:5173/register
2. Create account
3. Note your unique code (in response)

### Complete Profile
1. Enter phone (e.g., 0987654321)
2. Enter CCCD (12 digits)
3. Upload 3+ photos (drag & drop)
4. ✅ Profile complete!

### Share Location
1. Grant permission when prompted
2. Your location auto-updates every 5 min
3. Partner sees you on map
4. Distance shown (e.g., "2.5 km")

### Connect with Partner
1. Share your 6-character code
2. They enter it in the app
3. ✅ Connected!

---

## 📚 Full Documentation

- **OPTIMIZATION_GUIDE.md** - Complete setup guide with all endpoints
- **CHANGES_SUMMARY.md** - All files created/modified

---

## ❌ Issues?

### Photos not uploading?
- Check file size < 5MB
- At least 3 photos required
- Use image files only

### Location not showing?
- Check Google Maps API key
- Grant location permission
- Check browser console

### Profile incomplete?
- Phone must be 10 digits starting with 0
- CCCD must be exactly 12 digits
- Need at least 3 photos

---

## 📞 Quick Endpoints

| Action | Endpoint | Method |
|--------|----------|--------|
| Register | `/api/auth/register` | POST |
| Update Profile | `/api/profile/update` | PUT |
| Upload Photos | `/api/photos/upload` | POST |
| Update Location | `/api/location/update` | POST |
| Get Partner Location | `/api/location/partner` | GET |
| Pair with Code | `/api/couple/pair` | POST |

---

## 🎨 Files You Might Need to Update

1. **Frontend Routes** - Add ProfileSetupPage & LocationSharePage to router
2. **Navigation Menu** - Add "Location" option
3. **Dashboard** - Show profile completion status
4. **Auth Flow** - Redirect incomplete profiles to setup

---

## ✨ That's it!

Your dating app now has:
- ✅ Professional profile system
- ✅ Secure, fixed pairing codes  
- ✅ Real-time location sharing
- ✅ Auto-updating every 5 minutes

Start testing and enjoy! 🚀

---

**Next**: Read OPTIMIZATION_GUIDE.md for detailed setup
