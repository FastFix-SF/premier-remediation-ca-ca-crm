import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface ConversionProgress {
  percent: number;
  stage: 'idle' | 'loading' | 'converting' | 'complete' | 'error';
  message: string;
}

type QualityPreset = 'high' | 'balanced' | 'small';

const qualitySettings: Record<QualityPreset, { crf: string; preset: string; audioBitrate: string }> = {
  high: { crf: '20', preset: 'slow', audioBitrate: '192k' },
  balanced: { crf: '25', preset: 'medium', audioBitrate: '128k' },
  small: { crf: '30', preset: 'fast', audioBitrate: '96k' },
};

export function useVideoConverter() {
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress>({
    percent: 0,
    stage: 'idle',
    message: '',
  });
  
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const loadedRef = useRef(false);

  const loadFFmpeg = useCallback(async (): Promise<FFmpeg> => {
    if (loadedRef.current && ffmpegRef.current) {
      return ffmpegRef.current;
    }

    const ffmpeg = new FFmpeg();
    ffmpegRef.current = ffmpeg;

    ffmpeg.on('progress', ({ progress: p }) => {
      const percent = Math.min(Math.round(p * 100), 99);
      setProgress({
        percent,
        stage: 'converting',
        message: `Converting: ${percent}%`,
      });
    });

    setProgress({
      percent: 0,
      stage: 'loading',
      message: 'Loading video converter...',
    });

    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      loadedRef.current = true;
      return ffmpeg;
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      throw new Error('Failed to load video converter');
    }
  }, []);

  const convertToMP4 = useCallback(async (
    videoUrl: string,
    fileName: string,
    quality: QualityPreset = 'balanced'
  ): Promise<Blob> => {
    setIsConverting(true);
    setProgress({ percent: 0, stage: 'loading', message: 'Preparing converter...' });

    try {
      const ffmpeg = await loadFFmpeg();
      setProgress({ percent: 10, stage: 'loading', message: 'Downloading video...' });

      const videoData = await fetchFile(videoUrl);
      const inputExt = fileName.toLowerCase().endsWith('.mp4') ? 'mp4' : 'webm';
      const inputFileName = `input.${inputExt}`;
      const outputFileName = 'output.mp4';

      await ffmpeg.writeFile(inputFileName, videoData);
      setProgress({ percent: 20, stage: 'converting', message: 'Starting conversion...' });

      const settings = qualitySettings[quality];

      await ffmpeg.exec([
        '-i', inputFileName,
        '-c:v', 'libx264',
        '-crf', settings.crf,
        '-preset', settings.preset,
        '-c:a', 'aac',
        '-b:a', settings.audioBitrate,
        '-movflags', '+faststart',
        '-pix_fmt', 'yuv420p',
        outputFileName,
      ]);

      setProgress({ percent: 95, stage: 'converting', message: 'Finalizing...' });

      const data = await ffmpeg.readFile(outputFileName);
      
      // Clean up temp files
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);

      setProgress({ percent: 100, stage: 'complete', message: 'Conversion complete!' });

      // Convert to Blob
      let mp4Blob: Blob;
      if (typeof data === 'string') {
        const encoder = new TextEncoder();
        mp4Blob = new Blob([encoder.encode(data)], { type: 'video/mp4' });
      } else {
        const buffer = new ArrayBuffer(data.length);
        new Uint8Array(buffer).set(data);
        mp4Blob = new Blob([buffer], { type: 'video/mp4' });
      }

      setIsConverting(false);
      return mp4Blob;
    } catch (error) {
      console.error('Conversion error:', error);
      setProgress({ percent: 0, stage: 'error', message: 'Conversion failed' });
      setIsConverting(false);
      throw error;
    }
  }, [loadFFmpeg]);

  const downloadAsMP4 = useCallback(async (
    videoUrl: string,
    fileName: string,
    quality: QualityPreset = 'balanced'
  ): Promise<void> => {
    const mp4Blob = await convertToMP4(videoUrl, fileName, quality);

    const url = URL.createObjectURL(mp4Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.replace(/\.(webm|mkv|avi|mov)$/i, '.mp4');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up object URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [convertToMP4]);

  const reset = useCallback(() => {
    setIsConverting(false);
    setProgress({ percent: 0, stage: 'idle', message: '' });
  }, []);

  return {
    convertToMP4,
    downloadAsMP4,
    isConverting,
    progress,
    reset,
  };
}
