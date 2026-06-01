const diaryService = require('../services/diaryService');
const { getPool } = require('../config/database');

const createDiary = async (req, res) => {
    try {
        const { title, content, images, location } = req.body;
        const supabase = getPool();
        
        // Lấy couple_id
        const { data: coupleRows, error: coupleError } = await supabase
            .from('couple_pairs')
            .select('id')
            .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`)
            .eq('status', 'active');
            
        if (coupleError) throw coupleError;
        
        if (!coupleRows || coupleRows.length === 0) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy cặp đôi' });
        }
        
        const coupleId = coupleRows[0].id;
        const result = await diaryService.createDiary(coupleId, req.user.id, title, content, images, location);
        res.status(201).json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getDiaries = async (req, res) => {
    try {
        const supabase = getPool();
        
        // Lấy couple_id
        const { data: coupleRows, error: coupleError } = await supabase
            .from('couple_pairs')
            .select('id')
            .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`)
            .eq('status', 'active');
            
        if (coupleError) throw coupleError;
        
        if (!coupleRows || coupleRows.length === 0) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy cặp đôi' });
        }
        
        const coupleId = coupleRows[0].id;
        const result = await diaryService.getDiaries(coupleId);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getDiaryDetail = async (req, res) => {
    try {
        const { diaryId } = req.params;
        const diary = await diaryService.getDiaryDetail(diaryId);
        
        if (!diary) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy nhật ký' });
        }
        
        res.json({ success: true, diary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteDiary = async (req, res) => {
    try {
        const { diaryId } = req.params;
        const result = await diaryService.deleteDiary(diaryId, req.user.id);
        
        if (result.error) {
            return res.status(403).json({ success: false, message: result.error });
        }
        
        res.json({ success: true, message: 'Nhật ký đã xóa' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createDiary, getDiaries, getDiaryDetail, deleteDiary };