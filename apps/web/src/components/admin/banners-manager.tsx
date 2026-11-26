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
} from 'lucide-react';
import Link from 'next/link';

interface BannerItem {
  id: string;
  title: string;
  image_path: string;
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
  const [imagePath, setImagePath] = useState('');
  const [link, setLink] = useState('/products');
  const [sort, setSort] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const openCreateModal = () => {
    setEditingBanner(null);
    setTitle('');
    setImagePath('');
    setLink('/products');
    setSort(banners.length);
    setIsActive(true);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (b: BannerItem) => {
    setEditingBanner(b);
    setTitle(b.title);
    setImagePath(b.image_path);
    setLink(b.link || '/products');
    setSort(b.sort);
    setIsActive(b.is_active);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imagePath.trim()) {
      setError('Title and banner image are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        id: editingBanner?.id,
        title,
        image_path: imagePath,
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

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const { data } = supabase.storage.from('banners').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CFE0D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <ImageIcon className="w-4 h-4" />
            <span>Storefront Visuals</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight mt-1">
            Hero & Promo Banners ({banners.length})
          </h1>
          <p className="text-xs text-muted">
            Manage promotional sliders and landing banners across mobile and desktop.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary-hover shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Banner</span>
        </button>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((b) => {
          const imgUrl = getImageUrl(b.image_path);

          return (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-[#CFE0D5] overflow-hidden shadow-xs flex flex-col justify-between group"
            >
              <div className="relative aspect-video bg-[#F0F7F2] border-b border-[#CFE0D5] overflow-hidden">
                {imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgUrl}
                    alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-black/60 text-white font-mono font-bold text-3xs">
                    Sort: #{b.sort}
                  </span>
                  {b.is_active ? (
                    <span className="px-2 py-0.5 rounded bg-success text-white font-bold text-3xs">
                      Live
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-muted text-white font-bold text-3xs">
                      Disabled
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-text text-sm truncate">{b.title}</h3>
                  <p className="text-3xs font-mono text-muted truncate mt-0.5">
                    Target: {b.link || '/products'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(b)}
                    className="p-2 rounded-lg text-primary hover:bg-[#E3EFE7] transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(b)}
                    disabled={deletingId === b.id}
                    className="p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
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
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#CFE0D5] space-y-5 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFE0D5]">
              <h2 className="text-base font-black text-text">
                {editingBanner ? `Edit: ${editingBanner.title}` : 'Upload New Hero Banner'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={loading}
                className="text-muted hover:text-text p-1"
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
                  Banner Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Heavy Denim Factory Launch — Flat 200 Off"
                  className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-text focus:outline-none focus:border-primary font-medium"
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
                  className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono text-text focus:outline-none focus:border-primary"
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
                    className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono text-text focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-text">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-primary rounded accent-primary"
                    />
                    <span>Active on Storefront</span>
                  </label>
                </div>
              </div>

              {/* Supabase Storage Image Upload (Rule #6 compliant!) */}
              <div className="pt-2">
                <ImageUploadPicker
                  bucket="banners"
                  folder="hero"
                  value={imagePath}
                  onChange={(path) => setImagePath(path)}
                  onRemove={() => setImagePath('')}
                  label="Banner Graphic File (Supabase Storage)"
                  helperText="Recommended size 1920x1080 (16:9 ratio) for optimal desktop & mobile display"
                  aspectRatio="video"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#CFE0D5]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl border border-[#CFE0D5] font-bold text-muted hover:text-text hover:bg-[#F0F7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white font-black uppercase tracking-wider hover:bg-primary-hover shadow-sm disabled:opacity-50"
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
