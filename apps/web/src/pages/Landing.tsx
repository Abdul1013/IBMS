import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../lib/axios';
import { useAuthStore } from '../stores/authStore';
import type { Role } from '@ibms/types';

interface PublicAnnouncement {
  _id: string;
  title: string;
  category: { name: string; color: string } | null;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  publishedAt: string | null;
  authorId: { name: string } | null;
}

const ROLE_REDIRECT: Record<Role, string> = {
  SYSTEM_ADMIN: '/admin',
  DEPT_ADMIN: '/admin',
  STAFF: '/my-posts',
  STUDENT: '/feed',
};

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700 border border-red-300',
  HIGH: 'bg-orange-100 text-orange-700 border border-orange-300',
  NORMAL: 'bg-blue-50 text-blue-600 border border-blue-200',
};

export default function LandingPage() {
  const { user, isHydrated } = useAuthStore();

  // Redirect authenticated users immediately
  if (isHydrated && user) {
    return <Navigate to={ROLE_REDIRECT[user.role] ?? '/feed'} replace />;
  }

  return <LandingContent />;
}

function LandingContent() {
  const { data, refetch } = useQuery({
    queryKey: ['public-notices'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; items: PublicAnnouncement[] }>(
        '/announcements?status=PUBLISHED&limit=5&priority=URGENT,HIGH,NORMAL'
      );
      return res.data.items ?? [];
    },
    staleTime: 55_000,
  });

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(() => {
      void refetch();
    }, 60_000);
    return () => clearInterval(id);
  }, [refetch]);

  const notices = data ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">IB</span>
          </div>
          <span className="font-bold text-gray-900">IBMS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-primary text-white py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-block bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-wider">
            Lead City University
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            Your Campus.
            <br />
            One Feed.
          </h1>
          <p className="text-blue-100 text-lg mb-10 leading-relaxed">
            The official bulletin board for LCU students and staff. All announcements, one place —
            real-time updates, no missed notices.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto bg-white text-primary font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              Create account
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto border border-white/40 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="max-w-4xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-6">
        {[
          {
            title: 'Real-time updates',
            desc: 'Socket.IO pushes new announcements instantly — no page refresh needed.',
          },
          {
            title: 'Role-based access',
            desc: 'Students, staff, and admins each see exactly what they need.',
          },
          {
            title: 'Acknowledgement receipts',
            desc: 'Mark critical notices as read. Admins track who has seen what.',
          },
        ].map(f => (
          <div key={f.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            {/* <div className="text-3xl mb-3">{f.icon}</div> */}
            <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Public notice strip */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Latest notices</h2>
            <span className="text-xs text-gray-400">Updates every 60s</span>
          </div>

          {notices.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              No public announcements yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {notices.map(n => (
                <li key={n._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {n.category && (
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${n.category.color}22`,
                              color: n.category.color,
                            }}
                          >
                            {n.category.name}
                          </span>
                        )}
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[n.priority]}`}
                        >
                          {n.priority}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                      {n.authorId && (
                        <p className="text-xs text-gray-400 mt-0.5">By {n.authorId.name}</p>
                      )}
                    </div>
                    {n.publishedAt && (
                      <span className="text-xs text-gray-400 shrink-0">
                        {formatDistanceToNow(new Date(n.publishedAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-center">
            <Link to="/login" className="text-sm text-primary font-medium hover:underline">
              Sign in to see full announcements and interact →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-6 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Lead City University · IBMS v1.0 ·{' '}
        <span>Nigeria Data Protection Act 2023 compliant</span>
      </footer>
    </div>
  );
}
