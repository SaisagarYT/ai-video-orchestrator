import { supabase } from '../config/supabase.js';

export const updateScene = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { visualPrompt, narrativeText, cameraMovement, motionPrompt } = req.body;

    const updateData = {};
    if (visualPrompt !== undefined) updateData.visual_prompt = visualPrompt;
    if (narrativeText !== undefined) updateData.narrative_text = narrativeText;
    if (cameraMovement !== undefined) updateData.camera_movement = cameraMovement;
    if (motionPrompt !== undefined) updateData.motion_prompt = motionPrompt;

    const { data: updated, error } = await supabase
      .from('scenes')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return res.json({ success: true, data: Array.isArray(updated) ? updated[0] : updated });
  } catch (err) {
    next(err);
  }
};

export const rerollScene = async (req, res, next) => {
  try {
    const { id } = req.params;
    return res.json({
      success: true,
      message: 'Scene reroll queued',
      data: { id, status: 'QUEUED' },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  updateScene,
  rerollScene,
};
