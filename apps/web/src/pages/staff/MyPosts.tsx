import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import type { AxiosError } from 'axios';
import { Plus, FileText } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useMyAnnouncements,
  useDeleteAnnouncement,
  announcementKeys,
} from '../../hooks/useAnnouncements';
import { api } from '../../lib/axios';
import AppLayout from '../../components/layout/AppLayout';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-yellow-100 text-yellow-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-red-100 text-red-600',
};

interface ApiError {
  error: { code: string; message: string };
}

export default function MyPosts() {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useMyAnnouncements({ page, limit: 10 });
  const deleteMutation = useDeleteAnnouncement();

  const submitMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/announcements/${id}/status`, { status: 'PENDING' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: announcementKeys.all });
      toast.success('Submitted for review');
    },
    onError: (err: AxiosError<ApiError>) =>
      toast.error(err.response?.data?.error?.message ?? 'Failed to submit'),
  });

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Announcement deleted');
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const msg = axiosErr.response?.data?.error?.message ?? 'Delete failed';
      toast.error(msg);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">My Announcements</h1>
          <Link
            to="/post/new"
            className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4" /> New
          </Link>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && (!data || data.items.length === 0) && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-600">No announcements yet</p>
            <Link to="/post/new" className="text-sm text-primary hover:underline mt-2 inline-block">
              Create your first one
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {data?.items.map(a => (
            <div
              key={a._id}
              className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[a.status] ?? STATUS_STYLES['DRAFT']}`}
                  >
                    {a.status}
                  </span>
                  <span className="text-xs text-gray-400">{a.priority}</span>
                  {a.category && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${a.category.color}22`, color: a.category.color }}
                    >
                      {a.category.name}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(a.createdAt).toLocaleDateString('en-GB')}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {a.status === 'PUBLISHED' && (
                  <Link
                    to={`/announcements/${a._id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    View
                  </Link>
                )}
                {a.status === 'DRAFT' && (
                  <button
                    onClick={() => submitMutation.mutate(a._id)}
                    disabled={submitMutation.isPending}
                    className="text-xs text-green-600 hover:underline disabled:opacity-40"
                  >
                    Submit
                  </button>
                )}
                {(a.status === 'DRAFT' || a.status === 'PENDING') && (
                  <button
                    onClick={() => navigate(`/post/edit/${a._id}`)}
                    className="text-xs text-gray-600 hover:underline"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleDelete(a._id, a.title)}
                  disabled={deleteMutation.isPending}
                  className="text-xs text-red-500 hover:underline disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {data && data.meta.totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              {page} / {data.meta.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))}
              disabled={page === data.meta.totalPages}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
