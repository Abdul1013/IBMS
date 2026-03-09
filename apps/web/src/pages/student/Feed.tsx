import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, AlertTriangle, Megaphone, Inbox } from 'lucide-react';
import { useAnnouncements, useCategories } from '../../hooks/useAnnouncements';
import type { Announcement } from '../../hooks/useAnnouncements';
import AnnouncementCard from '../../components/bulletin/AnnouncementCard';
import AppLayout from '../../components/layout/AppLayout';
import { useSocketRoom } from '../../hooks/useSocket';
import { getSocket } from '../../lib/socket';
import { useAuthStore } from '../../stores/authStore';

const PRIORITIES = ['NORMAL', 'HIGH', 'URGENT'] as const;

interface NewAnnouncementPayload {
  id: string;
  title: string;
  priority: string;
  category?: { name: string };
}

export default function Feed() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [page, setPage] = useState(1);
  const [banner, setBanner] = useState<NewAnnouncementPayload | null>(null);
  const bannerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Debounce search 300ms
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const params: Record<string, unknown> = { page, limit: 20 };
  if (debouncedSearch) params['search'] = debouncedSearch;
  if (selectedCategory) params['category'] = selectedCategory;
  if (selectedPriority) params['priority'] = selectedPriority;

  const { data, isLoading, isError } = useAnnouncements(params);
  const { data: categories } = useCategories();

  // Real-time banner
  useSocketRoom('global');
  const showBanner = useCallback((payload: NewAnnouncementPayload) => {
    setBanner(payload);
    if (bannerRef.current) clearTimeout(bannerRef.current);
    bannerRef.current = setTimeout(() => setBanner(null), 8000);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socket.on('announcement:new', showBanner);
    return () => {
      socket.off('announcement:new', showBanner);
    };
  }, [showBanner]);

  const scrollToCard = (id: string) => {
    setBanner(null);
    const el = cardRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const urgentItems = data?.items.filter(a => a.priority === 'URGENT') ?? [];
  const regularItems = data?.items.filter(a => a.priority !== 'URGENT') ?? [];

  const searchInput = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search announcements…"
        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );

  const canPost = user && user.role !== 'STUDENT';

  return (
    <AppLayout search={searchInput}>
      {/* Real-time banner */}
      {banner && (
        <div className="bg-primary text-white px-4 py-2.5 flex items-center justify-between gap-4 shadow-md">
          <p className="text-sm font-medium truncate flex items-center gap-1.5">
            {banner.priority === 'URGENT' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <Megaphone className="w-4 h-4 shrink-0" />
            )}
            New {banner.category?.name ? `in ${banner.category.name}` : 'announcement'}:{' '}
            {banner.title}
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => scrollToCard(banner.id)}
              className="text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
            >
              View now
            </button>
            <button onClick={() => setBanner(null)} aria-label="Dismiss">
              <X className="w-4 h-4 opacity-70 hover:opacity-100" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile category slider */}
      {categories && categories.length > 0 && (
        <div className="md:hidden border-b border-gray-200 bg-white">
          <div
            className="flex gap-2 overflow-x-auto px-4 py-2.5"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button
              onClick={() => {
                setSelectedCategory('');
                setPage(1);
              }}
              className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                !selectedCategory
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat._id}
                onClick={() => {
                  setSelectedCategory(cat._id);
                  setPage(1);
                }}
                className="shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors"
                style={
                  selectedCategory === cat._id
                    ? { backgroundColor: cat.color, color: '#fff' }
                    : { backgroundColor: `${cat.color}18`, color: cat.color }
                }
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar — desktop only */}
          <aside className="hidden md:block w-52 shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-5 sticky top-20">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                  Category
                </h3>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setPage(1);
                    }}
                    className={`text-sm text-left px-3 py-1.5 rounded-lg font-medium transition-colors ${!selectedCategory ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    All
                  </button>
                  {categories?.map(cat => (
                    <button
                      key={cat._id}
                      onClick={() => {
                        setSelectedCategory(cat._id);
                        setPage(1);
                      }}
                      className={`text-sm text-left px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${selectedCategory === cat._id ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: selectedCategory === cat._id ? 'white' : cat.color,
                        }}
                      />
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                  Priority
                </h3>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setSelectedPriority('');
                      setPage(1);
                    }}
                    className={`text-sm text-left px-3 py-1.5 rounded-lg font-medium transition-colors ${!selectedPriority ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    All
                  </button>
                  {PRIORITIES.map(p => (
                    <button
                      key={p}
                      onClick={() => {
                        setSelectedPriority(p);
                        setPage(1);
                      }}
                      className={`text-sm text-left px-3 py-1.5 rounded-lg transition-colors ${selectedPriority === p ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main feed */}
          <main className="flex-1 min-w-0">
            {urgentItems.length > 0 && (
              <section className="mb-6">
                <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-3 flex items-center gap-1">
                  Urgent — pinned
                </p>
                <div className="space-y-3">
                  {urgentItems.slice(0, 3).map(a => (
                    <div
                      key={a._id}
                      ref={el => {
                        cardRefs.current[a._id] = el;
                      }}
                    >
                      <AnnouncementCard announcement={a} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {isLoading && (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            )}

            {isError && (
              <p className="text-red-600 text-sm bg-red-50 rounded-xl p-4">
                Failed to load announcements. Please try again.
              </p>
            )}

            {!isLoading && !isError && regularItems.length === 0 && urgentItems.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-600">No announcements found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            )}

            <div className="space-y-4">
              {regularItems.map((a: Announcement) => (
                <div
                  key={a._id}
                  ref={el => {
                    cardRefs.current[a._id] = el;
                  }}
                >
                  <AnnouncementCard announcement={a} />
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
          </main>
        </div>
      </div>

      {/* Floating "New" button — mobile, non-students only */}
      {canPost && (
        <a
          href="/post/new"
          className="md:hidden fixed bottom-5 right-5 z-30 flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-full shadow-lg text-sm font-semibold"
        >
          + New
        </a>
      )}
    </AppLayout>
  );
}
