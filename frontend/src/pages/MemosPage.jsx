import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileText, Tag, Clock, Grid3X3, List, Filter } from 'lucide-react';
import CommandBar from '../components/CommandBar';
import NoteEditor from '../components/NoteEditor';
import { api } from '../utils/api';
import { getContentPreview, extractFirstLine } from '../utils/tags';

export default function MemosPage() {
  const navigate = useNavigate();
  const [memos, setMemos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // list | grid
  const [editingNote, setEditingNote] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: 'note' };
      if (selectedCategory) params.category = selectedCategory;
      const [notesRes, catsRes] = await Promise.all([
        api.notes.list(params),
        api.categories.list(),
      ]);
      const allNotes = notesRes.data?.notes || notesRes.notes || [];
      setMemos(allNotes);
      const cats = catsRes.data?.categories || catsRes.categories || [];
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err) {
      console.error('Load memos error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => { loadData(); }, [loadData]);

  // 提取所有标签
  const allTags = [...new Set(memos.flatMap(m => m.tags || []))];

  // 过滤
  const filtered = memos.filter(m => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const content = (m.content || '').toLowerCase();
      const title = (m.title || '').toLowerCase();
      if (!content.includes(q) && !title.includes(q)) return false;
    }
    if (selectedTag && !(m.tags || []).includes(selectedTag)) return false;
    return true;
  });

  const handleCreate = useCallback(() => {
    setEditingNote(null);
    setIsCreating(true);
  }, []);

  const handleSave = useCallback(async (data) => {
    if (editingNote) {
      await api.notes.update(editingNote.id, { ...data, status: 'note' });
    } else {
      await api.notes.create({ ...data, status: 'note' });
    }
    setEditingNote(null);
    setIsCreating(false);
    loadData();
  }, [editingNote, loadData]);

  const handleClose = useCallback(() => {
    setEditingNote(null);
    setIsCreating(false);
  }, []);

  const handleDelete = useCallback(async (note) => {
    if (window.confirm('确定删除这条备忘吗？')) {
      await api.notes.delete(note.id);
      loadData();
    }
  }, [loadData]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <CommandBar
        breadcrumb="备忘"
        showBack
        lastSync={null}
        onRefresh={loadData}
        loading={loading}
      />

      <div className="max-w-7xl mx-auto px-4 py-4 flex gap-4">
        {/* 左侧分类树 */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-16 space-y-1">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-2">
              分类
            </h3>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !selectedCategory
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <FileText size={14} className="inline mr-2" />
              全部备忘
              <span className="float-right text-xs text-gray-400">{memos.length}</span>
            </button>
            {categories.map(cat => {
              const count = memos.filter(m => m.category === cat.name).length;
              return (
                <button
                  key={cat.id || cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === cat.name
                      ? 'bg-accent/10 text-accent font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {cat.name}
                  <span className="float-right text-xs text-gray-400">{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* 搜索 + 操作栏 */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索备忘..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                  rounded-lg text-sm outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg
                text-sm font-medium hover:bg-accent/90 transition-colors active:scale-95"
            >
              <Plus size={16} />
              新建备忘
            </button>
          </div>

          {/* 标签云 */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag size={12} className="text-gray-400 shrink-0" />
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                  !selectedTag
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                全部
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                    selectedTag === tag
                      ? 'bg-accent/10 text-accent font-medium'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* 视图切换 + 计数 */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {filtered.length} 条备忘
            </span>
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-gray-100 dark:bg-gray-800">
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-xs'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <List size={12} className="inline mr-1" />列表
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-xs'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <Grid3X3 size={12} className="inline mr-1" />网格
              </button>
            </div>
          </div>

          {/* 备忘列表 */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-400">暂无备忘</p>
              <button
                onClick={handleCreate}
                className="mt-3 text-sm text-accent hover:underline"
              >
                写一条备忘
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
              : 'flex flex-col gap-1'
            }>
              {filtered.map(memo => (
                <MemoCard
                  key={memo.id}
                  memo={memo}
                  viewMode={viewMode}
                  onClick={() => setEditingNote(memo)}
                  onDelete={() => handleDelete(memo)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {(isCreating || editingNote) && (
        <NoteEditor
          note={editingNote}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  );
}

function MemoCard({ memo, viewMode, onClick, onDelete }) {
  const title = memo.title || extractFirstLine(memo.content) || '无标题';
  const preview = getContentPreview(memo.content, 100);
  const date = memo.updated_at ? new Date(memo.updated_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : '';

  if (viewMode === 'grid') {
    return (
      <div
        onClick={onClick}
        className="group relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700
          p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100
            hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
        >
          ×
        </button>
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 mb-1">{title}</h4>
        {preview && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3">{preview}</p>}
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-1">
            {memo.tags?.slice(0, 2).map(t => (
              <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500">{t}</span>
            ))}
          </div>
          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
            <Clock size={9} /> {date}
          </span>
        </div>
        {memo.category && (
          <span className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            {memo.category}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer
        hover:bg-white dark:hover:bg-gray-800/50 transition-colors border border-transparent
        hover:border-gray-200 dark:hover:border-gray-700"
    >
      <FileText size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{title}</h4>
        {preview && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{preview}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {memo.tags?.slice(0, 1).map(t => (
          <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500">{t}</span>
        ))}
        <span className="text-[10px] text-gray-400">{date}</span>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all text-xs"
        >
          ×
        </button>
      </div>
    </div>
  );
}
