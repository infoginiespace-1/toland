'use client';

import React, { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UploadCloud, X, Loader2, Image as ImageIcon, Video, CheckCircle2 } from 'lucide-react';

interface ImageUploadPickerProps {
  bucket?: 'product-images' | 'banners' | 'uploads';
  folder?: string;
  value?: string; // storage path or public URL
  onChange: (path: string, publicUrl: string, mediaType?: 'image' | 'video' | 'gif') => void;
  onRemove?: () => void;
  label?: string;
  helperText?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
  acceptMedia?: 'image' | 'video' | 'all';
}

export function ImageUploadPicker({
  bucket = 'product-images',
  folder = 'general',
  value,
  onChange,
  onRemove,
  label = 'Upload Media (Image, GIF or Video)',
  helperText = 'PNG, JPG, WEBP, GIF, or MP4/WebM video up to 50MB. Uploads directly to Supabase Storage.',
  aspectRatio = 'square',
  acceptMedia = 'all',
}: ImageUploadPickerProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const getFullUrl = (val: string) => {
    if (!val) return '';
    if (val.startsWith('http://') || val.startsWith('https://')) return val;
    const { data } = supabase.storage.from(bucket).getPublicUrl(val);
    return data.publicUrl;
  };

  const previewUrl = value ? getFullUrl(value) : null;

  const isVideoUrl = (url: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      lower.endsWith('.mp4') ||
      lower.endsWith('.webm') ||
      lower.endsWith('.mov') ||
      lower.includes('/video/')
    );
  };

  const isVideo = previewUrl ? isVideoUrl(previewUrl) : false;

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const isFileVideo = file.type.startsWith('video/');
    const isFileImage = file.type.startsWith('image/');
    const isFileGif = file.type === 'image/gif';

    if (!isFileVideo && !isFileImage) {
      setError('Please select a valid image (PNG, JPG, WEBP, GIF) or video (MP4, WebM) file');
      return;
    }

    if (acceptMedia === 'image' && !isFileImage) {
      setError('Only image files are allowed for this field');
      return;
    }

    if (acceptMedia === 'video' && !isFileVideo) {
      setError('Only video files are allowed for this field');
      return;
    }

    // 50MB Limit
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50MB limit');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${folder}/${Date.now()}-${sanitizedName}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);

      let detectedType: 'image' | 'video' | 'gif' = 'image';
      if (isFileVideo) detectedType = 'video';
      else if (isFileGif) detectedType = 'gif';

      onChange(filePath, publicData.publicUrl, detectedType);
    } catch (err: any) {
      console.error('[Storage Upload Error]:', err);
      setError(err?.message || 'Failed to upload media to Supabase Storage');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const aspectClass =
    aspectRatio === 'video'
      ? 'aspect-video'
      : aspectRatio === 'portrait'
      ? 'aspect-[3/4]'
      : 'aspect-square';

  const acceptedTypes =
    acceptMedia === 'image'
      ? 'image/*'
      : acceptMedia === 'video'
      ? 'video/mp4,video/webm,video/quicktime'
      : 'image/*,video/mp4,video/webm,video/quicktime';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-text uppercase tracking-wider">{label}</label>
        {previewUrl && (
          <span className="text-[10px] font-bold text-success flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Uploaded</span>
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileChange}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative rounded-xl border border-border p-2 bg-surface-alt">
          <div className={`relative ${aspectClass} rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center`}>
            {isVideo ? (
              <video
                src={previewUrl}
                autoPlay
                loop
                muted
                playsInline
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Uploaded media preview"
                className="w-full h-full object-cover"
              />
            )}

            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white gap-2 z-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                <span className="text-xs font-semibold">Uploading Media...</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border text-xs">
            <div className="flex items-center gap-1.5 truncate max-w-[200px]">
              {isVideo ? (
                <Video className="w-3.5 h-3.5 text-primary shrink-0" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5 text-primary shrink-0" />
              )}
              <span className="font-mono text-muted text-3xs truncate">{value}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-2.5 py-1 text-primary font-bold hover:bg-primary/10 rounded transition-colors text-xs cursor-pointer"
              >
                Change
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  disabled={uploading}
                  className="px-2 py-1 text-danger font-bold hover:bg-danger/10 rounded transition-colors text-xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all flex flex-col items-center justify-center gap-2 ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border bg-white hover:border-primary hover:bg-surface-alt'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-4 text-primary">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-semibold">Uploading to Supabase Storage...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-text">Click to upload or drag & drop</span>
                <p className="text-[11px] text-muted mt-0.5">{helperText}</p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs font-bold text-danger animate-in fade-in duration-200">
          {error}
        </p>
      )}
    </div>
  );
}

