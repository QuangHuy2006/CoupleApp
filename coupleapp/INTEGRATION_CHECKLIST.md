# 🔗 Integration Checklist

## Before You Start
- [ ] Read START_HERE.md
- [ ] Read OPTIMIZATION_GUIDE.md
- [ ] Get Google Maps API key from Google Cloud Console

---

## Frontend Integration Tasks

### Step 1: Update App Routes
**File**: `src/App.tsx` or your main router file

```tsx
import ProfileSetupPage from './pages/ProfileSetupPage';
import LocationSharePage from './pages/LocationSharePage';

// Add to your routes:
<Route path="/setup/profile" element={<ProfileSetupPage />} />
<Route path="/location" element={<LocationSharePage />} />
```

### Step 2: Update Auth Flow
**File**: Your login/auth component

```tsx
// After successful login, check profile completion:
if (!user.profile_complete) {
  navigate('/setup/profile');
} else {
  navigate('/dashboard');
}
```

### Step 3: Add Navigation Menu
**File**: Navigation/Header component

```tsx
<nav>
  {/* ... existing links ... */}
  <Link to="/location">📍 Location</Link>
</nav>
```

### Step 4: Show Profile Status
**File**: Dashboard or Profile component

```tsx
import { profileApi } from './api/profileApi';

// Get completion status:
const completion = await profileApi.getProfileCompletion();
console.log(`Profile ${completion.percentage}% complete`);
```

### Step 5: Environment Variables
**File**: `.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

### Step 6: Google Maps Script
**File**: `index.html` (add before `</body>`)

```html
<script>
  // Load Google Maps API dynamically
  if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    document.head.appendChild(script);
  }
</script>
```

---

## Backend Integration Tasks

### Step 1: Start Fresh (Optional)
If you want clean data:

```bash
# Stop backend
# Delete old database or data
# Restart backend - new schema auto-creates
npm run dev
```

### Step 2: Verify Database
Check that these tables exist:
- [ ] `users` (with new columns: phone_number, cccd, user_code, profile_complete, latitude, longitude)
- [ ] `user_photos`
- [ ] `user_locations`

Query to verify:
```sql
DESCRIBE users;
-- Should show: phone_number, cccd, user_code, profile_complete, latitude, longitude

