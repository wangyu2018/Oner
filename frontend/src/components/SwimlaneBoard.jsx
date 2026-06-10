import React, { useMemo, useState } from 'react';
import {
  DndContext, useDroppable, useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, CheckCircle2, ListTodo, Clock, Trash2, AlertTriangle, Tag, MoreHorizontal } from 'lucide-react';
import { getContentPreview, extractFirstLine } from '../utils/tags';

// ========== 泳道色彩主题 ==========
const LANE_THEMES = [
  { id: 'work',    label: '工作',  color: '#3b82f6', bg: 'rgba(59,130,246,0.06)',  border: '#3b82f6' },
  { id: 'study',   label: '学习',  color: '#a855f7', bg: 'rgba(168,85,247,0.06)', border: '#a855f7' },
  { id: 'life',    label: '生活',  color: '#14b8a6', bg: 'rgba(20,184,166,0.06)',  border: '#14b8a6' },
  { id: 'project', label: '项目',  color: '#f97316', bg: 'rgba(249,115,22,0.06)',  border: '#f97316' },
  { id: 'other',   label: '其他',  color: '#6b7280', bg: 'transparent',            border: '#cbd5e1' },
];

// 分类对应的 emoji 图标
function getLaneIcon(categoryName) {
  if (!categoryName) return '\uD83D\uDCCC'; // 📌
  const name = categoryName.toLowerCase();
  if (name.includes('工作') || name.includes('work')) return '\uD83D\uDCBC'; // 💼
  if (name.includes('学习') || name.includes('study') || name.includes('学')) return '\uD83D\uDCDA'; // 📚
  if (name.includes('生活') || name.includes('life') || name.includes('家')) return '\uD83C\uDFE0'; // 🏠
  if (name.includes('项目') || name.includes('project') || name.includes('项')) return '\uD83D\uDE80'; // 🚀
  return '\uD83D\uDCCC'; // 📌
}

const COLUMNS = [
  { id: 'note',        title: '备忘',   color: '#4f46e5' },
  { id: 'todo',        title: '待办',   color: '#eab308' },
  { id: 'in_progress', title: '进行中', color: '#f97316' },
  { id: 'done',        title: '已完成', color: '#22c55e' },
];

// 根据分类名称分配泳道主题色
function getLaneTheme(categoryName) {
  if (!categoryName) return LANE_THEMES[4];
  const hash = categoryName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const idx = hash % 4;
  return LANE_THEMES[idx];
}

// ========== 卡片视觉权重 ==========
function getWeightClass(note) {
  const p = note.priority || 'normal';
  const s = note.status || 'note';
  if (p === 'urgent') return 'urgent';
  if (p === 'high')   return 'high';
  if (s === 'done')   return 'done';
  if (p === 'low')    return 'low';
  return 'normal';
}

function getWeightClassForCSS(note) {
  const p = note.priority || 'normal';
  const s = note.status || 'note';
  if (p === 'urgent') return 'weight-urgent';
  if (p === 'high') return 'weight-high';
  if (s === 'done') return 'weight-done';
  if (p === 'low') return 'weight-low';
  return '';
}

