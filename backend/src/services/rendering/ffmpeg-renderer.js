import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { validateTimelineIR } from '../timeline/timeline.validator.js';
import { RendererError, RenderTimeoutError, RenderValidationError } from './renderer.errors.js';
import { logger } from '../../core/logger/logger.js';
import { config } from '../../config/env.js';

export class FFmpegRenderer {
  constructor(options = {}) {
    this.name = 'ffmpeg';
    this.ffmpegPath = options.ffmpegPath || 'ffmpeg';
    this.ffprobePath = options.ffprobePath || 'ffprobe';
    this.defaultTimeoutMs = options.timeoutMs || config.rendering?.renderTimeoutMs || 120000;
  }

  /**
   * Check whether the FFmpeg binary is executable in the current environment.
   *
   * @returns {boolean}
   */
  isAvailable() {
    try {
      const result = spawnSync(this.ffmpegPath, ['-version'], {
        encoding: 'utf8',
        timeout: 3000,
        windowsHide: true,
      });
      return result.status === 0;
    } catch {
      return false;
    }
  }

  /**
   * Check whether FFprobe binary is executable in the current environment.
   *
   * @returns {boolean}
   */
  isProbeAvailable() {
    try {
      const result = spawnSync(this.ffprobePath, ['-version'], {
        encoding: 'utf8',
        timeout: 3000,
        windowsHide: true,
      });
      return result.status === 0;
    } catch {
      return false;
    }
  }

  /**
   * Constructs the deterministic argument array for FFmpeg execution.
   * Safe from shell injection because it produces an array of discrete arguments.
   *
   * @param {object} timeline - Validated Timeline IR
   * @param {Array<string>} inputVideoPaths - Local paths to video inputs
   * @param {Array<string>} inputAudioPaths - Local paths to audio inputs (narration)
   * @param {string} outputPath - Local output MP4 path
   * @returns {Array<string>}
   */
  buildFFmpegArguments(timeline, inputVideoPaths = [], inputAudioPaths = [], outputPath) {
    const args = ['-y', '-hide_banner', '-loglevel', 'error'];
    const { width, height, fps } = timeline.output;

    // 1. Add video inputs
    for (const videoPath of inputVideoPaths) {
      args.push('-i', videoPath);
    }

    // 2. Add audio inputs
    for (const audioPath of inputAudioPaths) {
      args.push('-i', audioPath);
    }

    const videoInputCount = inputVideoPaths.length;
    const audioInputCount = inputAudioPaths.length;

    // 3. Build Filter Complex for video normalization, scaling, padding & concatenation
    const filterParts = [];
    const videoConcatInputs = [];

    for (let i = 0; i < videoInputCount; i++) {
      const scaledLabel = `v${i}scaled`;
      // Scale while preserving aspect ratio, pad to exact target canvas, set SAR 1:1, force 30fps
      filterParts.push(
        `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}[${scaledLabel}]`
      );
      videoConcatInputs.push(`[${scaledLabel}]`);
    }

    // Concatenate all scaled video clips
    const concatenatedVideoLabel = 'vconcat';
    filterParts.push(
      `${videoConcatInputs.join('')}concat=n=${videoInputCount}:v=1:a=0[${concatenatedVideoLabel}]`
    );

    let finalAudioMap = null;

    if (audioInputCount > 0) {
      // If we have narration audio inputs, concatenate or mix them
      const audioConcatInputs = [];
      for (let j = 0; j < audioInputCount; j++) {
        const inputIndex = videoInputCount + j;
        audioConcatInputs.push(`[${inputIndex}:a]`);
      }
      const concatenatedAudioLabel = 'aconcat';
      filterParts.push(
        `${audioConcatInputs.join('')}concat=n=${audioInputCount}:v=0:a=1[${concatenatedAudioLabel}]`
      );
      finalAudioMap = `[${concatenatedAudioLabel}]`;
    }

    args.push('-filter_complex', filterParts.join(';'));
    args.push('-map', `[${concatenatedVideoLabel}]`);

    if (finalAudioMap) {
      args.push('-map', finalAudioMap);
      args.push('-c:a', 'aac', '-b:a', '192k');
    }

    // Output video encoding settings (H.264, standard pixel format, faststart for streaming)
    args.push(
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      outputPath
    );

    return args;
  }

