import { supabase } from '../config/supabase.js';
import { NotFoundError } from '../core/errors/AppError.js';

export const listFinalVideos = async (req, res, next) => {
  try {
    const { data: videos, error } = await supabase
      .from('final_videos')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ success: true, data: videos || [] });
  } catch (err) {
    next(err);
  }
};

export const getVideoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: video, error } = await supabase
      .from('final_videos')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!video) {
      return next(new NotFoundError('Final video not found'));
    }

    return res.json({ success: true, data: video });
  } catch (err) {
    next(err);
  }
};

export const recordVideoView = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: video, error } = await supabase
      .from('final_videos')
      .select('id, view_count')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    const newCount = ((video && video.view_count) || 0) + 1;

    await supabase
      .from('final_videos')
      .update({ view_count: newCount })
      .eq('id', id);

    return res.json({ success: true, data: { id, viewCount: newCount } });
  } catch (err) {
    next(err);
  }
};

export default {
  listFinalVideos,
  getVideoById,
  recordVideoView,
};
