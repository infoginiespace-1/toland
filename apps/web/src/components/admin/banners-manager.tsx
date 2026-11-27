'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageUploadPicker } from '@/components/admin/image-upload-picker';
import { createClient } from '@/lib/supabase/client';
import {
  Image as ImageIcon,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  ExternalLink,
  Video,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export interface BannerItem {
  id: string;
  title: string;
  subtitle?: string | null;
  image_path: string;
  media_type?: 'image' | 'video' | 'gif' | string;
  link?: string | null;
  sort: number;
  is_active: boolean;
}

interface BannersManagerProps {
  banners: BannerItem[];
}

export function BannersManager({ banners }: BannersManagerProps) {
  const router = useRouter();
  const supabase = createClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'gif'>('image');
  const [link, setLink] = useState('/products');
  const [sort, setSort] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const openCreateModal = () => {
    setEditingBanner(null);
    setTitle('');
    setSubtitle('');
    setImagePath('');
    setMediaType('image');
    setLink('/products');
    setSort(banners.length);
    setIsActive(true);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (b: BannerItem) => {
    setEditingBanner(b);
    setTitle(b.title);
    setSubtitle(b.subtitle || '');
    setImagePath(b.image_path);
    setMediaType((b.media_type as any) || (b.image_path.toLowerCase().endsWith('.mp4') ? 'video' : 'image'));
    setLink(b.link || '/products');
    setSort(b.sort);
    setIsActive(b.is_active);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imagePath.trim()) {
      setError('Title and banner media file are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        id: editingBanner?.id,
        title,
        subtitle: subtitle.trim() || null,
        image_path: imagePath,
        media_type: mediaType,
        link: link || '/products',
        sort: Number(sort),
        is_active: isActive,
      };

      const res = await fetch('/api/admin/banners', {
        method: editingBanner ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save banner');
      }

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (b: BannerItem) => {
    if (!confirm(`Delete banner "${b.title}"?`)) return;

    try {
      setDeletingId(b.id);
      const res = await fetch(`/api/admin/banners?id=${b.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      router.refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const getMediaUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const { data } = supabase.storage.from('banners').getPublicUrl(path);
    return data.publicUrl;
  };

  const isVideo = (path: string, type?: string) => {
    if (type === 'video') return true;
    const lower = (path || '').toLowerCase();
    return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.includes('/video/');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-black text-text">Hero Slider & Banner Studio</h1>
          </div>
          <p className="text-xs text-muted mt-1">
            Manage high-impact sliding media banners (Images, GIFs & Videos) displayed on the storefront landing page.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-hover shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Media Banner</span>
        </button>
      </div>

      {/* Grid of Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((b) => {
          const mediaUrl = getMediaUrl(b.image_path);
          const videoItem = isVideo(b.image_path, b.media_type);

          return (
            <div
              key={b.id}
              className={`rounded-2xl border bg-white shadow-card overflow-hidden flex flex-col justify-between transition-all ${
                b.is_active ? 'border-border hover:shadow-card-hover' : 'border-slate-200 opacity-60'
              }`}
            >
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
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
                    alt={b.title}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Media Type Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    {videoItem ? (
                      <>
                        <Video className="w-3 h-3 text-emerald-400" />
                        <span>Video Loop</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3 h-3 text-emerald-400" />
                        <span>{b.media_type === 'gif' ? 'GIF Animation' : 'Image'}</span>
                      </>
                    )}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white font-mono text-[10px] font-bold">
                    Order #{b.sort}
                  </span>
                </div>

                {/* Active Indicator */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      b.is_active
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {b.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-text text-sm truncate">{b.title}</h3>
                  {b.subtitle && (
                    <p className="text-xs text-muted truncate mt-0.5">{b.subtitle}</p>
                  )}
                  <p className="text-[10px] font-mono text-muted truncate mt-1">
                    Link: {b.link || '/products'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(b)}
                    className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                    title="Edit Banner"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(b)}
                    disabled={deletingId === b.id}
                    className="p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors disabled:opacity-50 cursor-pointer"
                    title="Delete Banner"
                  >
                    {deletingId === b.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => !loading && setModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border space-y-5 z-10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-black text-text">
                {editingBanner ? `Edit Banner: ${editingBanner.title}` : 'Upload New Hero Media Banner'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={loading}
                className="text-muted hover:text-text p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                  Banner Campaign Headline *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Heavyweight Raw Selvedge Denim Launch"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface-alt text-text focus:outline-none focus:border-primary font-medium text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                  Subtitle / Teaser Line (Optional)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. 13.5oz ring-spun combed cotton woven for lifetime durability"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface-alt text-text focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                  Destination Link
                </label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="/products?category=slim-fit-denim"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface-alt font-mono text-text focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={sort}
                    onChange={(e) => setSort(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface-alt font-mono text-text focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-text">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-primary rounded accent-primary cursor-pointer"
                    />
                    <span>Active on Storefront</span>
                  </label>
                </div>
              </div>

              {/* Media Upload with Image, GIF & Video Support */}
              <div className="pt-2">
                <ImageUploadPicker
                  bucket="banners"
                  folder="hero"
                  value={imagePath}
                  onChange={(path, _url, detectedType) => {
                    setImagePath(path);
                    if (detectedType) setMediaType(detectedType);
                  }}
                  onRemove={() => setImagePath('')}
                  label="Hero Banner Media File (Images, GIFs, MP4/WebM Videos)"
                  helperText="Supports high-res JPG/PNG/WEBP, animated GIFs, or autoplay MP4/WebM videos up to 50MB."
                  aspectRatio="video"
                  acceptMedia="all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl border border-border font-bold text-muted hover:text-text hover:bg-surface-alt cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold uppercase tracking-wider hover:bg-primary-hover shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Banner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
