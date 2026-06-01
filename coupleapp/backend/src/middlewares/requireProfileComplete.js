const requireProfileComplete = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Không có user xác thực' });
        }

        if (!req.user.profile_complete) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng hoàn tất hồ sơ trước khi sử dụng tính năng này',
                code: 'PROFILE_INCOMPLETE'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { requireProfileComplete };
