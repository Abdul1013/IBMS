import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import type { AxiosError } from 'axios';
import { User, Building2, Home, Bell, MapPin, Check } from 'lucide-react';
import { api } from '../lib/axios';
import { useAuthStore } from '../stores/authStore';
import { useCategories } from '../hooks/useAnnouncements';
import AppLayout from '../components/layout/AppLayout';

interface ProfileData {
  _id: string;
  name: string;
  email: string;
  role: string;
  faculty?: string;
  hostel?: 'ON_CAMPUS' | 'OFF_CAMPUS';
  department?: { _id: string; name: string; color: string } | null;
  notifyCategories?: Array<{ _id: string; name: string; color: string }>;
}

interface ApiError {
  error: { message: string };
}

const FACULTIES = [
  'Faculty of Engineering',
  'Faculty of Sciences',
  'Faculty of Law',
  'Faculty of Medicine & Health Sciences',
  'Faculty of Business Administration',
  'Faculty of Arts & Humanities',
  'Faculty of Social Sciences',
];

export default function ProfilePage() {
  const { setAuth, user: storeUser } = useAuthStore();
  const { data: categories } = useCategories();

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['profile-me'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: { user: ProfileData } }>('/auth/me');
      return res.data.data.user;
    },
  });

  const [name, setName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [hostel, setHostel] = useState<'ON_CAMPUS' | 'OFF_CAMPUS' | ''>('');
  const [department, setDepartment] = useState('');
  const [notifyCategories, setNotifyCategories] = useState<string[]>([]);

  // Pre-fill once profile loads
  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setFaculty(profile.faculty ?? '');
    setHostel(profile.hostel ?? '');
    setDepartment(profile.department?._id ?? '');
    setNotifyCategories(profile.notifyCategories?.map(c => c._id) ?? []);
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.patch<{ success: boolean; data: { user: ProfileData } }>('/auth/me', payload),
    onSuccess: res => {
      const updated = res.data.data.user;
      // Sync name/role into auth store
      if (storeUser) {
        setAuth({ ...storeUser, name: updated.name }, useAuthStore.getState().accessToken ?? '');
      }
      toast.success('Profile saved');
    },
    onError: (err: AxiosError<ApiError>) =>
      toast.error(err.response?.data?.error?.message ?? 'Failed to save'),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    updateMutation.mutate({
      name: name.trim(),
      faculty: faculty || undefined,
      hostel: hostel || null,
      department: department || null,
      notifyCategories,
    });
  };

  const toggleCategory = (id: string) => {
    setNotifyCategories(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-32">
          <div className="text-gray-400 animate-pulse">Loading profile…</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your details and notification preferences
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Personal info */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-gray-800">Personal Info</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  value={profile?.email ?? ''}
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
              <span className="inline-block text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">
                {profile?.role}
              </span>
            </div>
          </section>

          {/* Academic info */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-gray-800">Academic Details</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Faculty</label>
                <select
                  value={faculty}
                  onChange={e => setFaculty(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  <option value="">— Select faculty —</option>
                  {FACULTIES.map(f => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  <option value="">— Select department —</option>
                  {categories
                    ?.filter(c => c.name.startsWith('Dept'))
                    .map(c => (
                      <option key={c._id} value={c._id}>
                        {c.name.replace('Dept — ', '')}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </section>

          {/* Accommodation */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Home className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-gray-800">Accommodation</h2>
            </div>
            <div className="flex gap-3">
              {(['ON_CAMPUS', 'OFF_CAMPUS'] as const).map(opt => (
                <label
                  key={opt}
                  className={`flex-1 flex items-center justify-center gap-2 border rounded-lg py-2.5 cursor-pointer text-sm font-medium transition-colors ${
                    hostel === opt
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="hostel"
                    value={opt}
                    checked={hostel === opt}
                    onChange={() => setHostel(opt)}
                    className="sr-only"
                  />
                  {opt === 'ON_CAMPUS' ? (
                    <>
                      <Home className="w-4 h-4" /> On-campus
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" /> Off-campus
                    </>
                  )}
                </label>
              ))}
              {hostel && (
                <button
                  type="button"
                  onClick={() => setHostel('')}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2"
                >
                  Clear
                </button>
              )}
            </div>
          </section>

          {/* Notification preferences */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-gray-800">Notification Preferences</h2>
              <span className="text-xs text-gray-400 ml-auto">Select categories to follow</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories?.map(cat => {
                const active = notifyCategories.includes(cat._id);
                return (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => toggleCategory(cat._id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
                    style={
                      active
                        ? { backgroundColor: cat.color, color: '#fff', borderColor: cat.color }
                        : {
                            backgroundColor: `${cat.color}18`,
                            color: cat.color,
                            borderColor: `${cat.color}40`,
                          }
                    }
                  >
                    {active && <Check className="w-3 h-3 inline mr-0.5" />}
                    {cat.name}
                  </button>
                );
              })}
            </div>
            {notifyCategories.length > 0 && (
              <p className="text-xs text-gray-400">
                You will be notified about announcements in {notifyCategories.length} categor
                {notifyCategories.length === 1 ? 'y' : 'ies'}.
              </p>
            )}
          </section>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