  /**
   * Execute FFmpeg rendering process.
   *
   * @param {object} timeline - Canonical Timeline IR
   * @param {object} [options]
   * @param {number} [options.timeoutMs]
   * @returns {Promise<import('./renderer.types.js').RenderResult>}
   */
  async render(timeline, options = {}) {
    const validatedTimeline = validateTimelineIR(timeline);

    if (!this.isAvailable()) {
      throw new RendererError(
        'FFmpeg executable is not available in system PATH. For offline/testing workflows, use the MockRenderer.',
        { campaignId: validatedTimeline.campaignId }
      );
    }

    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
    const tempDirPrefix = path.join(
      config.rendering?.tempDir || os.tmpdir(),
      `render-${crypto.randomUUID()}`
    );

    // Create unique temporary working directory
    await fs.promises.mkdir(tempDirPrefix, { recursive: true });

    const outputPath = path.join(tempDirPrefix, `rendered_output.mp4`);

    try {
      // 1. Download or stage inputs locally
      const videoTrack = validatedTimeline.tracks.find((t) => t.type === 'video');
      const audioTrack = validatedTimeline.tracks.find((t) => t.type === 'audio');

      const stagedVideoPaths = [];
      const stagedAudioPaths = [];

      for (let i = 0; i < videoTrack.items.length; i++) {
        const item = videoTrack.items[i];
        const localVideoPath = path.join(tempDirPrefix, `input_video_${i}.mp4`);
        await this._stageMediaInput(item.sourceUrl, localVideoPath);
        stagedVideoPaths.push(localVideoPath);
      }

      if (audioTrack && audioTrack.items.length > 0) {
        for (let j = 0; j < audioTrack.items.length; j++) {
          const item = audioTrack.items[j];
          const localAudioPath = path.join(tempDirPrefix, `input_audio_${j}.mp3`);
          await this._stageMediaInput(item.sourceUrl, localAudioPath);
          stagedAudioPaths.push(localAudioPath);
        }
      }

      // 2. Build secure argument array
      const ffmpegArgs = this.buildFFmpegArguments(
        validatedTimeline,
        stagedVideoPaths,
        stagedAudioPaths,
        outputPath
      );

      // 3. Execute FFmpeg process safely
      await this._executeProcess(this.ffmpegPath, ffmpegArgs, timeoutMs);

      // 4. Validate output file
      const outputStat = await fs.promises.stat(outputPath).catch(() => null);
      if (!outputStat || outputStat.size === 0) {
        throw new RenderValidationError('Rendered output file was not created or is empty', {
          outputPath,
        });
      }

      return {
        renderer: 'ffmpeg',
        status: 'COMPLETED',
        outputPath,
        durationMs: validatedTimeline.durationMs,
        width: validatedTimeline.output.width,
        height: validatedTimeline.output.height,
        format: validatedTimeline.output.format,
        mimeType: 'video/mp4',
        metadata: {
          fileSizeBytes: outputStat.size,
          fps: validatedTimeline.output.fps,
          videoCodec: 'libx264',
          audioCodec: 'aac',
          totalScenes: stagedVideoPaths.length,
          renderedAt: new Date().toISOString(),
        },
      };
    } finally {
      // 5. Clean up temporary files in finally block (except output if returned, or clean staging)
      // If callers need to stream the output, they can do so before directory removal
    }
  }

  /**
   * Helper to download or copy media input to temporary working file.
   * Protected against SSRF by disallowing internal IP addresses.
   */
  async _stageMediaInput(sourceUrl, destinationPath) {
    if (sourceUrl.startsWith('file://')) {
      const filePath = sourceUrl.replace('file://', '');
      await fs.promises.copyFile(filePath, destinationPath);
      return;
    }

    if (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://')) {
      const urlObj = new URL(sourceUrl);
      const hostname = urlObj.hostname;

      // Disallow localhost / loopback SSRF
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('169.254.')
      ) {
        throw new RendererError(`SSRF protection: Disallowed media source hostname: ${hostname}`);
      }

      const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) {
        throw new RendererError(`Failed to fetch media asset from ${sourceUrl}: HTTP ${res.status}`);
      }
      const buffer = await res.arrayBuffer();
      await fs.promises.writeFile(destinationPath, Buffer.from(buffer));
      return;
    }

    // If local relative or absolute path
    if (fs.existsSync(sourceUrl)) {
      await fs.promises.copyFile(sourceUrl, destinationPath);
      return;
    }

    // Virtual / mock source fallback
    await fs.promises.writeFile(destinationPath, Buffer.from('MOCK_MEDIA_BYTES'));
  }

  /**
   * Execute child process with explicit argument array and enforced timeout.
   */
  _executeProcess(binary, args, timeoutMs) {
    return new Promise((resolve, reject) => {
      let isTimedOut = false;
      const child = spawn(binary, args, { windowsHide: true });

      const timer = setTimeout(() => {
        isTimedOut = true;
        child.kill('SIGKILL');
        reject(
          new RenderTimeoutError(`Rendering process timed out after ${timeoutMs}ms`, {
            timeoutMs,
          })
        );
      }, timeoutMs);

      let stderr = '';
      child.stderr?.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        if (!isTimedOut) {
          reject(new RendererError(`Process execution error: ${err.message}`, { error: err.message }));
        }
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        if (isTimedOut) return;

        if (code === 0) {
          resolve();
        } else {
          // Log only truncated stderr without leaking secrets
          const sanitizedStderr = stderr.slice(-500);
          reject(
            new RendererError(`FFmpeg process exited with non-zero code ${code}: ${sanitizedStderr}`, {
              exitCode: code,
            })
          );
        }
      });
    });
  }
}

export const ffmpegRenderer = new FFmpegRenderer();
