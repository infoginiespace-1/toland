'use client';

import React, { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UploadCloud, X, Loader2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

interface ImageUploadPickerProps {
  bucket?: 'product-images' | 'banners' | 'uploads';
  folder?: string;
  value?: string; // storage path or public URL
  onChange: (path: string, publicUrl: string) => void;
  onRemove?: () => void;
  label?: string;
  helperText?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
}

export function ImageUploadPicker({
  bucket = 'product-images',
  folder = 'general',
  value,
  onChange,
  onRemove,
  label = 'Upload Image',
  helperText = 'PNG, JPG, WEBP up to 5MB. Uploads directly to Supabase Storage.',
  aspectRatio = 'square',
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

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit');
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
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      onChange(filePath, publicData.publicUrl);
    } catch (err: any) {
      console.error('[Storage Upload Error]:', err);
      setError(err?.message || 'Failed to upload image to Supabase Storage');
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
      ? 'aspect-3/4'
      : 'aspect-square';

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-text uppercase tracking-wider">
          {label}
        </label>
      )}

      {previewUrl ? (
        <div className="relative group rounded-xl overflow-hidden border border-[#CFE0D5] bg-white p-2">
          <div className={`relative w-full ${aspectClass} rounded-lg overflow-hidden bg-[#F0F7F2] flex items-center justify-center`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Uploaded file preview"
              className="w-full h-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#CFE0D5] text-xs">
            <span className="font-mono text-muted text-3xs truncate max-w-[200px]">{value}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-2.5 py-1 text-primary font-bold hover:bg-[#F0F7F2] rounded transition-colors"
              >
                Change
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  disabled={uploading}
                  className="px-2 py-1 text-danger font-bold hover:bg-danger/10 rounded transition-colors"
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
              ? 'border-primary bg-[#E3EFE7]'
              : 'border-[#CFE0D5] bg-white hover:border-primary hover:bg-[#F0F7F2]'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-xs font-bold text-primary">Uploading to Supabase Storage...</span>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-[#E3EFE7] text-primary flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-text">
                  <span className="text-primary hover:underline">Click to browse</span> or drag and drop
                </p>
                <p className="text-3xs text-muted">{helperText}</p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-danger font-semibold flex items-center gap-1 mt-1">
          <span>⚠️ {error}</span>
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

interface MultiImageUploadProps {
  bucket?: 'product-images' | 'banners' | 'uploads';
  folder?: string;
  images: Array<{ id?: string; path: string; sort?: number }>;
  onChange: (images: Array<{ id?: string; path: string; sort?: number }>) => void;
  maxImages?: number;
}

export function MultiImageUploadPicker({
  bucket = 'product-images',
  folder = 'products',
  images = [],
  onChange,
  maxImages = 5,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleMultipleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const newImages = [...images];

      for (let i = 0; i < files.length; i++) {
        if (newImages.length >= maxImages) break;
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${folder}/${Date.now()}-${sanitizedName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (!uploadError) {
          newImages.push({
            path: filePath,
            sort: newImages.length,
          });
        }
      }

      onChange(newImages);
    } catch (err) {
      console.error('[Multi-upload Error]:', err);
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
          Product Images ({images.length}/{maxImages})
        </label>
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs font-bold text-primary hover:text-accent flex items-center gap-1"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Add Image</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((img, idx) => {
          const { data } = supabase.storage.from(bucket).getPublicUrl(img.path);
          return (
            <div
              key={idx}
              className="relative group rounded-xl overflow-hidden border border-[#CFE0D5] aspect-square bg-[#F0F7F2]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.publicUrl}
                alt={`Product image ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-3xs font-mono font-bold">
                #{idx + 1}
              </div>
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-danger text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
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
            className="border-2 border-dashed border-[#CFE0D5] hover:border-primary rounded-xl aspect-square flex flex-col items-center justify-center gap-1 text-muted hover:text-primary hover:bg-[#F0F7F2] transition-colors p-2 text-center"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <>
                <ImageIcon className="w-6 h-6" />
                <span className="text-3xs font-bold uppercase">Upload Photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => handleMultipleUpload(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
