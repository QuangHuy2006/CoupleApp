const { getPool } = require('../config/database');

const updateAnniversary = async (req, res) => {
    try {
        const { date } = req.body; // expected format: YYYY-MM-DD
        const supabase = getPool();
        
        // Find couple by user
        const { data: coupleRows, error: findError } = await supabase
            .from('couple_pairs')
            .select('id, user1_id, user2_id')
            .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`)
            .eq('status', 'active');
            
        if (findError) throw findError;
        
        if (!coupleRows || coupleRows.length === 0) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy cặp đôi' });
        }
        const couple = coupleRows[0];
        
        // Update both users' anniversary_date
        const { error: updateError } = await supabase
            .from('users')
            .update({ anniversary_date: date })
            .in('id', [couple.user1_id, couple.user2_id]);
            
        if (updateError) throw updateError;
        
        res.json({ success: true, message: 'Cập nhật ngày kỷ niệm thành công', date });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { updateAnniversary };