import { ThumbsUp, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useReactions } from '../../hooks/useReactions';

const REACTIONS: { type: string; icon: LucideIcon; label: string }[] = [
  { type: 'LIKE', icon: ThumbsUp, label: 'Like' },
  { type: 'HELPFUL', icon: Lightbulb, label: 'Helpful' },
  { type: 'URGENT', icon: AlertTriangle, label: 'Urgent' },
  { type: 'NOTED', icon: CheckCircle, label: 'Noted' },
];

export const ReactionBar = ({ announcementId }: { announcementId: string }) => {
  const { user } = useAuthStore();
  const { data, toggle } = useReactions(announcementId);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {REACTIONS.map(({ type, icon: Icon, label }) => {
        const count = data?.counts[type] ?? 0;
        const isActive = data?.mine.includes(type) ?? false;
        return (
          <button
            key={type}
            disabled={!user || toggle.isPending}
            onClick={() => toggle.mutate(type)}
            aria-label={`${label}: ${count}`}
            aria-pressed={isActive}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all
              ${
                isActive
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
              }
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Icon className="w-4 h-4" />
            {count > 0 && <span className="font-medium tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
};
