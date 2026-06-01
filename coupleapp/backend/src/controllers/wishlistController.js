const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/database');

const createWishlist = async (req, res) => {
    try {
        const { title, description } = req.body;
        const supabase = getPool();
        
        const { data: coupleRows, error: coupleError } = await supabase
            .from('couple_pairs')
            .select('id')
            .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`)
            .eq('status', 'active');
            
        if (coupleError) throw coupleError;
        if (!coupleRows || coupleRows.length === 0) return res.status(400).json({ success: false, message: 'Không tìm thấy cặp đôi' });
        
        const coupleId = coupleRows[0].id;
        const id = uuidv4();
        
        const { error: insertError } = await supabase
            .from('wishlists')
            .insert([{
                id,
                couple_id: coupleId,
                title,
                description
            }]);
            
        if (insertError) throw insertError;
        
        res.status(201).json({ success: true, wishlist: { id, title, description, is_done: false, created_at: new Date() } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getWishlists = async (req, res) => {
    try {
        const supabase = getPool();
        
        const { data: coupleRows, error: coupleError } = await supabase
            .from('couple_pairs')
            .select('id')
            .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`)
            .eq('status', 'active');
            
        if (coupleError) throw coupleError;
        if (!coupleRows || coupleRows.length === 0) return res.status(400).json({ success: false, message: 'Không tìm thấy cặp đôi' });
        
        const coupleId = coupleRows[0].id;
        
        const { data: rows, error: selectError } = await supabase
            .from('wishlists')
            .select('id, title, description, is_done, created_at')
            .eq('couple_id', coupleId)
            .order('created_at', { ascending: false });
            
        if (selectError) throw selectError;
        
        res.json({ success: true, wishlists: rows || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateWishlist = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, is_done } = req.body;
        const supabase = getPool();
        
        const { error: updateError } = await supabase
            .from('wishlists')
            .update({
                title,
                description,
                is_done: !!is_done
            })
            .eq('id', id);
            
        if (updateError) throw updateError;
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteWishlist = async (req, res) => {
    try {
        const { id } = req.params;
        const supabase = getPool();
        
        const { error: deleteError } = await supabase
            .from('wishlists')
            .delete()
            .eq('id', id);
            
        if (deleteError) throw deleteError;
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createWishlist, getWishlists, updateWishlist, deleteWishlist };