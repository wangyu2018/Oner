import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, ArrowLeft } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import MarkdownRenderer from '../components/MarkdownRenderer';
import TagChip from '../components/TagChip';
import NoteEditor from '../components/NoteEditor';
import { api } from '../utils/api';

export default function ViewNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function fetchNote() {
      try {
        setLoading(true);
        const data = await api.notes.get(id);
        setNote(data.note);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchNote();
  }, [id]);

  const handleSave = useCallback(async (data) => {
    const result = await api.notes.update(id, data);
    setNote(result.note);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || '笔记不存在'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-accent text-white rounded-lg"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const title = note.title || '无标题';
  const date = new Date(note.updated_at).toLocaleString('zh-CN');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md
        border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400
              hover:text-gray-900 dark:hover:text-gray-100"
          >
            <ArrowLeft size={18} />
            返回
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-accent text-white
              rounded-lg hover:bg-accent-600 transition-colors text-sm font-medium"
          >
            <Edit2 size={16} />
            编辑
          </button>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {title}
        </h1>

        <div className="flex items-center gap-4 mb-8 text-sm text-gray-500 dark:text-gray-400">
          <span>{date}</span>
          {note.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <TagChip key={tag} tag={tag} size="sm" />
              ))}
            </div>
          )}
        </div>

        <div className="markdown-content text-gray-800 dark:text-gray-200">
          <MarkdownRenderer content={note.content} />
        </div>
      </article>

      {isEditing && (
        <NoteEditor
          note={note}
          onSave={handleSave}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}
