'use client';

import { useState, useEffect } from 'react';
import {
  MessageCircle, Heart, ChevronDown, ChevronUp,
  Send, AlertTriangle, CornerDownRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import type { Comment } from '@/lib/types/database';

interface Props {
  chapterId: string;
}

export default function ChapterComments({ chapterId }: Props) {
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadComments();
  }, [chapterId]);

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select('*, user:profiles!comments_user_id_fkey(id,username,display_name,avatar_url)')
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: true });

    setComments((data as Comment[]) ?? []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setSubmitting(true);

    const { data } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        chapter_id: chapterId,
        content: text.trim(),
        is_spoiler: isSpoiler,
      })
      .select('*, user:profiles!comments_user_id_fkey(id,username,display_name,avatar_url)')
      .single();

    if (data) {
      setComments((prev) => [...prev, data as Comment]);
      setText('');
      setIsSpoiler(false);
    }
    setSubmitting(false);
  }

  async function handleReply(parentId: string) {
    if (!user || !replyText.trim()) return;
    setSubmitting(true);

    const { data } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        chapter_id: chapterId,
        parent_id: parentId,
        content: replyText.trim(),
        is_spoiler: false,
      })
      .select('*, user:profiles!comments_user_id_fkey(id,username,display_name,avatar_url)')
      .single();

    if (data) {
      setComments((prev) => [...prev, data as Comment]);
      setReplyText('');
      setReplyTo(null);
      setExpandedReplies((prev) => new Set([...prev, parentId]));
    }
    setSubmitting(false);
  }

  async function handleLike(commentId: string) {
    if (!user) return;
    const existing = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('target_type', 'comment')
      .eq('target_id', commentId)
      .single();

    if (existing.data) {
      await supabase.from('likes').delete().eq('id', existing.data.id);
    } else {
      await supabase.from('likes').insert({
        user_id: user.id,
        target_type: 'comment',
        target_id: commentId,
      });
    }
  }

  // Build tree
  const rootComments = comments.filter((c) => !c.parent_id);
  const repliesMap = new Map<string, Comment[]>();
  comments.forEach((c) => {
    if (c.parent_id) {
      const arr = repliesMap.get(c.parent_id) ?? [];
      arr.push(c);
      repliesMap.set(c.parent_id, arr);
    }
  });

  function toggleReplies(id: string) {
    setExpandedReplies((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full skeleton shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 skeleton w-24" />
              <div className="h-3 skeleton w-full" />
              <div className="h-3 skeleton w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="py-4">
      <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
        <MessageCircle size={18} />
        Комментарии ({comments.length})
      </h3>

      {/* Write comment */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center text-accent text-sm font-medium shrink-0">
              {profile?.display_name?.charAt(0) ?? 'U'}
            </div>
            <div className="flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Написать комментарий..."
                rows={2}
                className="w-full rounded bg-surface-overlay border border-line px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40 resize-y"
              />
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-1.5 text-xs text-ink-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSpoiler}
                    onChange={(e) => setIsSpoiler(e.target.checked)}
                    className="accent-accent"
                  />
                  <AlertTriangle size={12} />
                  Спойлер
                </label>
                <Button type="submit" size="sm" loading={submitting} disabled={!text.trim()} icon={<Send size={14} />}>
                  Отправить
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <p className="text-sm text-ink-muted mb-6">
          <a href="/login" className="text-accent hover:underline">Войдите</a>, чтобы оставить комментарий
        </p>
      )}

      {/* Comments list */}
      {rootComments.length === 0 ? (
        <p className="text-sm text-ink-muted text-center py-8">
          Комментариев пока нет. Будьте первым!
        </p>
      ) : (
        <div className="space-y-4">
          {rootComments.map((comment) => {
            const replies = repliesMap.get(comment.id) ?? [];
            const isExpanded = expandedReplies.has(comment.id);

            return (
              <div key={comment.id}>
                <CommentItem
                  comment={comment}
                  onReply={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  onLike={() => handleLike(comment.id)}
                />

                {/* Reply count toggle */}
                {replies.length > 0 && (
                  <button
                    onClick={() => toggleReplies(comment.id)}
                    className="flex items-center gap-1 ml-11 mt-1 text-xs text-accent hover:underline"
                  >
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {replies.length} {replies.length === 1 ? 'ответ' : 'ответов'}
                  </button>
                )}

                {/* Replies */}
                {isExpanded && replies.map((reply) => (
                  <div key={reply.id} className="ml-11 mt-2">
                    <CommentItem
                      comment={reply}
                      onReply={() => setReplyTo(replyTo === reply.id ? null : reply.id)}
                      onLike={() => handleLike(reply.id)}
                      isReply
                    />
                  </div>
                ))}

                {/* Reply form */}
                {replyTo === comment.id && user && (
                  <div className="ml-11 mt-2 flex gap-2">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Ответить..."
                      className="flex-1 rounded bg-surface-overlay border border-line px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply(comment.id)}
                    />
                    <Button size="sm" onClick={() => handleReply(comment.id)} loading={submitting} disabled={!replyText.trim()}>
                      <Send size={14} />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  onReply,
  onLike,
  isReply = false,
}: {
  comment: Comment;
  onReply: () => void;
  onLike: () => void;
  isReply?: boolean;
}) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const u = comment.user as any;

  return (
    <div className={`flex gap-3 ${isReply ? '' : ''}`}>
      {isReply && <CornerDownRight size={14} className="text-ink-muted shrink-0 mt-1" />}
      <div className="w-7 h-7 rounded-full bg-accent-soft flex items-center justify-center text-accent text-xs font-medium shrink-0">
        {u?.display_name?.charAt(0) ?? 'U'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">
            {u?.display_name ?? u?.username ?? 'Пользователь'}
          </span>
          <span className="text-xs text-ink-muted">
            {new Date(comment.created_at).toLocaleDateString('ru', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {comment.is_spoiler && !spoilerRevealed && (
            <button
              onClick={() => setSpoilerRevealed(true)}
              className="flex items-center gap-1 text-xs text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded"
            >
              <AlertTriangle size={10} />
              Спойлер — показать
            </button>
          )}
        </div>

        {comment.is_spoiler && !spoilerRevealed ? (
          <p className="text-sm text-ink-muted italic mt-1">Содержимое скрыто</p>
        ) : (
          <p className="text-sm text-ink-secondary mt-1 whitespace-pre-line">
            {comment.content}
          </p>
        )}

        <div className="flex items-center gap-3 mt-1.5">
          <button onClick={onLike} className="flex items-center gap-1 text-xs text-ink-muted hover:text-accent transition-colors">
            <Heart size={12} />
            {comment.likes_count > 0 && comment.likes_count}
          </button>
          <button onClick={onReply} className="text-xs text-ink-muted hover:text-accent transition-colors">
            Ответить
          </button>
        </div>
      </div>
    </div>
  );
}