import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, Check, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import { api } from '../../lib/axios';
import AppLayout from '../../components/layout/AppLayout';

interface Category {
  _id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  isGlobal: boolean;
  isActive: boolean;
}

interface ApiError {
  error: { message: string };
}

interface FormState {
  name: string;
  color: string;
  icon: string;
  isGlobal: boolean;
}

const BLANK: FormState = { name: '', color: '#1A56A0', icon: 'Bell', isGlobal: true };

const PRESET_COLORS = [
  '#1A56A0',
  '#27AE60',
  '#E67E22',
  '#E74C3C',
  '#8B5CF6',
  '#06B6D4',
  '#DB2777',
  '#D97706',
  '#059669',
  '#7C3AED',
  '#DC2626',
  '#0891B2',
];

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Category[] }>('/categories');
      return res.data.data;
    },
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ['admin-categories'] });

  const createMutation = useMutation({
    mutationFn: (data: FormState) => api.post('/categories', data),
    onSuccess: () => {
      invalidate();
      resetForm();
      toast.success('Category created');
    },
    onError: (err: AxiosError<ApiError>) =>
      toast.error(err.response?.data?.error?.message ?? 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FormState> }) =>
      api.patch(`/categories/${id}`, data),
    onSuccess: () => {
      invalidate();
      resetForm();
      toast.success('Category updated');
    },
    onError: (err: AxiosError<ApiError>) =>
      toast.error(err.response?.data?.error?.message ?? 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success('Category removed');
    },
    onError: (err: AxiosError<ApiError>) =>
      toast.error(err.response?.data?.error?.message ?? 'Failed to remove'),
  });

  const resetForm = () => {
    setForm(BLANK);
    setShowForm(false);
    setEditId(null);
  };

  const startEdit = (cat: Category) => {
    setForm({ name: cat.name, color: cat.color, icon: cat.icon, isGlobal: cat.isGlobal });
    setEditId(cat._id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (editId) {
      updateMutation.mutate({ id: editId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (cat: Category) => {
    if (
      !window.confirm(
        `Remove "${cat.name}"? Existing posts keep their category label but it will no longer appear in filters.`
      )
    )
      return;
    deleteMutation.mutate(cat._id);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Categories</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage announcement categories visible to all users
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4" /> New Category
          </button>
        </div>

        {/* Create / Edit form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">
              {editId ? 'Edit category' : 'Add new category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Faculty of Engineering"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {/* Icon name */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Icon <span className="text-gray-400 font-normal">(Lucide icon name)</span>
                  </label>
                  <input
                    value={form.icon}
                    onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                    placeholder="e.g. Bell, BookOpen, Home"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Colour picker */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Colour</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        borderColor: form.color === c ? '#111' : 'transparent',
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-7 h-7 rounded-full border border-gray-300 cursor-pointer p-0 overflow-hidden"
                    title="Custom colour"
                  />
                  <span className="text-xs text-gray-400 font-mono">{form.color}</span>
                </div>
              </div>

              {/* Visibility */}
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={form.isGlobal}
                  onChange={e => setForm(f => ({ ...f, isGlobal: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-gray-700">
                  Global{' '}
                  <span className="text-gray-400 text-xs">
                    (visible to all users, not department-specific)
                  </span>
                </span>
              </label>

              {/* Preview */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-gray-400">Preview:</span>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: `${form.color}22`, color: form.color }}
                >
                  {form.name || 'Category name'}
                </span>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {isPending ? 'Saving…' : editId ? 'Save changes' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && categories.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            <Tag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-600">No categories yet</p>
            <p className="text-sm mt-1">Run the seed script or create one above</p>
          </div>
        )}

        {categories.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {categories.map(cat => (
              <div key={cat._id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Colour dot */}
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  {/* Badge preview */}
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
                    style={{ backgroundColor: `${cat.color}22`, color: cat.color }}
                  >
                    {cat.name}
                  </span>
                  {/* Meta */}
                  <span className="text-xs text-gray-400 truncate hidden sm:block">
                    {cat.slug} · {cat.isGlobal ? 'Global' : 'Department-specific'} · icon:{' '}
                    {cat.icon}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(cat)}
                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