SHOW TABLES;
-- Should show: user_photos, user_locations
```

### Step 3: Environment Variables
**File**: `backend/.env`

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=couple_app
PORT=5000
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

### Step 4: Start Backend
```bash
cd backend
npm run dev
```

Verify logs show:
```
✅ MySQL connected
✅ Tables created
🚀 Server running at http://localhost:5000
```

---

## Testing Checklist

### Test 1: New User Registration
- [ ] Go to `/register`
- [ ] Create account with: email, password, full_name
- [ ] Check response includes `user_code` (6 chars, format: XXXX##)
- [ ] Verify code is unique (register 2nd user, code should differ)

### Test 2: Profile Setup
- [ ] Login with new account
- [ ] Redirect to `/setup/profile`
- [ ] Enter phone number (10 digits, starts with 0)
- [ ] Enter CCCD (exactly 12 digits)
- [ ] Upload 3+ photos via drag-drop
- [ ] See progress bar reach 100%
- [ ] Click upload
- [ ] Verify success message

### Test 3: Profile Completion Status
- [ ] Call `/api/profile/completion/status`
- [ ] Check response shows:
  - `hasPhone: true`
  - `hasCCCD: true`
  - `hasPhotos: true`
  - `profileComplete: true`
  - `percentage: 100`

### Test 4: Photo Management
- [ ] View profile, see photos displayed
- [ ] Delete a photo → count decreases
- [ ] Remaining 2 photos should set profileComplete to false
- [ ] Set different photo as primary
- [ ] Verify in next profile load

### Test 5: Location Sharing
- [ ] Grant location permission when prompted
- [ ] See your location on map
- [ ] Wait 5 minutes OR click "Update now"
- [ ] Verify location updates sent to server
- [ ] See location in `/api/location/update` response

### Test 6: Partner Location
- [ ] Login as User A (complete profile + location)
- [ ] Login as User B (complete profile + location)
- [ ] User B: Enter User A's user_code
- [ ] Call `/api/location/partner`
- [ ] See User A's location, distance, direction
- [ ] Verify both users see each other

### Test 7: Mobile Responsiveness
- [ ] Test on mobile device or responsive mode
- [ ] Profile setup: inputs responsive
- [ ] Photo upload: grid responsive
- [ ] Location map: fills screen width

---

## Troubleshooting Guide

### "user_code is NULL"
- [ ] Check authController.js has generateUniqueUserCode
- [ ] Delete old users and re-register
- [ ] Restart backend

### Photos don't upload
- [ ] Check `/public/photos` directory exists
- [ ] Check multer in backend/package.json
- [ ] Check file size < 5MB
- [ ] Check at least 3 photos selected

### Location not showing on map
- [ ] Check VITE_GOOGLE_MAPS_API_KEY in .env
- [ ] Check Google Maps API is enabled in Cloud Console
- [ ] Check browser allows location permission
- [ ] Check browser console for errors

### Profile setup stuck
- [ ] Phone must be format: 0xxxxxxxxx (0 + 9 digits)
- [ ] CCCD must be exactly 12 digits
- [ ] Need at least 3 photos
- [ ] Check error message in UI

### "Profile incomplete" when trying to pair
- [ ] User must complete phone, CCCD, 3+ photos
- [ ] Check profile completion status endpoint
- [ ] Verify profile_complete = true in database

---

## Performance Verification

### Test Load Times
- [ ] Registration: < 1 second
- [ ] Profile update: < 2 seconds
- [ ] Photo upload (3x500KB): < 5 seconds
- [ ] Location update: < 1 second
- [ ] Map load: < 3 seconds

### Test Concurrent Usage
- [ ] 2 users updating location simultaneously
- [ ] Multiple users uploading photos at once
- [ ] One user viewing while another updates profile

---

## Security Verification

- [ ] CCCD validation working (12 digits only)
- [ ] Phone validation working (format check)
- [ ] File type validation (no non-image files)
- [ ] File size validation (max 5MB)
- [ ] JWT required on protected endpoints
- [ ] Unauthorized requests rejected

---

## Final Verification

- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:5173
- [ ] Can register new users
- [ ] Can complete profile
- [ ] Can upload photos
- [ ] Can update location
- [ ] Can see partner location
- [ ] Can pair with fixed code
- [ ] UI looks good on desktop and mobile
- [ ] No console errors
- [ ] All tests passed

---

## Deployment Pre-Flight

Before going live, ensure:

- [ ] All environment variables set
- [ ] Database backed up
- [ ] HTTPS certificate installed
- [ ] Google Maps API key from production Cloud project
- [ ] CORS properly configured for production domain
- [ ] Rate limiting implemented
- [ ] Error logging set up
- [ ] Monitoring/alerts configured
- [ ] User data backup strategy defined

---

## Quick Integration Commands

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend  
npm install
npm run dev

# Test API
curl http://localhost:5000/api/health

# Check database
mysql -u root -p
> USE couple_app;
> SHOW TABLES;
> DESCRIBE users;
```

---

## Integration Contact Points

| Feature | Files to Check | API Endpoint |
|---------|-----------------|-------------|
| Register | authController.js | POST /api/auth/register |
| Update Profile | profileController.js | PUT /api/profile/update |
| Upload Photos | photosController.js | POST /api/photos/upload |
| Update Location | locationController.js | POST /api/location/update |
| Get Partner Location | locationController.js | GET /api/location/partner |
| Pair Users | coupleController.js | POST /api/couple/pair |

---

## Success Indicators

✅ You're done when:

1. New users can register and get unique code
2. Users can complete profile with phone/CCCD/photos
3. Users can see location on map
4. Location updates automatically every 5 min
5. Partners can see each other's location
6. All features work on mobile

---

**Estimated Integration Time**: 1-2 hours
**Difficulty Level**: Medium
**Support**: Check documentation files

Good luck! 🚀
