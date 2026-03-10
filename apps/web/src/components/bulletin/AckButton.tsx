import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import type { AxiosError } from 'axios';
import { api } from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export const AckButton = ({ announcementId }: { announcementId: string }) => {
  const { user } = useAuthStore();
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user || user.role !== 'STUDENT') return null;

  const handleAck = async () => {
    if (acknowledged) return;
    setLoading(true);
    try {
      await api.post(`/announcements/${announcementId}/acknowledge`);
      setAcknowledged(true);
      toast.success('Acknowledged');
    } catch (err) {
      const axiosErr = err as AxiosError<{ error: { message: string } }>;
      toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to acknowledge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAck}
      disabled={acknowledged || loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all
        ${
          acknowledged
            ? 'bg-green-50 border-green-300 text-green-700 cursor-default'
            : 'bg-white border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'
        }
        disabled:opacity-70`}
    >
      <CheckCircle className={`w-4 h-4 ${acknowledged ? 'text-green-600' : ''}`} />
      {acknowledged ? 'Acknowledged' : 'I acknowledge this'}
    </button>
  );
};