// ========== 泳道卡片（可拖拽） ==========
function SwimlaneCard({ note, onClick, onDelete, onTagClick, themeColor }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `swimlane-${note.id}`,
    data: { note, type: 'note' },
  });

  const dragStyle = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
    touchAction: 'none',
  };

  const p = note.priority || 'normal';
  const weight = getWeightClass(note);
  const weightClassCSS = getWeightClassForCSS(note);
  const title = note.title || extractFirstLine(note.content) || '无标题';
  const preview = getContentPreview(note.content, 60);

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(note);
  };

  const dueDate = note.due_date;
  const isOverdue = dueDate && new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
  const isDueToday = dueDate && new Date(dueDate).toDateString() === new Date().toDateString();

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onClick(note)}
      className={`group relative cursor-grab active:cursor-grabbing active:scale-[0.98]
        bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
        rounded-lg p-2.5 mb-1.5 ${weightClassCSS}
        ${weight === 'done' ? 'opacity-60' : ''}
        ${weight === 'low' ? 'opacity-70 border-dashed' : ''}
      `}
      style={dragStyle}
      onMouseEnter={(e) => {
        if (weight !== 'done') {
          e.currentTarget.style.borderColor = '#4f46e5';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(79,70,229,0.1)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = weight === 'done' || weight === 'low' ? '#e2e8f0' : '#e2e8f0';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* 删除按钮 */}
      <button
        onClick={handleDelete}
        className="absolute top-1.5 right-1.5 p-0.5 rounded opacity-0 group-hover:opacity-100
          hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all z-10"
      >
        <Trash2 size={10} />
      </button>

      {/* 优先级徽章 */}
      {(p === 'urgent' || p === 'high') && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 5 }}>
          {p === 'urgent' && (
            <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, fontWeight: 600, background: '#fef2f2', color: '#ef4444' }}>
              🔴 高优先
            </span>
          )}
          {p === 'high' && (
            <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, fontWeight: 600, background: '#fff7ed', color: '#f97316' }}>
              🟠 中优先
            </span>
          )}
          {note.subtask_total > 0 && (
            <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, fontWeight: 600, background: '#eef2ff', color: '#4f46e5' }}>
              {note.subtask_done || 0}/{note.subtask_total}
            </span>
          )}
        </div>
      )}

      {/* 标题 */}
      <h4 style={{ fontSize: 12, fontWeight: 600, marginBottom: 2, lineHeight: 1.4, color: weight === 'done' ? '#94a3b8' : '#1e293b' }}>
        {weight === 'done' ? <s>{title}</s> : title}
      </h4>

      {/* 预览 */}
      {preview && (
        <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.3, marginBottom: 0 }}>{preview}</p>
      )}

      {/* 截止日期 */}
      {dueDate && (
        <div style={{
          fontSize: 10,
          marginTop: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          color: isOverdue ? '#ef4444' : isDueToday ? '#f97316' : '#94a3b8',
          fontWeight: isOverdue ? 700 : isDueToday ? 600 : 400,
        }}>
          <AlertTriangle size={10} />
          {isOverdue ? `⚠️ 已过期 ${Math.floor((new Date() - new Date(dueDate)) / (1000*60*60*24))}天` : ''}
          {isDueToday && !isOverdue ? '📅 今日截止' : ''}
          {!isOverdue && !isDueToday
            ? new Date(dueDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
            : ''
          }
        </div>
      )}

      {/* 子任务进度条 */}
      {note.subtask_total > 0 && (
        <>
          <div style={{ height: 3, background: '#e2e8f0', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              borderRadius: 2,
              width: `${((note.subtask_done || 0) / note.subtask_total) * 100}%`,
              backgroundColor: themeColor || '#4f46e5',
            }} />
          </div>
          <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>
            {note.subtask_done || 0}/{note.subtask_total} 子任务
          </div>
        </>
      )}

      {/* 标签 */}
      {note.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
          {note.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }}
              style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#eef2ff', color: '#4f46e5', cursor: 'pointer' }}
            >
              {tag}
            </span>
          ))}
          {note.tags.length > 2 && (
            <span style={{ fontSize: 9, color: '#94a3b8' }}>+{note.tags.length - 2}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ========== 泳道放置格 ==========
function LaneCell({ cellId, cards, onClick, onDelete, onTagClick, themeColor }) {
  const { setNodeRef, isOver } = useDroppable({
    id: cellId,
    data: { type: 'swimlane-cell', cellId },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        padding: 8,
        borderRight: '1px solid #f1f5f9',
        minHeight: 80,
        transition: 'background 0.15s',
        background: isOver ? 'rgba(79,70,229,0.04)' : 'transparent',
      }}
      className="last:border-r-0"
    >
      {cards.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 60 }}>
          {isOver ? (
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, color: '#4f46e5' }}>+</span>
            </div>
          ) : (
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>—</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {cards.map(note => (
            <SwimlaneCard
              key={note.id}
              note={note}
              onClick={onClick}
              onDelete={onDelete}
              onTagClick={onTagClick}
              themeColor={themeColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ========== 泳道标签 ==========
function LaneLabel({ category, stats, theme, isActive, onClick }) {
  const progress = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;
  const icon = getLaneIcon(category);

  return (
    <div
      onClick={onClick}
      className="hover:bg-gray-50 cursor-pointer"
      style={{
        padding: '14px 12px',
        borderRight: '1px solid #e2e8f0',
        background: isActive ? 'rgba(79,70,229,0.03)' : 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        position: 'sticky',
        left: 0,
        zIndex: 5,
        borderLeft: `4px solid ${theme.border}`,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 700, color: theme.color }}>
        {icon} {category || '未分类'}
      </span>
      <span style={{ fontSize: 10, color: '#94a3b8' }}>
        {stats.total} 项 · {stats.done} 完成
      </span>
      <div style={{ height: 3, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 2, width: `${progress}%`, backgroundColor: theme.color, transition: 'width 0.4s' }} />
      </div>
      <div style={{
        width: 16, height: 16, borderRadius: 4,
        background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, color: '#94a3b8', marginTop: 2,
        transition: 'all 0.15s',
      }}
        className="hover:bg-indigo-50 hover:text-indigo-600"
      >
        ▾
      </div>
    </div>
  );
}

// ========== 主组件 ==========
function SwimlaneBoard({
  notes = [],
  categories = [],
  onNoteClick,
  onDelete,
  onTagClick,
  activeCategory,
  onCategoryClick,
  onMoveNote,
}) {
  // 按泳道分组
  const { lanes } = useMemo(() => {
    const orderedCategories = [];
    const catNames = new Set();

    categories.forEach(c => {
      if (notes.some(n => n.category === c.name)) {
        orderedCategories.push(c.name);
        catNames.add(c.name);
      }
    });

    notes.forEach(n => {
      if (n.category && !catNames.has(n.category)) {
        orderedCategories.push(n.category);
        catNames.add(n.category);
      }
    });

    const laneData = orderedCategories.map(catName => {
      const catNotes = notes.filter(n => n.category === catName);
      const stats = {
        total: catNotes.length,
        done: catNotes.filter(n => n.status === 'done').length,
        inProgress: catNotes.filter(n => n.status === 'in_progress').length,
        todo: catNotes.filter(n => n.status === 'todo').length,
        note: catNotes.filter(n => n.status === 'note' || !n.status).length,
      };
      return { category: catName, notes: catNotes, stats };
    });

    const uncategorized = notes.filter(n => !n.category);
    if (uncategorized.length > 0) {
      laneData.push({
        category: null,
        notes: uncategorized,
        stats: {
          total: uncategorized.length,
          done: uncategorized.filter(n => n.status === 'done').length,
          inProgress: uncategorized.filter(n => n.status === 'in_progress').length,
          todo: uncategorized.filter(n => n.status === 'todo').length,
          note: uncategorized.filter(n => n.status === 'note' || !n.status).length,
        },
      });
    }

    return { lanes: laneData };
  }, [notes, categories]);

  const getCellCards = (laneNotes, status) => {
    return laneNotes.filter(n => (n.status || 'note') === status);
  };

  const columnStats = useMemo(() => {
    const stats = {};
    COLUMNS.forEach(col => {
      stats[col.id] = notes.filter(n => (n.status || 'note') === col.id).length;
    });
    return stats;
  }, [notes]);

  return (
    <DndContext onDragEnd={(event) => {
      const { active, over } = event;
      if (!active || !over) return;
      const overData = over.data.current;
      if (!overData || overData.type !== 'swimlane-cell') return;
      const note = active.data.current?.note;
      if (!note) return;
      const cellId = overData.cellId || over.id;
      // cellId: swimlane_{category}_{status}
      const parts = cellId.split('_');
      if (parts.length < 3) return;
      const status = parts.slice(2).join('_');
      let targetCategory = parts.slice(1, -1).join('_');
      if (targetCategory === 'uncategorized') targetCategory = null;
      const currentStatus = note.status || 'note';
      const currentCategory = note.category || null;
      if (targetCategory === currentCategory && status === currentStatus) return;
      onMoveNote?.(note.id, { category: targetCategory, status });
    }}>
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: 16,
      overflow: 'hidden',
      background: '#f8fafc',
    }}>
      <div style={{ minWidth: 800 }}>
        {/* ===== 列头 ===== */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '140px repeat(4, 1fr)',
            background: 'white',
            borderBottom: '2px solid #e2e8f0',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>
            分类 \ 状态
          </div>
          {COLUMNS.map(col => (
            <div key={col.id} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.color, flexShrink: 0 }} />
              {col.title}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                {columnStats[col.id] || 0}
              </span>
            </div>
          ))}
        </div>

        {/* ===== 泳道行 ===== */}
        {lanes.map((lane) => {
          const theme = lane.category ? getLaneTheme(lane.category) : LANE_THEMES[4];
          return (
            <div
              key={lane.category || '__uncategorized__'}
              style={{
                borderBottom: '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: '140px repeat(4, 1fr)',
                background: lane.category && theme.bg !== 'transparent' ? theme.bg : 'transparent',
              }}
              className="last:border-b-0"
            >
              {/* 泳道标签 */}
              <LaneLabel
                category={lane.category}
                stats={lane.stats}
                theme={theme}
                isActive={activeCategory === lane.category}
                onClick={() => onCategoryClick?.(lane.category)}
              />

              {/* 泳道格 */}
              {COLUMNS.map(col => {
                const cellCards = getCellCards(lane.notes, col.id);
                return (
                  <LaneCell
                    key={`${lane.category || 'uncategorized'}_${col.id}`}
                    cellId={`swimlane_${lane.category || 'uncategorized'}_${col.id}`}
                    cards={cellCards}
                    onClick={onNoteClick}
                    onDelete={onDelete}
                    onTagClick={onTagClick}
                    themeColor={theme.color}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
    </DndContext>
  );
}

export { COLUMNS as SWIMLANE_COLUMNS, LANE_THEMES };
export default SwimlaneBoard;
