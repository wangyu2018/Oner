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
  const title = note.title || extractFirstLine(note.content) || '无标题';
  const preview = getContentPreview(note.content, 60);

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(note);
  };

  const dueDate = note.due_date;
  const isOverdue = dueDate && new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
  const isDueToday = dueDate && new Date(dueDate).toDateString() === new Date().toDateString();

  const doneClass = weight === 'done' ? 'done-state' : '';

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onClick(note)}
      className={`swim-card ${doneClass}`}
      style={dragStyle}
    >
      {/* 删除按钮 */}
      <button onClick={handleDelete} className="swim-delete-btn" title="删除">
        <Trash2 size={9} />
      </button>

      {/* 优先级徽章 */}
      {(p === 'urgent' || p === 'high' || note.subtask_total > 0) && (
        <div className="swim-badges">
          {p === 'urgent' && (
            <span className="badge-urgent">🔴 高优先</span>
          )}
          {p === 'high' && (
            <span className="badge-high">🟠 中优先</span>
          )}
          {note.subtask_total > 0 && (
            <span className="badge-subtask">
              {note.subtask_done || 0}/{note.subtask_total}
            </span>
          )}
        </div>
      )}

      {/* 标题 */}
      <h4 className="swim-title">
        {weight === 'done' ? <s>{title}</s> : title}
      </h4>

      {/* 预览 */}
      {preview && (
        <p className="swim-preview">{preview}</p>
      )}

      {/* 截止日期 */}
      {dueDate && (
        <div className={`swim-due ${isOverdue ? 'overdue' : isDueToday ? 'today' : 'normal'}`}>
          <AlertTriangle size={9} />
          {isOverdue ? `已过期 ${Math.floor((new Date() - new Date(dueDate)) / (1000*60*60*24))}天` : ''}
          {isDueToday && !isOverdue ? '今日截止' : ''}
          {!isOverdue && !isDueToday
            ? new Date(dueDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
            : ''
          }
        </div>
      )}

      {/* 子任务进度条 */}
      {note.subtask_total > 0 && (
        <>
          <div className="swim-subtask-bar">
            <div
              className="swim-subtask-fill"
              style={{ width: `${((note.subtask_done || 0) / note.subtask_total) * 100}%` }}
            />
          </div>
          <div className="swim-subtask-text">
            {note.subtask_done || 0}/{note.subtask_total} 子任务
          </div>
        </>
      )}

      {/* 标签 */}
      {note.tags?.length > 0 && (
        <div className="swim-tags">
          {note.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }}
              className="swim-tag"
            >
              {tag}
            </span>
          ))}
          {note.tags.length > 2 && (
            <span className="swim-tags-more">+{note.tags.length - 2}</span>
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
      className={`lane-cell ${isOver ? 'drop-hover' : ''}`}
    >
      {cards.length === 0 ? (
        <div className={`cell-empty-placeholder ${isOver ? 'hovering' : ''}`}>
          <div className="cell-empty-icon">
            {isOver ? '+' : '—'}
          </div>
        </div>
      ) : (
        <div>
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
      className="lane-label"
      style={{ borderLeftColor: theme.border }}
    >
      <div className="lane-name" style={{ color: theme.color }}>
        <span className="lane-icon" style={{ background: `${theme.color}15`, color: theme.color }}>
          {icon}
        </span>
        {category || '未分类'}
      </div>
      <div className="lane-stats">
        {stats.total} 项 · {stats.done} 完成
      </div>
      <div className="lane-progress-track">
        <div className="lane-progress-fill" style={{ width: `${progress}%`, backgroundColor: theme.color }} />
      </div>
      <div className="lane-collapse-btn">▾</div>
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
    <div className="swim-container">
      <div style={{ minWidth: 800 }}>
        {/* ===== 列头 ===== */}
        <div className="col-header">
          <div className="col-header-cell">
            分类 \ 状态
          </div>
          {COLUMNS.map(col => (
            <div key={col.id} className="col-header-cell">
              <span className="col-dot" style={{ color: col.color, backgroundColor: col.color }} />
              {col.title}
              <span className="col-count-badge">
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
              className="swim-row last:border-b-0"
              style={{
                display: 'grid',
                gridTemplateColumns: '140px repeat(4, 1fr)',
                background: lane.category && theme.bg !== 'transparent' ? theme.bg : 'transparent',
                borderBottom: '1px solid var(--border-default)',
              }}
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
