import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import { api } from '../../lib/axios';

interface ApiError {
  error: { message: string };
}

interface PendingItem {
  _id: string;
  title: string;
  authorId: { name: string; email: string };
  category: { name: string; color: string };
  createdAt: string;
}

export default function ApprovalQueuePage() {
  const queryClient = useQueryClient();
  const [rejectModal, setRejectModal] = useState<{ id: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pending'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; items: PendingItem[] }>('/admin/pending');
      return res.data;
    },
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.post(`/admin/pending/${id}/approve`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-pending'] });
      toast.success('Announcement approved and published');
    },
    onError: (err: AxiosError<ApiError>) =>
      toast.error(err.response?.data?.error?.message ?? 'Failed to approve'),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/admin/pending/${id}/reject`, { reason }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-pending'] });
      setRejectModal(null);
      setRejectReason('');
      toast.success('Announcement returned to author');
    },
    onError: (err: AxiosError<ApiError>) =>
      toast.error(err.response?.data?.error?.message ?? 'Failed to reject'),
  });

  const items = data?.items ?? [];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Approval Queue</h1>
          <p className="text-sm text-gray-500 mt-0.5">Announcements awaiting review</p>
        </div>
        {isLoading && <div className="text-center text-gray-400 py-12 animate-pulse">Loading…</div>}

        {!isLoading && items.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="font-medium">Queue is clear</p>
            <p className="text-sm mt-1">No announcements pending review</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {items.map(item => (
            <div key={item._id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: item.category.color }}
                    >
                      {item.category.name}
                    </span>
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">
                      PENDING
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-400">
                    By <span className="text-gray-600">{item.authorId.name}</span> ·{' '}
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setRejectModal({ id: item._id, title: item.title })}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => approve.mutate(item._id)}
                    disabled={approve.isPending}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-800 mb-1">Return for revision</h3>
            <p className="text-sm text-gray-500 mb-4">"{rejectModal.title}"</p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for rejection *
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Explain what needs to be changed…"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={!rejectReason.trim() || reject.isPending}
                onClick={() => reject.mutate({ id: rejectModal.id, reason: rejectReason })}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {reject.isPending ? 'Sending…' : 'Return to author'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
