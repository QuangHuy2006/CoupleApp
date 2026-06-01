const { getPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const createDiary = async (coupleId, userId, title, content, images, location) => {
    const diaryId = uuidv4();
    const supabase = getPool();
    
    const { error: insertError } = await supabase
        .from('diaries')
        .insert([{
            id: diaryId,
            couple_id: coupleId,
            user_id: userId,
            title,
            content,
            images: images || [],
            location
        }]);
        
    if (insertError) throw insertError;
    
    return { id: diaryId, message: 'Tạo nhật ký thành công' };
};

const getDiaries = async (coupleId) => {
    const supabase = getPool();
    
    const { data: diaries, error: fetchError } = await supabase
        .from('diaries')
        .select(`
            id, title, content, images, location, created_at,
            users!inner(full_name)
        `)
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });
        
    if (fetchError) throw fetchError;
    
    const parsedDiaries = diaries.map(d => ({
        id: d.id,
        title: d.title,
        content: d.content,
        images: Array.isArray(d.images) ? d.images : (d.images ? JSON.parse(d.images) : []),
        location: d.location,
        created_at: d.created_at,
        author_name: d.users?.full_name
    }));
    
    return { diaries: parsedDiaries };
};

const getDiaryDetail = async (diaryId) => {
    const supabase = getPool();
    
    const { data: diaries, error: fetchError } = await supabase
        .from('diaries')
        .select(`
            id, title, content, images, location, created_at,
            users!inner(full_name)
        `)
        .eq('id', diaryId);
        
    if (fetchError) throw fetchError;
    
    if (!diaries || diaries.length === 0) return null;
    
    const d = diaries[0];
    return {
        id: d.id,
        title: d.title,
        content: d.content,
        images: Array.isArray(d.images) ? d.images : (d.images ? JSON.parse(d.images) : []),
        location: d.location,
        created_at: d.created_at,
        author_name: d.users?.full_name
    };
};

const deleteDiary = async (diaryId, userId) => {
    const supabase = getPool();
    
    // Verify user owns the diary
    const { data: diaries, error: checkError } = await supabase
        .from('diaries')
        .select('user_id')
        .eq('id', diaryId);
        
    if (checkError) throw checkError;
    
    if (!diaries || diaries.length === 0) return { error: 'Không tìm thấy nhật ký' };
    if (diaries[0].user_id !== userId) return { error: 'Không có quyền xóa' };
    
    const { error: deleteError } = await supabase
        .from('diaries')
        .delete()
        .eq('id', diaryId);
        
    if (deleteError) throw deleteError;
    
    return { success: true };
};

module.exports = { createDiary, getDiaries, getDiaryDetail, deleteDiary };