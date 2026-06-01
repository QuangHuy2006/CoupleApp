const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/database');

const createCode = async (req, res) => {
    try {
        const supabase = getPool();
        const pairCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const coupleId = uuidv4();
        
        const { error: insertError } = await supabase
            .from('couple_pairs')
            .insert([{
                id: coupleId,
                code: pairCode,
                user1_id: req.user.id,
                status: 'pending'
            }]);
            
        if (insertError) throw insertError;
        
        const { error: updateError } = await supabase
            .from('users')
            .update({ pair_code: pairCode })
            .eq('id', req.user.id);
            
        if (updateError) throw updateError;
        
        res.json({ success: true, code: pairCode });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const pairWithCode = async (req, res) => {
    try {
        const { code } = req.body;
        const supabase = getPool();
        
        // Tìm cặp đôi theo code
        const { data: coupleRows, error: findError } = await supabase
            .from('couple_pairs')
            .select('id, user1_id')
            .eq('code', code)
            .eq('status', 'pending')
            .is('user2_id', null);
            
        if (findError) throw findError;
        
        if (!coupleRows || coupleRows.length === 0) {
            return res.status(400).json({ success: false, message: 'Mã kết đôi không hợp lệ' });
        }
        
        const couple = coupleRows[0];
        
        // Cập nhật cặp đôi
        const { error: updateCoupleError } = await supabase
            .from('couple_pairs')
            .update({
                user2_id: req.user.id,
                status: 'active',
                paired_at: new Date().toISOString()
            })
            .eq('id', couple.id);
            
        if (updateCoupleError) throw updateCoupleError;
        
        // Lấy tên user1
        const { data: user1Rows, error: err1 } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', couple.user1_id);
            
        if (err1) throw err1;
        const user1Name = user1Rows[0].full_name;
        
        // Cập nhật user2 (current user)
        const { error: updateU2Error } = await supabase
            .from('users')
            .update({
                is_paired: true,
                partner_id: couple.user1_id,
                partner_name: user1Name,
                pair_code: null
            })
            .eq('id', req.user.id);
            
        if (updateU2Error) throw updateU2Error;
        
        // Lấy tên user2
        const { data: user2Rows, error: err2 } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', req.user.id);
            
        if (err2) throw err2;
        const user2Name = user2Rows[0].full_name;
        
        // Cập nhật user1
        const { error: updateU1Error } = await supabase
            .from('users')
            .update({
                is_paired: true,
                partner_id: req.user.id,
                partner_name: user2Name,
                pair_code: null
            })
            .eq('id', couple.user1_id);
            
        if (updateU1Error) throw updateU1Error;
        
        // Return updated user data
        const { data: updatedUserRows, error: err3 } = await supabase
            .from('users')
            .select('id, email, full_name, is_paired, partner_id, partner_name')
            .eq('id', req.user.id);
            
        if (err3) throw err3;
        
        res.json({ 
            success: true, 
            message: '💑 Kết đôi thành công!',
            user: updatedUserRows[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getCoupleInfo = async (req, res) => {
    try {
        const supabase = getPool();
        let coupleInfo = {};
        
        if (req.user.is_paired && req.user.partner_id) {
            const { data: partnerRows, error } = await supabase
                .from('users')
                .select('full_name, email, avatar')
                .eq('id', req.user.partner_id);
                
            if (error) throw error;
            
            if (partnerRows && partnerRows.length > 0) {
                coupleInfo.partner = partnerRows[0];
            }
        }
        
        res.json({ success: true, couple: coupleInfo });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createCode, pairWithCode, getCoupleInfo };