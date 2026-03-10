import { Link } from 'react-router-dom';
import { MessageSquare, Eye, ThumbsUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Announcement } from '../../hooks/useAnnouncements';

interface Props {
  announcement: Announcement;
}

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700 border border-red-300',
  HIGH: 'bg-orange-100 text-orange-700 border border-orange-300',
  NORMAL: 'bg-blue-50 text-blue-600 border border-blue-200',
};

export default function AnnouncementCard({ announcement }: Props) {
  const {
    _id,
    title,
    body,
    priority,
    category,
    authorId,
    publishedAt,
    views,
    reactionCounts,
    commentCount,
  } = announcement;

  const snippet = body.replace(/<[^>]+>/g, '').slice(0, 120);
  const totalReactions = reactionCounts
    ? Object.values(reactionCounts).reduce((s, v) => s + v, 0)
    : 0;

  const isUrgent = priority === 'URGENT';

  return (
    <Link
      to={`/announcements/${_id}`}
      className={`block rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow border ${
        isUrgent
          ? 'border-l-4 border-l-red-500 border-t-red-100 border-r-red-100 border-b-red-100'
          : 'border-gray-200'
      }`}
    >
      {/* Top badges row */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {isUrgent && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-600 text-white tracking-wide">
            URGENT
          </span>
        )}
        {!isUrgent && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_BADGE[priority]}`}
          >
            {priority}
          </span>
        )}
        {category && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${category.color}22`, color: category.color }}
          >
            {category.name}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">{title}</h3>

      {/* Excerpt — 120 chars */}
      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
        {snippet}
        {snippet.length === 120 ? '…' : ''}
      </p>

      {/* Footer row */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <span className="font-medium text-gray-600">{authorId?.name ?? 'Unknown'}</span>
          {publishedAt && (
            <span>· {formatDistanceToNow(new Date(publishedAt), { addSuffix: true })}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Reaction count */}
          {totalReactions > 0 && (
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" />
              {totalReactions}
            </span>
          )}
          {/* Comment count */}
          {(commentCount ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {commentCount}
            </span>
          )}
          {/* Views */}
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {views}
          </span>
        </div>
      </div>
    </Link>
  );
}
