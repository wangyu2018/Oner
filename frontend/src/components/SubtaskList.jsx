import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { api } from '../utils/api';

export default function SubtaskList({ noteId, readOnly }) {
  const [subtasks, setSubtasks] = useState([]);
  const [progress, setProgress] = useState({ total: 0, done: 0 });
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const loadSubtasks = async () => {
    try {
      const data = await api.notes.getSubtasks(noteId);
      setSubtasks(data.data.subtasks);
      setProgress(data.data.progress);
    } catch (err) {
      console.error('Failed to load subtasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (noteId) loadSubtasks();
  }, [noteId]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      await api.notes.addSubtask(noteId, { title: newTitle.trim() });
      setNewTitle('');
      loadSubtasks();
    } catch (err) {
      console.error('Failed to add subtask:', err);
    }
  };

  const handleToggle = async (subtask) => {
    const newStatus = subtask.status === 'done' ? 'todo' : 'done';
    try {
      await api.notes.update(subtask.id, { status: newStatus });
      loadSubtasks();
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
    }
  };

  const handleDelete = async (subtaskId) => {
    try {
      await api.notes.delete(subtaskId);
      loadSubtasks();
    } catch (err) {
      console.error('Failed to delete subtask:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  if (loading) return null;

  return (
    <div className="border-t border-gray-100 dark:border-gray-800">
      {/* Progress bar */}
      {progress.total > 0 && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>子任务</span>
            <span>{progress.done}/{progress.total}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtask list */}
      <div className="px-4 py-2 space-y-1">
        {subtasks.map((st) => (
          <div
            key={st.id}
            className="flex items-center gap-2 group py-1"
          >
            <button
              onClick={() => handleToggle(st)}
              className="flex-shrink-0 text-gray-400 hover:text-accent transition-colors"
            >
              {st.status === 'done' ? (
                <CheckCircle2 size={16} className="text-green-500" />
              ) : (
                <Circle size={16} />
              )}
            </button>
            <span className={`flex-1 text-sm ${
              st.status === 'done'
                ? 'line-through text-gray-400 dark:text-gray-500'
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              {st.title}
            </span>
            {!readOnly && (
              <button
                onClick={() => handleDelete(st.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add subtask input */}
      {!readOnly && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <Circle size={14} className="text-gray-300 flex-shrink-0" />
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="添加子任务，按 Enter 确认"
              className="flex-1 text-sm bg-transparent outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400"
            />
            {newTitle.trim() && (
              <button
                onClick={handleAdd}
                className="p-1 text-accent hover:bg-accent/10 rounded transition-colors"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
