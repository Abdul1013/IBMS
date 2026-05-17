import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useAnnouncement } from '../../hooks/useAnnouncements';
import { ReactionBar } from '../../components/bulletin/ReactionBar';
import { CommentThread } from '../../components/bulletin/CommentThread';
import { AckButton } from '../../components/bulletin/AckButton';
import AppLayout from '../../components/layout/AppLayout';
import { getSocket } from '../../lib/socket';

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  NORMAL: 'bg-blue-100 text-blue-700',
};

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: announcement, isLoading, isError } = useAnnouncement(id ?? '');
  const [viewCount, setViewCount] = useState<number | null>(null);

  // Join the announcement room and listen for live view increments
  useEffect(() => {
    if (!id) return;
    const socket = getSocket();
    socket.emit('join:room', { room: `announcement:${id}` });
    const handler = (payload: { announcementId: string; views: number }) => {
      if (payload.announcementId === id) setViewCount(payload.views);
    };
    socket.on('announcement:view_increment', handler);
    return () => {
      socket.off('announcement:view_increment', handler);
      socket.emit('leave:room', { room: `announcement:${id}` });
    };
  }, [id]);

  // Initialise local count once the query resolves
  useEffect(() => {
    if (announcement && viewCount === null) setViewCount(announcement.views);
  }, [announcement, viewCount]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
          <div className="h-8 w-2/3 rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-1/3 rounded bg-gray-100 animate-pulse" />
          <div className="h-64 rounded bg-gray-100 animate-pulse" />
        </div>
      </AppLayout>
    );
  }

  if (isError || !announcement) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <p className="text-red-600 mb-4">Announcement not found.</p>
          <button
            onClick={() => navigate('/feed')}
            className="text-sm text-primary hover:underline"
          >
            Back to feed
          </button>
        </div>
      </AppLayout>
    );
  }

  const { title, body, priority, category, authorId, publishedAt } = announcement;
  const displayViews = viewCount ?? announcement.views;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-primary hover:underline mb-6 inline-block"
        >
          ← Back
        </button>

        <div className="flex flex-wrap gap-2 mb-4">
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${PRIORITY_STYLES[priority] ?? PRIORITY_STYLES['NORMAL']}`}
          >
            {priority}
          </span>
          {category && (
            <span
              className="text-xs px-2 py-1 rounded-full font-medium"
              style={{ backgroundColor: `${category.color}22`, color: category.color }}
            >
              {category.name}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>

        <div className="flex items-center gap-4 text-xs text-gray-400 mb-8">
          <span>{authorId?.name ?? 'Unknown'}</span>
          {publishedAt && (
            <span>
              {new Date(publishedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {displayViews} {displayViews === 1 ? 'view' : 'views'}
          </span>
        </div>

        <div
          className="prose prose-sm max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: body }}
        />

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <ReactionBar announcementId={id!} />
            <AckButton announcementId={id!} />
          </div>
          <CommentThread announcementId={id!} />
        </div>
      </div>
    </AppLayout>
  );
}
