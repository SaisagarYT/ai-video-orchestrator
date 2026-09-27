import { supabase } from '../config/supabase.js';

export const getMe = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) throw error;

    return res.json({
      success: true,
      data: user || req.user,
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { displayName, avatarUrl } = req.body;
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const { data: updated, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id);

    if (error) throw error;

    return res.json({
      success: true,
      data: Array.isArray(updated) ? updated[0] : updated,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getMe,
  updateProfile,
};
