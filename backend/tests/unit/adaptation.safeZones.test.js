import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SafeZoneService } from '../../src/adaptation/safeZones.js';
import { CROP_STRATEGIES } from '../../src/adaptation/constants.js';

describe('SafeZoneService Unit Tests', () => {
  it('should correctly determine if child rect is contained within container safe zone', () => {
    const safeZone = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
    const insideRect = { x: 0.2, y: 0.2, width: 0.4, height: 0.4 };
    const outsideRect = { x: 0.05, y: 0.2, width: 0.4, height: 0.4 };
    const overflowRect = { x: 0.7, y: 0.7, width: 0.3, height: 0.3 };

    assert.equal(SafeZoneService.contains(safeZone, insideRect), true);
    assert.equal(SafeZoneService.contains(safeZone, outsideRect), false);
    assert.equal(SafeZoneService.contains(safeZone, overflowRect), false);
  });

  it('should detect bounding box intersections', () => {
    const rectA = { x: 0.2, y: 0.2, width: 0.4, height: 0.4 };
    const rectB = { x: 0.4, y: 0.4, width: 0.4, height: 0.4 };
    const rectC = { x: 0.7, y: 0.7, width: 0.2, height: 0.2 };

    assert.equal(SafeZoneService.intersects(rectA, rectB), true);
    assert.equal(SafeZoneService.intersects(rectA, rectC), false);
  });

  it('should clamp out-of-bounds rects into safe zone', () => {
    const safeZone = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
    const outRect = { x: 0.02, y: 0.05, width: 0.3, height: 0.2 };

    const clamped = SafeZoneService.clampToSafeZone(outRect, safeZone);
    assert.ok(clamped.x >= safeZone.x);
    assert.ok(clamped.y >= safeZone.y);
    assert.equal(SafeZoneService.contains(safeZone, clamped), true);
  });

  it('should calculate normalized aspect ratio crop box for 9:16 to 16:9', () => {
    const cropBox = SafeZoneService.calculateAspectCropBox({
      sourceAspectRatio: '9:16',
      targetAspectRatio: '16:9',
      focalPoint: { x: 0.5, y: 0.5 },
      strategy: CROP_STRATEGIES.CENTER_CROP,
    });

    assert.equal(cropBox.width, 1.0);
    // Height must be cropped: 0.5625 / 1.7778 ≈ 0.316
    assert.ok(cropBox.height < 0.4);
    assert.ok(cropBox.y > 0.3);
  });

  it('should calculate normalized aspect ratio crop box for 16:9 to 9:16', () => {
    const cropBox = SafeZoneService.calculateAspectCropBox({
      sourceAspectRatio: '16:9',
      targetAspectRatio: '9:16',
      focalPoint: { x: 0.5, y: 0.5 },
      strategy: CROP_STRATEGIES.CENTER_CROP,
    });

    assert.equal(cropBox.height, 1.0);
    // Width must be cropped: 0.5625 / 1.7778 ≈ 0.316
    assert.ok(cropBox.width < 0.4);
    assert.ok(cropBox.x > 0.3);
  });

  it('should shift crop box toward focal point with SUBJECT_AWARE_CROP', () => {
    // Subject is on the right side of the landscape frame (x: 0.8)
    const rightSubjectCrop = SafeZoneService.calculateAspectCropBox({
      sourceAspectRatio: '16:9',
      targetAspectRatio: '9:16',
      focalPoint: { x: 0.8, y: 0.5 },
      strategy: CROP_STRATEGIES.SUBJECT_AWARE_CROP,
    });

    // Subject is on the left side of the landscape frame (x: 0.2)
    const leftSubjectCrop = SafeZoneService.calculateAspectCropBox({
      sourceAspectRatio: '16:9',
      targetAspectRatio: '9:16',
      focalPoint: { x: 0.2, y: 0.5 },
      strategy: CROP_STRATEGIES.SUBJECT_AWARE_CROP,
    });

    assert.ok(rightSubjectCrop.x > leftSubjectCrop.x);
  });
});
