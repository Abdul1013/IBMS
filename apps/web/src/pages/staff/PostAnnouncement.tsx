import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import type { AxiosError } from 'axios';
import { useCreateAnnouncement, useCategories } from '../../hooks/useAnnouncements';
import RichTextEditor from '../../components/bulletin/RichTextEditor';
import AppLayout from '../../components/layout/AppLayout';

const schema = z.object({
  title: z.string().min(5).max(200).trim(),
  body: z.string().min(10, 'Body must be at least 10 characters'),
  category: z.string().regex(/^[a-f\d]{24}$/i, 'Select a valid category'),
  priority: z.enum(['NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  expiresAt: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ApiError {
  error: { code: string; message: string };
}

export default function PostAnnouncement() {
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const createMutation = useCreateAnnouncement();

  // Ctrl+N — focus title field
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('ann-title')?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined,
      };
      await createMutation.mutateAsync(payload);
      toast.success('Announcement saved as draft');
      navigate('/my-posts');
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const msg = axiosErr.response?.data?.error?.message ?? 'Failed to create announcement';
      toast.error(msg);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">New Announcement</h1>
          <kbd className="hidden md:inline-block text-xs text-gray-400 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded">
            Ctrl+N to focus title
          </kbd>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 bg-white rounded-xl border border-gray-200 p-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              id="ann-title"
              {...register('title')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Announcement title"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
            <Controller
              control={control}
              name="body"
              defaultValue=""
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Write your announcement here…"
                />
              )}
            />
            {errors.body && <p className="text-red-500 text-xs mt-1">{errors.body.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                {...register('category')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                <option value="">Select category…</option>
                {categories?.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                {...register('priority')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expires at <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="datetime-local"
              {...register('expiresAt')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving…' : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/my-posts')}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
