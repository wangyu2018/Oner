import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Palette } from 'lucide-react';
import { api } from '../utils/api';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function CategoryManager({ isOpen, onClose, onCategoryChange }) {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const loadCategories = useCallback(async () => {
    try {
      const data = await api.categories.list();
      setCategories(data.data.categories || []);
      onCategoryChange?.();
    } catch {}
  }, [onCategoryChange]);

  useEffect(() => {
    if (isOpen) loadCategories();
  }, [isOpen, loadCategories]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await api.categories.create({ name: newName.trim(), color: newColor });
      setNewName('');
      setNewColor('#3b82f6');
      await loadCategories();
    } catch {}
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    try {
      await api.categories.update(id, { name: editName.trim() });
      setEditingId(null);
      await loadCategories();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个分类吗？已有该分类的笔记将被清空分类。')) return;
    try {
      await api.categories.delete(id);
      await loadCategories();
    } catch {}
  };

  const handleColorChange = async (id, color) => {
    try {
      await api.categories.update(id, { color });
      await loadCategories();
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">分类管理</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 group">
              {editingId === cat.id ? (
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={() => handleUpdate(cat.id)}
                  onKeyDown={e => e.key === 'Enter' && handleUpdate(cat.id)}
                  className="flex-1 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                  autoFocus
                />
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      onClick={() => {
                        const idx = COLORS.indexOf(cat.color);
                        handleColorChange(cat.id, COLORS[(idx + 1) % COLORS.length]);
                      }}
                      className="w-5 h-5 rounded-full flex-shrink-0 border border-white/50 hover:ring-2 hover:ring-accent transition-all"
                      style={{ backgroundColor: cat.color }}
                      title="切换颜色"
                    />
                    <span
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer truncate"
                      onDoubleClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                    >
                      {cat.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}

          {categories.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">还没有分类，添加一个吧</p>
          )}
        </div>

        <div className="p-5 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-5 h-5 rounded-full transition-all ${newColor === c ? 'ring-2 ring-offset-1 ring-accent dark:ring-offset-gray-800' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="新分类名称..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="p-2 bg-accent text-white rounded-lg hover:bg-accent-600 disabled:opacity-50 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
