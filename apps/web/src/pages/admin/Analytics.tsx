import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../../lib/axios';
import AppLayout from '../../components/layout/AppLayout';

interface AnalyticsData {
  summary: {
    totalAnnouncements: number;
    totalUsers: number;
    totalReactions: number;
    totalComments: number;
    totalAcks: number;
  };
  categoryBreakdown: Array<{ name: string; color: string; count: number }>;
  recentEngagement: Array<{ _id: string; count: number }>;
}

interface PendingItem {
  _id: string;
  title: string;
  authorId: { name: string; email: string };
  category: { name: string; color: string };
  createdAt: string;
}

const COLOURS = ['#1A56A0', '#27AE60', '#E67E22', '#E74C3C', '#8B5CF6', '#06B6D4'];

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: AnalyticsData }>('/admin/analytics');
      return res.data.data;
    },
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin-pending'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; items: PendingItem[] }>('/admin/pending');
      return res.data.items;
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-32">
          <div className="text-gray-400 animate-pulse">Loading analytics…</div>
        </div>
      </AppLayout>
    );
  }

  const { summary, categoryBreakdown, recentEngagement } = data ?? {
    summary: {
      totalAnnouncements: 0,
      totalUsers: 0,
      totalReactions: 0,
      totalComments: 0,
      totalAcks: 0,
    },
    categoryBreakdown: [],
    recentEngagement: [],
  };

  const pending = pendingData ?? [];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Last 30 days</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Announcements', value: summary.totalAnnouncements },
            { label: 'Active Users', value: summary.totalUsers },
            { label: 'Reactions', value: summary.totalReactions },
            { label: 'Comments', value: summary.totalComments },
            { label: 'Acknowledgements', value: summary.totalAcks },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm p-5 text-center">
              <p className="text-2xl font-bold text-primary">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Publication trend */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Publications per day (30 days)
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={recentEngagement}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#1A56A0"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Posts by category</h2>
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }: { name: string; percent: number }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {categoryBreakdown.map((_entry, i) => (
                      <Cell key={i} fill={COLOURS[i % COLOURS.length]} />
                    ))}
                  </Pie>
                  <Legend iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400 text-center py-12">No data yet</p>
            )}
          </div>
        </div>

        {/* Pending approval */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Pending Approval</h2>
              <p className="text-xs text-gray-400 mt-0.5">Announcements awaiting review</p>
            </div>
            {pending.length > 0 && (
              <Link
                to="/admin/pending"
                className="text-xs text-primary font-medium hover:underline"
              >
                View all ({pending.length})
              </Link>
            )}
          </div>

          {pendingLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          )}

          {!pendingLoading && pending.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm">Queue is clear — no pending announcements</p>
            </div>
          )}

          {!pendingLoading && pending.length > 0 && (
            <div className="divide-y divide-gray-100">
              {pending.map(item => (
                <div key={item._id} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full text-white shrink-0"
                      style={{ backgroundColor: item.category.color }}
                    >
                      {item.category.name}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                      <p className="text-xs text-gray-400">
                        By {item.authorId.name} ·{' '}
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/admin/pending"
                    className="shrink-0 text-xs text-primary font-medium hover:underline"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
