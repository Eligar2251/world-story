'use client';

import { useState } from 'react';
import {
  Bell, BookOpen, MessageCircle, Heart,
  Star, Users, Check, Trash2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { Notification } from '@/lib/types/database';

const typeIcons: Record<string, typeof Bell> = {
  new_chapter: BookOpen,
  comment_reply: MessageCircle,
  new_review: Star,
  new_like: Heart,
  new_subscriber: Users,
  system: Bell,
};

interface Props {
  notifications: Notification[];
}

export default function NotificationsClient({ notifications: init }: Props) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState(init);
  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function deleteNotification(id: string) {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-20">
        <Bell className="w-16 h-16 mx-auto text-ink-muted mb-4" />
        <p className="text-ink-secondary">Уведомлений пока нет</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header actions */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-ink-secondary">
            {unreadCount} непрочитанных
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            icon={<Check size={14} />}
          >
            Прочитать все
          </Button>
        </div>
      )}

      {/* List */}
      <div className="space-y-1">
        {notifications.map((notif) => {
          const Icon = typeIcons[notif.type] ?? Bell;
          return (
            <div
              key={notif.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-lg transition-colors group ${
                notif.read
                  ? 'bg-transparent hover:bg-surface-overlay'
                  : 'bg-accent-soft/30 hover:bg-accent-soft/50'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  notif.read
                    ? 'bg-surface-overlay text-ink-muted'
                    : 'bg-accent-soft text-accent'
                }`}
              >
                <Icon size={16} />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${
                    notif.read ? 'text-ink-secondary' : 'text-ink font-medium'
                  }`}
                >
                  {notif.title}
                </p>
                {notif.message && (
                  <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">
                    {notif.message}
                  </p>
                )}
                <p className="text-xs text-ink-muted mt-1">
                  {new Date(notif.created_at).toLocaleDateString('ru', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                {!notif.read && (
                  <button
                    onClick={() => markRead(notif.id)}
                    className="p-1.5 rounded text-ink-muted hover:text-accent hover:bg-surface-overlay"
                    title="Прочитано"
                  >
                    <Check size={14} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notif.id)}
                  className="p-1.5 rounded text-ink-muted hover:text-red-500 hover:bg-surface-overlay"
                  title="Удалить"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}