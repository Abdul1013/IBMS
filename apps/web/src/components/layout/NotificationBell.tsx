import { useState } from 'react';
import {
  Bell,
  X,
  Check,
  MessageSquare,
  CheckCircle2,
  CheckCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../hooks/useNotifications';
import { useNotificationStore } from '../../stores/notificationStore';

const TYPE_ICON: Record<string, LucideIcon> = {
  COMMENT: MessageSquare,
  ACKNOWLEDGEMENT: CheckCircle2,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
};

interface NotificationItem {
  _id: string;
  type: string;
  message: string;
  createdAt: string;
  announcementId?: { _id: string };
}

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useNotificationStore();
  const { data, markAllRead } = useNotifications();
  const notifications = (data?.items ?? []) as NotificationItem[];

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-10 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-40 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">You're all caught up</p>
              ) : (
                notifications.map(n => {
                  const Icon = TYPE_ICON[n.type] ?? Bell;
                  return (
                    <div key={n._id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-2">
                        <Icon className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 leading-relaxed">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