interface MultiImageUploadProps {
  bucket?: 'product-images' | 'banners' | 'uploads';
  folder?: string;
  images: Array<{ id?: string; path: string; sort?: number; media_type?: string }>;
  onChange: (images: Array<{ id?: string; path: string; sort?: number; media_type?: string }>) => void;
  maxImages?: number;
}

export function MultiImageUploadPicker({
  bucket = 'product-images',
  folder = 'products',
  images = [],
  onChange,
  maxImages = 8,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const getMediaUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const isVideo = (path: string) => {
    const lower = (path || '').toLowerCase();
    return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.includes('/video/');
  };

  const handleMultipleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setError(null);
      const newImages = [...images];

      for (let i = 0; i < files.length; i++) {
        if (newImages.length >= maxImages) break;
        const file = files[i];

        const isFileVideo = file.type.startsWith('video/');
        const isFileImage = file.type.startsWith('image/');
        const isFileGif = file.type === 'image/gif';

        if (!isFileVideo && !isFileImage) continue;

        if (file.size > 50 * 1024 * 1024) {
          setError(`File ${file.name} exceeds 50MB limit`);
          continue;
        }

        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${folder}/${Date.now()}-${sanitizedName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, { cacheControl: '3600', upsert: true, contentType: file.type });

        if (!uploadError) {
          let detectedType = 'image';
          if (isFileVideo) detectedType = 'video';
          else if (isFileGif) detectedType = 'gif';

          newImages.push({
            path: filePath,
            sort: newImages.length,
            media_type: detectedType,
          });
        }
      }

      onChange(newImages);
    } catch (err: any) {
      console.error('[Multi-upload Error]:', err);
      setError(err?.message || 'Error uploading files');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-text uppercase tracking-wider">
          Product Media — Images, GIFs & Videos ({images.length}/{maxImages})
        </label>
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs font-bold text-primary hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Add Media (Video / GIF / Image)</span>
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-danger font-semibold">{error}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((img, idx) => {
          const mediaUrl = getMediaUrl(img.path);
          const videoItem = isVideo(img.path) || img.media_type === 'video';

          return (
            <div
              key={idx}
              className="relative group rounded-xl overflow-hidden border border-border aspect-square bg-slate-900"
            >
              {videoItem ? (
                <video
                  src={mediaUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl}
                  alt={`Product media ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Badges */}
              <div className="absolute top-1 left-1 flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded bg-black/70 text-white text-3xs font-mono font-bold">
                  #{idx + 1}
                </span>
                {videoItem && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-3xs font-bold uppercase flex items-center gap-0.5">
                    <Video className="w-2.5 h-2.5" />
                    <span>Video</span>
                  </span>
                )}
                {img.path.toLowerCase().endsWith('.gif') && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white text-3xs font-bold uppercase">
                    GIF
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-danger text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                title="Remove media"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="border-2 border-dashed border-border hover:border-primary rounded-xl aspect-square flex flex-col items-center justify-center gap-1 text-muted hover:text-primary hover:bg-surface-alt transition-colors p-2 text-center cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <>
                <UploadCloud className="w-6 h-6 text-primary" />
                <span className="text-3xs font-bold uppercase">Upload Media</span>
                <span className="text-[9px] text-muted">Image, GIF, Video</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/mp4,video/webm,video/quicktime"
        onChange={(e) => handleMultipleUpload(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
