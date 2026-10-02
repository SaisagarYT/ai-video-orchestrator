import { CROP_STRATEGIES } from './constants.js';

export class SafeZoneService {
  // Check if child rect is completely contained within container safe zone (0.0 to 1.0)
  static contains(container, child, tolerance = 0.001) {
    if (!container || !child) return false;
    const cRight = container.x + container.width;
    const cBottom = container.y + container.height;
    const chRight = child.x + child.width;
    const chBottom = child.y + child.height;

    return (
      child.x >= container.x - tolerance &&
      child.y >= container.y - tolerance &&
      chRight <= cRight + tolerance &&
      chBottom <= cBottom + tolerance
    );
  }

  // Check if two rects intersect
  static intersects(a, b) {
    if (!a || !b) return false;
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  // Clamp and position a rect into a target safe zone
  static clampToSafeZone(rect, safeZone) {
    const width = Math.min(rect.width, safeZone.width);
    const height = Math.min(rect.height, safeZone.height);

    let x = Math.max(safeZone.x, Math.min(rect.x, safeZone.x + safeZone.width - width));
    let y = Math.max(safeZone.y, Math.min(rect.y, safeZone.y + safeZone.height - height));

    return {
      x: Math.round(x * 1000) / 1000,
      y: Math.round(y * 1000) / 1000,
      width: Math.round(width * 1000) / 1000,
      height: Math.round(height * 1000) / 1000,
    };
  }

  // Compute normalized crop rectangle for aspect ratio transformation
  static calculateAspectCropBox({
    sourceAspectRatio,
    targetAspectRatio,
    focalPoint = { x: 0.5, y: 0.5 },
    strategy = CROP_STRATEGIES.CENTER_CROP,
  }) {
    // If aspect ratios match exactly, full frame is used
    if (sourceAspectRatio === targetAspectRatio) {
      return { x: 0.0, y: 0.0, width: 1.0, height: 1.0 };
    }

    const aspectToRatio = (ar) => {
      switch (ar) {
        case '9:16':
          return 9 / 16; // 0.5625
        case '16:9':
          return 16 / 9; // 1.7778
        case '1:1':
        default:
          return 1.0;
      }
    };

    const srcRatio = aspectToRatio(sourceAspectRatio);
    const tgtRatio = aspectToRatio(targetAspectRatio);

    let cropWidth = 1.0;
    let cropHeight = 1.0;

    if (tgtRatio > srcRatio) {
      // Target is wider than source (e.g. 9:16 -> 1:1 or 9:16 -> 16:9)
      // Height must be cropped
      cropWidth = 1.0;
      cropHeight = srcRatio / tgtRatio;
    } else {
      // Target is taller than source (e.g. 16:9 -> 9:16 or 16:9 -> 1:1)
      // Width must be cropped
      cropHeight = 1.0;
      cropWidth = tgtRatio / srcRatio;
    }

    // Determine center position based on strategy & focal point
    let centerX = 0.5;
    let centerY = 0.5;

    if (strategy === CROP_STRATEGIES.SUBJECT_AWARE_CROP && focalPoint) {
      centerX = Math.max(0.0, Math.min(1.0, focalPoint.x ?? 0.5));
      centerY = Math.max(0.0, Math.min(1.0, focalPoint.y ?? 0.5));
    }

    // Clamp top-left so crop box stays completely within [0, 1]
    let x = centerX - cropWidth / 2;
    let y = centerY - cropHeight / 2;

    x = Math.max(0.0, Math.min(x, 1.0 - cropWidth));
    y = Math.max(0.0, Math.min(y, 1.0 - cropHeight));

    return {
      x: Math.round(x * 1000) / 1000,
      y: Math.round(y * 1000) / 1000,
      width: Math.round(cropWidth * 1000) / 1000,
      height: Math.round(cropHeight * 1000) / 1000,
    };
  }
}
