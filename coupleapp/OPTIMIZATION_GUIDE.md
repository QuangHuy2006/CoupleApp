# CoupleApp Optimization - Implementation Guide

## ✅ Completed Features

### 1. **Enhanced User Profile System**
- ✅ CCCD (ID Card) validation and storage
- ✅ Phone number validation and storage  
- ✅ Multiple photos support (minimum 3 photos)
- ✅ Profile completion tracking
- ✅ Profile completion requirement before pairing

### 2. **Fixed Unique User Code System**
- ✅ Generates unique 6-character code at registration
- ✅ Code format: 4 letters + 2 numbers (e.g., "ABCD12")
- ✅ Fixed per user (doesn't change)
- ✅ Auto-validation for uniqueness

### 3. **Real-time Location Sharing**
- ✅ Automatic geolocation tracking
- ✅ Updates every 5-10 minutes
- ✅ Distance calculation between partners
- ✅ Direction indicator (N, NE, E, SE, S, SW, W, NW)
- ✅ Location history storage
- ✅ Google Maps integration ready

---

## 🚀 Setup Instructions

### Backend Setup

#### 1. Install Dependencies
```bash
cd backend
npm install
```

#### 2. Environment Variables
Make sure your `.env` file in backend includes:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=couple_app
PORT=5000
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

#### 3. Database Initialization
The database schema will auto-create when you start the server. New tables include:
- `user_photos` - Store user photos
- `user_locations` - Store location history
- Updated `users` table with: `phone_number`, `cccd`, `user_code`, `profile_complete`, `latitude`, `longitude`

#### 4. Start Backend Server
```bash
npm run dev
# Server runs on http://localhost:5000
```

### Frontend Setup

#### 1. Install Dependencies (if needed)
```bash
npm install
```

#### 2. Environment Variables
Create `.env` in frontend root:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

#### 3. Add Google Maps API Key
To get a Google Maps API key:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable "Maps JavaScript API"
4. Create API key (Credentials > API Key)
5. Add it to your `.env` as `VITE_GOOGLE_MAPS_API_KEY`

#### 4. Update HTML (Add Google Maps Script)
In `index.html`, add before closing `</body>`:
```html
<script>
  // Load Google Maps API
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
  document.head.appendChild(script);
</script>
```

Or better, update your main component to load it:
```typescript
useEffect(() => {
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
  script.async = true;
  document.head.appendChild(script);
}, []);
```

#### 5. Start Frontend Server
```bash
npm run dev
# Server runs on http://localhost:5173
```

---

## 📋 API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register with auto-generated user_code
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user info

### Profile Management
- `GET /api/profile/me` - Get user profile with photos
- `PUT /api/profile/update` - Update profile (phone, cccd, name)
- `GET /api/profile/completion/status` - Check profile completion %

### Photos
- `POST /api/photos/upload` - Upload photos (multipart, min 3)
- `GET /api/photos/:userId` - Get user's photos
- `DELETE /api/photos/:photoId` - Delete a photo
- `PUT /api/photos/:photoId/primary` - Set as primary photo

### Location
- `POST /api/location/update` - Update current location
- `GET /api/location/partner` - Get partner's current location + distance
- `GET /api/location/history?days=7` - Get location history
- `DELETE /api/location/history` - Clear location history

### Pairing
- `POST /api/couple/create-code` - Create pairing code (deprecated, use user_code instead)
- `POST /api/couple/pair` - Pair with partner using user_code
- `GET /api/couple/info` - Get couple info

---

## 🎨 UI Components Created

### Pages
- `src/pages/ProfileSetupPage.tsx` - 2-step profile setup (info + photos)
- `src/pages/LocationSharePage.tsx` - Map-based location sharing

### Components
- `src/components/common/PhotoUpload.tsx` - Drag-drop photo uploader

### Hooks
- `src/hooks/useLocationTracking.ts` - Custom hook for location management

### Services
- `src/services/geolocationService.ts` - Browser geolocation wrapper
- `src/services/photoUploadService.ts` - Photo upload utilities

### APIs
- `src/api/photosApi.ts` - Photos endpoint wrapper
- `src/api/locationApi.ts` - Location endpoint wrapper

---

## 🔄 User Flow

### 1. New User Registration
```
Register → Get Auto-Generated user_code → Profile Setup (CCCD + Phone) → Photo Upload → Complete
```

### 2. Profile Completion Check
```
Login → Check profile_complete status → If false, redirect to ProfileSetup → If true, allow full access
```

### 3. Location Sharing
```
User A enables location → Auto-update every 5 min → Partner sees on map → Distance/Direction shown
```

### 4. Pairing Process
```
User A: Uses their user_code (fixed) → User B: Enters User A's code → Pair together
```

---

## 📝 Database Schema Changes

### Updated `users` Table
```sql
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN cccd VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN user_code VARCHAR(8) UNIQUE NOT NULL;
ALTER TABLE users ADD COLUMN profile_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN latitude DECIMAL(10, 8);
ALTER TABLE users ADD COLUMN longitude DECIMAL(11, 8);
```

### New Tables
```sql
CREATE TABLE user_photos (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  photo_path VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_photos (user_id)
);

CREATE TABLE user_locations (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_location (user_id, updated_at)
);
```

---

## 🔒 Security Notes

✅ **Implemented:**
- CCCD format validation (12 digits)
- Phone number format validation
- Image file type validation
- File size limits (5MB per image)
- CORS enabled
- JWT authentication required

⚠️ **To Consider:**
- Encrypt sensitive data in transit (HTTPS)
- Rate limit location updates to prevent abuse
- Add user consent for location tracking
- Implement location permission revocation
- Add data retention policy for location history

---

## ❓ Troubleshooting

### Google Maps Not Loading
- Check `VITE_GOOGLE_MAPS_API_KEY` in `.env`
- Verify API key is enabled in Google Cloud Console
- Check browser console for errors

### Photos Not Uploading
- Check max file size (5MB)
- Verify file is actually an image
- Check backend `/public/photos` folder permissions
- Verify `multer` is installed: `npm list multer`

### Location Not Updating
- Check if geolocation permission is granted
- Verify `VITE_API_URL` is correct in `.env`
- Check browser's location services are enabled
- Review browser console for geolocation errors

### Profile Setup Not Completing
- Verify phone format: must start with 0, 10 digits total
- Verify CCCD: must be exactly 12 digits
- Upload at least 3 photos (minimum requirement)

---

## 📊 Performance Optimization Tips

1. **Location Updates**: Adjust interval in `useLocationTracking` (default 5 min = 300000ms)
2. **Photo Compression**: Consider compressing images before upload in `PhotoUpload.tsx`
3. **Map Optimization**: Set appropriate zoom levels in LocationSharePage
4. **Cache**: Store location history to reduce API calls

---

## 🧪 Testing Checklist

- [ ] Register new user (verify user_code generated)
- [ ] Complete profile (phone + CCCD validation)
- [ ] Upload photos (min 3, drag-drop, remove, set primary)
- [ ] Update location (verify coordinates saved)
- [ ] View partner location (map display, distance, direction)
- [ ] Pair users (one user's code to another)
- [ ] Location auto-update (verify 5-min interval)
- [ ] Mobile responsiveness (test on phone)

---

## 🎯 Next Steps

1. ✅ Backend: All endpoints ready
2. ✅ Frontend: Core components created
3. ⏳ Integration: Connect ProfileSetup to auth flow
4. ⏳ Integration: Add LocationShare to dashboard
5. ⏳ Testing: Full E2E testing
6. ⏳ Deployment: Docker, CI/CD setup

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review browser console for errors
3. Check backend logs: `npm run dev`
4. Verify `.env` configuration

---

**Last Updated**: June 2026
**Status**: ✅ Complete Implementation
**Ready for**: Testing & Integration
