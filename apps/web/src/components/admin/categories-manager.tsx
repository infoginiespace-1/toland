'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageUploadPicker } from '@/components/admin/image-upload-picker';
import { createClient } from '@/lib/supabase/client';
import {
  Layers,
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

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  image_path?: string | null;
  sort: number;
  is_active: boolean;
}

interface CategoriesManagerProps {
  categories: CategoryItem[];
}

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const router = useRouter();
  const supabase = createClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [sort, setSort] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setImagePath('');
    setSort(categories.length);
    setIsActive(true);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setImagePath(cat.image_path || '');
    setSort(cat.sort);
    setIsActive(cat.is_active);
    setError(null);
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setError('Name and slug are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        id: editingCategory?.id,
        name,
        slug,
        image_path: imagePath || null,
        sort: Number(sort),
        is_active: isActive,
      };

      const res = await fetch('/api/admin/categories', {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save category');
      }

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    if (!confirm(`Delete category "${cat.name}"? Products under this category will become uncategorized.`)) {
      return;
    }

    try {
      setDeletingId(cat.id);
      const res = await fetch(`/api/admin/categories?id=${cat.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete');
      }
      router.refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const getImageUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CFE0D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Taxonomy & Fits</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text tracking-tight mt-1">
            Denim Categories ({categories.length})
          </h1>
          <p className="text-xs text-muted">
            Configure catalog departments, visual category cards, and navigation links.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary-hover shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Grid Table */}
      <div className="bg-white rounded-2xl border border-[#CFE0D5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#CFE0D5] bg-[#F0F7F2] text-primary font-bold text-3xs uppercase tracking-wider">
                <th className="py-3 px-4">Sort</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Slug / Path</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CFE0D5]">
              {categories.map((cat) => {
                const imgUrl = getImageUrl(cat.image_path);

                return (
                  <tr key={cat.id} className="hover:bg-[#F0F7F2]/40 transition-colors">
                    {/* Sort Order */}
                    <td className="py-3 px-4 font-mono font-bold text-muted text-xs">
                      #{cat.sort}
                    </td>

                    {/* Category Thumbnail & Title */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5] overflow-hidden shrink-0 flex items-center justify-center">
                          {imgUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imgUrl} alt={cat.name} className="w-full h-full object-cover" />
                          ) : (
                            <Layers className="w-4 h-4 text-primary/40" />
                          )}
                        </div>
                        <span className="font-bold text-text">{cat.name}</span>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="py-3 px-3">
                      <span className="font-mono text-3xs text-muted bg-[#F0F7F2] px-2 py-0.5 rounded border border-[#CFE0D5]">
                        /products?category={cat.slug}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {cat.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-success/15 text-success border border-success/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-muted/15 text-muted border border-border">
                          Hidden
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/products?category=${cat.slug}`}
                          target="_blank"
                          title="View on Storefront"
                          className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-[#F0F7F2] transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          title="Edit Category"
                          className="p-1.5 rounded-lg text-primary hover:bg-[#E3EFE7] transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          disabled={deletingId === cat.id}
                          title="Delete Category"
                          className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                        >
                          {deletingId === cat.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
                {editingCategory ? `Edit: ${editingCategory.name}` : 'Create New Category'}
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
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Relaxed Carpenter Jeans"
                  className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-text focus:outline-none focus:border-primary font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="relaxed-carpenter-jeans"
                  className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 font-mono text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                    Sort Sequence
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
                    <span>Active in Storefront</span>
                  </label>
                </div>
              </div>

              {/* Supabase Storage Image Upload (Rule #6 compliant!) */}
              <div className="pt-2">
                <ImageUploadPicker
                  bucket="product-images"
                  folder="categories"
                  value={imagePath}
                  onChange={(path) => setImagePath(path)}
                  onRemove={() => setImagePath('')}
                  label="Category Cover Photo (Supabase Storage)"
                  helperText="Upload high-res representative photo for category grid"
                  aspectRatio="square"
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
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
