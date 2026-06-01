const { getPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const createDiary = async (coupleId, userId, title, content, images, location) => {
    const diaryId = uuidv4();
    const pool = getPool();
    
    await pool.query(
        'INSERT INTO diaries (id, couple_id, user_id, title, content, images, location) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [diaryId, coupleId, userId, title, content, JSON.stringify(images || []), location]
    );
    
    return { id: diaryId, message: 'Tạo nhật ký thành công' };
};

const getDiaries = async (coupleId) => {
    const pool = getPool();
    
    const { rows: diaries } = await pool.query(
        `SELECT d.id, d.title, d.content, d.images, d.location, d.created_at, u.full_name as author_name
         FROM diaries d
         JOIN users u ON d.user_id = u.id
         WHERE d.couple_id = $1
         ORDER BY d.created_at DESC`,
        [coupleId]
    );
    
    // Parse images JSON
    const parsedDiaries = diaries.map(d => ({
        ...d,
        images: d.images ? JSON.parse(d.images) : []
    }));
    
    return { diaries: parsedDiaries };
};

const getDiaryDetail = async (diaryId) => {
    const pool = getPool();
    
    const { rows: diaries } = await pool.query(
        `SELECT d.id, d.title, d.content, d.images, d.location, d.created_at, u.full_name as author_name
         FROM diaries d
         JOIN users u ON d.user_id = u.id
         WHERE d.id = $1`,
        [diaryId]
    );
    
    if (diaries.length === 0) return null;
    
    const diary = diaries[0];
    diary.images = diary.images ? JSON.parse(diary.images) : [];
    return diary;
};

const deleteDiary = async (diaryId, userId) => {
    const pool = getPool();
    
    // Verify user owns the diary
    const { rows: diaries } = await pool.query('SELECT user_id FROM diaries WHERE id = $1', [diaryId]);
    
    if (diaries.length === 0) return { error: 'Không tìm thấy nhật ký' };
    if (diaries[0].user_id !== userId) return { error: 'Không có quyền xóa' };
    
    await pool.query('DELETE FROM diaries WHERE id = $1', [diaryId]);
    return { success: true };
};

module.exports = { createDiary, getDiaries, getDiaryDetail, deleteDiary };