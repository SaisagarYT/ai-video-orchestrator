export const assemblePositivePrompt = ({
  visualPrompt,
  shotType,
  cameraMovement,
  visualStyle,
  lightingDirectives,
  colorPalette,
  brandConstraints = null,
}) => {
  return [
    visualPrompt?.replace(/\.+$/, ''),
    `Camera Direction: ${shotType} with ${cameraMovement}`,
    `Visual Style: ${visualStyle}`,
    `Lighting & Atmosphere: ${lightingDirectives}`,
    `Color Grading: ${colorPalette}`,
    brandConstraints ? `Brand Invariants: ${brandConstraints}` : null,
    'Master commercial broadcast standard, photorealistic 8k render, crystal-clear focus.',
  ]
    .filter(Boolean)
    .join('. ');
};

export const DEFAULT_NEGATIVE_PROMPT =
  'blurry, low quality, distorted textures, oversaturated plastic cartoon, deformed anatomy, text watermarks, flickering, low resolution artifacts, jump cuts, artificial CGI look';

export default {
  assemblePositivePrompt,
  DEFAULT_NEGATIVE_PROMPT,
};
