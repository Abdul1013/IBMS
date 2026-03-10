import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../../stores/authStore';
import { useComments } from '../../hooks/useComments';

interface Comment {
  _id: string;
  body: string;
  isEdited: boolean;
  deletedAt: string | null;
  authorId: { _id: string; name: string };
  createdAt: string;
  replies?: Comment[];
}

const CommentItem = ({
  comment,
  announcementId,
  depth = 0,
}: {
  comment: Comment;
  announcementId: string;
  depth?: number;
}) => {
  const { user } = useAuthStore();
  const { post, edit, remove } = useComments(announcementId);
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editText, setEditText] = useState(comment.body);

  const isOwn = user?.id === comment.authorId._id;
  const isDeleted = !!comment.deletedAt;

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className="py-3">
        {/* Author + time */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-800">{comment.authorId.name}</span>
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            {comment.isEdited && ' (edited)'}
          </span>
        </div>

        {/* Body */}
        {editing ? (
          <div className="mt-1">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={2}
              className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => {
                  edit.mutate({ id: comment._id, body: editText });
                  setEditing(false);
                }}
                className="text-xs text-primary font-medium hover:underline"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-gray-400 hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p
            className={`text-sm leading-relaxed ${isDeleted ? 'text-gray-400 italic' : 'text-gray-700'}`}
          >
            {comment.body}
          </p>
        )}

        {/* Actions */}
        {!isDeleted && !editing && (
          <div className="flex items-center gap-3 mt-1">
            {user && depth === 0 && (
              <button
                onClick={() => setReplying(!replying)}
                className="text-xs text-gray-400 hover:text-primary"
              >
                Reply
              </button>
            )}
            {isOwn && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-gray-400 hover:text-primary"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove.mutate(comment._id)}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* Reply input */}
        {replying && (
          <div className="mt-2 flex gap-2">
            <input
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Write a reply…"
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              disabled={!replyText.trim()}
              onClick={() => {
                post.mutate({ body: replyText, parentId: comment._id });
                setReplyText('');
                setReplying(false);
              }}
              className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
            >
              Reply
            </button>
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies?.map(r => (
        <CommentItem key={r._id} comment={r} announcementId={announcementId} depth={depth + 1} />
      ))}
    </div>
  );
};

export const CommentThread = ({ announcementId }: { announcementId: string }) => {
  const { user } = useAuthStore();
  const { data, post } = useComments(announcementId);
  const [newComment, setNewComment] = useState('');
  const comments = (data?.items ?? []) as Comment[];

  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Comments{comments.length > 0 && ` (${data?.meta?.total ?? comments.length})`}
      </h3>

      {/* New comment input */}
      {user ? (
        <div className="flex gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment…"
              rows={2}
              className="w-full text-sm border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <button
              disabled={!newComment.trim() || post.isPending}
              onClick={() => {
                post.mutate({ body: newComment });
                setNewComment('');
              }}
              className="mt-2 text-sm bg-primary text-white px-4 py-1.5 rounded-lg font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {post.isPending ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 mb-4">Sign in to leave a comment.</p>
      )}

      {/* Thread */}
      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No comments yet. Be the first!</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {comments.map(c => (
            <CommentItem key={c._id} comment={c} announcementId={announcementId} />
          ))}
        </div>
      )}
    </div>
  );
};
