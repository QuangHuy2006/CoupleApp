const multer = require('multer');

// Use memory storage for Supabase upload (not disk)
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

module.exports = upload;
