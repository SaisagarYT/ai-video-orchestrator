/**
 * Format milliseconds to standard SRT timecode: HH:MM:SS,mmm
 *
 * @param {number} ms
 * @returns {string}
 */
export function formatSrtTimestamp(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const milliseconds = Math.floor(ms % 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const mmm = String(milliseconds).padStart(3, '0');

  return `${hh}:${mm}:${ss},${mmm}`;
}

/**
 * Format milliseconds to standard WebVTT timecode: HH:MM:SS.mmm
 *
 * @param {number} ms
 * @returns {string}
 */
export function formatVttTimestamp(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const milliseconds = Math.floor(ms % 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const mmm = String(milliseconds).padStart(3, '0');

  return `${hh}:${mm}:${ss}.${mmm}`;
}

/**
 * Sanitize subtitle text to prevent shell injection, control character corruption, or HTML tampering.
 *
 * @param {string} text
 * @returns {string}
 */
export function sanitizeSubtitleText(text) {
  if (!text) return '';
  return text
    .replace(/[\r\n]+/g, ' ') // Collapse newlines to space within a single cue
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Strip control characters
    .replace(/[<>]/g, '') // Strip brackets to prevent markup injection
    .trim();
}

/**
 * Format a validated SubtitleDocument into standard SubRip (SRT) format.
 *
 * @param {import('./subtitle.types.js').SubtitleDocument} doc
 * @returns {string}
 */
export function formatToSRT(doc) {
  if (!doc || !Array.isArray(doc.cues) || doc.cues.length === 0) {
    return '';
  }

  const srtBlocks = doc.cues.map((cue, index) => {
    const sequenceNumber = index + 1;
    const startStr = formatSrtTimestamp(cue.startMs);
    const endStr = formatSrtTimestamp(cue.endMs);
    const text = sanitizeSubtitleText(cue.text);

    return `${sequenceNumber}\n${startStr} --> ${endStr}\n${text}`;
  });

  return `${srtBlocks.join('\n\n')}\n`;
}

/**
 * Format a validated SubtitleDocument into WebVTT format.
 *
 * @param {import('./subtitle.types.js').SubtitleDocument} doc
 * @returns {string}
 */
export function formatToWebVTT(doc) {
  if (!doc || !Array.isArray(doc.cues) || doc.cues.length === 0) {
    return 'WEBVTT\n\n';
  }

  const vttBlocks = doc.cues.map((cue, index) => {
    const sequenceNumber = index + 1;
    const startStr = formatVttTimestamp(cue.startMs);
    const endStr = formatVttTimestamp(cue.endMs);
    const text = sanitizeSubtitleText(cue.text);

    return `${sequenceNumber}\n${startStr} --> ${endStr}\n${text}`;
  });

  return `WEBVTT\n\n${vttBlocks.join('\n\n')}\n`;
}
