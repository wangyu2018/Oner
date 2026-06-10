import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2 } from 'lucide-react';
import CommandBar from '../components/CommandBar';
import { api } from '../utils/api';

// ====== Node type visual config ======
const NODE_TYPES = {
  root:    { dot: 'w-[14px] h-[14px] bg-[#7F77DD] shadow-[0_0_0_3px_#EEEDFE,0_0_0_5px_rgba(127,119,221,0.15)]',
             card: 'border-l-[#7F77DD] border-[#CECBF6] bg-gradient-to-br from-[#FAFAFF] to-white',
             badge: 'bg-[#EEEDFE] text-[#534AB7]', label: '起点' },
  extend:  { dot: 'w-[11px] h-[11px] bg-[#378ADD] shadow-[0_0_0_2.5px_#E6F1FB]',
             card: 'border-l-transparent',
             badge: 'bg-[#E6F1FB] text-[#185FA5]', label: '延伸' },
  detail:  { dot: 'w-[10px] h-[10px] bg-[#639922] shadow-[0_0_0_2px_#EAF3DE]',
             card: '', badge: 'bg-[#EAF3DE] text-[#27500A]', label: '细化' },
  conclusion: { dot: 'w-[12px] h-[12px] bg-[#D85A30] shadow-[0_0_0_2.5px_#FAECE7]',
             card: 'border-l-[#D85A30] border-[#F5C4B3] bg-gradient-to-br from-[#FFFAF8] to-white',
             badge: 'bg-[#FAECE7] text-[#993C1D]', label: '结论' },
  action:  { dot: 'w-[14px] h-[14px] bg-[#0F6E56] animate-mc-pulse shadow-[0_0_0_3px_#E1F5EE,0_0_0_5px_rgba(15,110,86,0.15)]',
             card: 'border-l-[#0F6E56] border-[#9FE1CB] bg-gradient-to-br from-[#F0FFF8] via-white to-[#E6F1FB]',
             badge: 'bg-[#E1F5EE] text-[#085041]', label: '行动' },
};

// Tag color rotation palette
const TAG_PALETTE = [
  'bg-[#E6F1FB] text-[#185FA5]',
  'bg-[#FAEEDA] text-[#854F0B]',
  'bg-[#EAF3DE] text-[#27500A]',
  'bg-[#FBEAF0] text-[#993556]',
  'bg-[#EEEDFE] text-[#534AB7]',
  'bg-[#E1F5EE] text-[#085041]',
  'bg-[#FFF3E6] text-[#A85F00]',
  'bg-[#E8F4F8] text-[#1A6B7A]',
];

// ====== Build chain nodes from real notes ======
function buildChainNodes(notes) {
  if (!notes || notes.length === 0) return [];

  const sorted = [...notes].sort(
    (a, b) => new Date(a.created_at || a.updated_at) - new Date(b.created_at || b.updated_at)
  );

  const tagColorMap = {};

  function getTagStyle(tag) {
    if (!tagColorMap[tag]) {
      tagColorMap[tag] = TAG_PALETTE[Object.keys(tagColorMap).length % TAG_PALETTE.length];
    }
    return tagColorMap[tag];
  }

  function getContentPreview(text, max = 120) {
    if (!text) return '';
    const cleaned = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return cleaned.length > max ? cleaned.slice(0, max) + '...' : cleaned;
  }

  function getTimeLabel(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (isToday) return '今天 ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${mins}`;
  }

  const nodes = sorted.map((note, idx) => {
    let type;
    const contentLen = (note.content || '').length;
    const titleStr = note.title || '';
    const isInProgress = note.status === 'in_progress' || note.status === 'todo';

    if (idx === 0) {
      type = 'root';
    } else if (idx === sorted.length - 1) {
      type = isInProgress ? 'action' : 'conclusion';
    } else if (isInProgress) {
      type = 'action';
    } else if (contentLen > 80 || titleStr.length > 20) {
      type = 'extend';
    } else {
      type = 'detail';
    }

    // Determine if this is the "current" node (most recent action or last node)
    const isCurrent = idx === sorted.length - 1;

    const tags = (note.tags || []).map(t => ({
      label: typeof t === 'string' ? t : t.label || t.name || '',
      color: getTagStyle(typeof t === 'string' ? t : t.label || t.name || ''),
    }));

    // AI insight bubble for conclusion nodes
    let aiBubble = null;
    if (type === 'conclusion') {
      const childCount = sorted.length - idx - 1;
      aiBubble = `该节点是 "${note.category || '未分类'}" 链中的关键结论点，汇总了 ${idx} 条上游笔记。`;
    }

    return {
      id: note.id,
      type,
      level: Math.min(idx, 2),
      time: getTimeLabel(note.created_at || note.updated_at),
      date: new Date(note.created_at || note.updated_at),
      title: note.title || '无标题',
      content: note.content || '',
      preview: getContentPreview(note.content),
      tags,
      note,
      isCurrent,
      aiBubble,
    };
  });

  return nodes;
}

// ====== Format date to short label ======
function formatDateShort(date) {
  const d = new Date(date);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (isToday) return '今天';
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

export default function MindChainPage() {
  const navigate = useNavigate();
  const [allNotes, setAllNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compact, setCompact] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    api.notes.list({}).then(res => {
      const notes = res.data.notes || [];
      setAllNotes(notes);
      // Default to first category with >= 2 notes
      const cats = getCategories(notes);
      if (cats.length > 0) setSelectedCategory(cats[0]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Get categories with 2+ active notes
  function getCategories(notes) {
    const counts = {};
    notes.filter(n => n.status !== 'archived').forEach(n => {
      const cat = n.category || '未分类';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, c]) => c >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);
  }

  // Build chains
  const chains = useMemo(() => {
    const groups = {};
    allNotes.filter(n => n.status !== 'archived').forEach(n => {
      const cat = n.category || '未分类';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(n);
    });
    return Object.entries(groups)
      .filter(([, notes]) => notes.length >= 2)
      .map(([category, notes]) => ({
        category,
        nodeCount: notes.length,
        nodes: buildChainNodes(notes),
      }))
      .sort((a, b) => b.nodeCount - a.nodeCount);
  }, [allNotes]);

  const activeChain = chains.find(c => c.category === selectedCategory) || chains[0];
  const nodes = activeChain?.nodes || [];
  const chainCategories = chains.map(c => c.category);

  // Compute chain stats
  const chainStats = useMemo(() => {
    if (!nodes.length) return null;
    const span = nodes.length >= 2
      ? Math.round((nodes[nodes.length - 1].date - nodes[0].date) / (1000 * 60 * 60 * 24))
      : 0;
    const branchCount = nodes.filter(n => n.type === 'extend').length;
    return {
      nodes: nodes.length,
      span: span > 0 ? `${span} 天` : '同一天',
      branches: branchCount,
      conclusion: nodes.filter(n => n.type === 'conclusion').length,
    };
  }, [nodes]);

  // SVG connectors — compute based on node positions
  const svgPaths = useMemo(() => {
    if (nodes.length < 2) return [];
    const paths = [];
    // Each node block is ~140px apart (including spacing)
    const nodeSpacing = 150;

    for (let i = 0; i < nodes.length - 1; i++) {
      const fromNode = nodes[i];
      const toNode = nodes[i + 1];
      const fromLevel = fromNode.level;
      const toLevel = toNode.level;

      // X center values based on level
      const baseX = 30;
      const fromX = baseX + fromLevel * 18;
      const toX = baseX + toLevel * 18;
      const fromY = i * nodeSpacing + 40;
      const toY = (i + 1) * nodeSpacing + 40;

      // Color based on type
      let color = '#CECBF6';
      let width = 2.5;
      const dash = 'none';
      if (toNode.type === 'extend') { color = '#B5D4F4'; width = 1.8; }
      else if (toNode.type === 'detail') { color = '#C0DD97'; width = 1.8; }
      else if (toNode.type === 'conclusion') { color = '#F0997B'; width = 1.8; }
      else if (toNode.type === 'action') { color = '#9FE1CB'; width = 2.5; }

      paths.push({
        d: `M${fromX},${fromY} Q${fromX},${(fromY + toY) / 2} ${toX},${toY}`,
        stroke: color,
        strokeWidth: width,
        strokeDasharray: dash !== 'none' ? dash : undefined,
      });
    }
    return paths;
  }, [nodes]);

  // Time marks
  const timeMarks = useMemo(() => {
    return nodes.map((n, i) => ({
      label: formatDateShort(n.date),
      top: i * 150 + 24,
      today: formatDateShort(n.date) === '今天',
    }));
  }, [nodes]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <CommandBar breadcrumb="思维链" showBack={true} />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          <span className="ml-3 text-sm text-gray-400">正在分析笔记关联...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (chains.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <CommandBar breadcrumb="思维链" showBack={true} />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100
            dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-violet-500" />
          </div>
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">暂未形成思维链</h2>
          <p className="text-xs text-gray-500 leading-relaxed mb-6">
            思维链需要同一分类下至少有 2 条笔记才能自动生成。<br />
            尝试为笔记添加分类，AI 会帮你自动串联成思维链条。
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-xs px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600
              text-white font-semibold hover:opacity-90 transition-all"
          >
            回到首页写笔记 →
          </button>
        </div>
      </div>
    );
  }

  const totalLinks = chains.reduce((s, c) => s + c.nodeCount, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <CommandBar breadcrumb="思维链" showBack={true} />

      <main className="max-w-5xl mx-auto px-4 py-4">
        {/* ====== Category Selector ====== */}
        {chainCategories.length > 1 && (
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            {chainCategories.map(cat => {
              const chain = chains.find(c => c.category === cat);
              const active = cat === selectedCategory;
              return (
                <button key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all shrink-0
                    ${active
                      ? 'bg-[#7F77DD] text-white shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-[#7F77DD]'}`}
                >
                  {cat}
                  <span className={`ml-1.5 ${active ? 'text-white/70' : 'text-gray-400'}`}>
                    {chain?.nodeCount || 0}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ====== Chain Container ====== */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-md overflow-hidden">

          {/* ====== Chain Header ====== */}
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800
            bg-gradient-to-r from-[#EEEDFE] to-[#E6F1FB] dark:from-violet-950/40 dark:to-indigo-950/40">
            {/* Top row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7F77DD] to-[#378ADD]
                  flex items-center justify-center text-white text-sm font-bold shadow-md">MC</div>
                <div>
                  <div className="text-sm font-black text-gray-800 dark:text-gray-200">
                    {activeChain?.category || '未分类'} · 思维链
                  </div>
                  <div className="text-[11px] text-gray-500">
                    AI 自动生成 · {chainStats?.nodes || 0} 个节点
                    {chainStats?.span ? ` · ${chainStats.span}` : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCompact(!compact)}
                  className="text-[10px] px-2.5 py-1.5 rounded-lg border border-[rgba(127,119,221,0.3)]
                    bg-white dark:bg-gray-800 text-[#534AB7] dark:text-[#CECBF6]
                    font-semibold hover:bg-[#EEEDFE] dark:hover:bg-violet-900/30 transition-all">
                  {compact ? '展开 ↺' : '压缩 ↻'}
                </button>
              </div>
            </div>
            {/* Stats cards */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { num: String(chainStats?.nodes || 0), label: '节点', color: 'text-[#7F77DD]' },
                { num: chainStats?.span || '-', label: '跨度', color: 'text-[#1D9E75]' },
                { num: String(chainStats?.branches || 0), label: '分支', color: 'text-[#D85A30]' },
                { num: `${chains.length} 链`, label: '总关联链', color: 'text-[#378ADD]' },
              ].map((s, i) => (
                <div key={i} className="bg-white/70 dark:bg-gray-800/60 rounded-lg py-2 px-3 text-center border border-gray-100 dark:border-gray-700/50">
                  <div className={`text-lg font-black ${s.color}`}>{s.num}</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ====== Chain Body ====== */}
          <div className="relative min-h-[300px]">
            {/* Time Axis Rail */}
            <div className="absolute left-0 top-0 bottom-0 w-11 border-r border-gray-100 dark:border-gray-800 z-10">
              {timeMarks.map((m, i) => (
                <div key={i}
                  className={`absolute left-1 text-[9px] font-semibold whitespace-nowrap
                    ${m.today ? 'text-[#0F6E56] font-bold' : 'text-gray-400 dark:text-gray-500'}`}
                  style={{ top: m.top }}>
                  {m.label}
                </div>
              ))}
            </div>

            {/* Nodes Area */}
            <div className="ml-12 relative px-2 py-1">
              {/* SVG Connector Lines */}
              {svgPaths.length > 0 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0"
                  viewBox={`0 0 600 ${Math.max(nodes.length * 150 + 60, 300)}`}
                  preserveAspectRatio="xMinYMin meet"
                  style={{ minHeight: Math.max(nodes.length * 150 + 60, 300) }}>
                  <defs>
                    <filter id="glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  </defs>
                  {svgPaths.map((p, i) => (
                    <path key={i} d={p.d} stroke={p.stroke} strokeWidth={p.strokeWidth}
                      fill="none" strokeLinecap="round"
                      strokeDasharray={p.strokeDasharray} />
                  ))}
                </svg>
              )}

              {/* Render Nodes */}
              {nodes.map((node, idx) => {
                const nt = NODE_TYPES[node.type];
                const isLast = idx === nodes.length - 1;

                return (
                  <React.Fragment key={node.id}>
                    <div className={`flex items-start gap-2.5 relative z-10 mb-3.5
                      ${node.level === 1 ? 'ml-[18px]' : node.level === 2 ? 'ml-[38px]' : ''}`}>

                      {/* Dot */}
                      <div className={`rounded-full shrink-0 ${nt.dot}`} style={{ marginTop: 8 }}></div>

                      {/* Card + possible AI bubble */}
                      <div style={{ flex: 1 }} className="flex gap-2.5">
                        <div
                          onClick={() => navigate(`/note/${node.id}`)}
                          className={`flex-1 rounded-xl border p-3.5 cursor-pointer transition-all
                            hover:shadow-md hover:-translate-y-0.5 ${nt.card}
                            border-gray-200 dark:border-gray-700 dark:bg-gray-900/60
                            ${node.type === 'action' ? '!border-[#9FE1CB] dark:!border-emerald-800/60' : ''}
                            ${node.type === 'detail' ? 'py-2.5 px-3' : ''}`}
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${nt.badge}`}>{nt.label}</span>
                              {node.isCurrent && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#0F6E56] text-white font-bold">当前</span>
                              )}
                            </div>
                            <span className={`text-[10px] text-gray-400 ${node.isCurrent ? '!text-[#0F6E56] font-semibold' : ''}`}>
                              {node.time}
                            </span>
                          </div>

                          {/* Title */}
                          <p className={`text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1
                            ${node.type === 'action' ? '!text-[#085041] dark:!text-emerald-300' : ''}`}>
                            {node.title}
                          </p>

                          {/* Preview (hide in compact mode) */}
                          {!compact && node.preview && (
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-2 whitespace-pre-line">
                              {node.preview}
                            </div>
                          )}

                          {/* Tags */}
                          {node.tags.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                              {node.tags.map((tag, j) => (
                                <span key={j} className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${tag.color}`}>
                                  {tag.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* AI Insight Bubble */}
                        {node.aiBubble && (
                          <div className="hidden sm:block shrink-0 w-40 bg-[#EEEDFE] dark:bg-violet-950/60
                            rounded-xl p-2.5 border border-[#CECBF6] dark:border-violet-800/40 self-stretch">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="w-4 h-4 rounded bg-[#7F77DD] flex items-center justify-center text-white text-[7px] font-bold">AI</span>
                              <span className="text-[9px] font-semibold text-[#534AB7] dark:text-violet-300">洞察</span>
                            </div>
                            <p className="text-[10px] text-[#534AB7] dark:text-violet-300 leading-relaxed">
                              {node.aiBubble}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Branch indicator before extend → detail */}
                    {node.type === 'extend' && (
                      <div className="relative z-10 mb-2 ml-[38px] flex items-center gap-1.5">
                        <div className="w-px h-3 bg-gray-300 dark:bg-gray-600"></div>
                        <div className="h-px flex-1 max-w-[130px] bg-gray-300 dark:bg-gray-600"></div>
                        <span className="text-[9px] text-gray-400">分叉</span>
                      </div>
                    )}

                    {/* Merge indicator before conclusion */}
                    {idx > 0 && nodes[idx].type === 'conclusion' && (
                      <div className="relative z-10 mb-2.5 ml-[56px] flex items-center gap-2">
                        <div className="h-px w-[90px] bg-[#D85A30]"></div>
                        <span className="text-[9px] text-[#D85A30] font-semibold">汇合</span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ====== Footer Actions ====== */}
          <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800
            bg-gray-50/80 dark:bg-gray-800/40 flex flex-wrap gap-2 items-center">
            <button onClick={() => navigate(`/note/${nodes[0]?.id}`)}
              className="text-[10px] px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold
                hover:opacity-90 transition-all active:scale-[0.98]">
              📄 查看全部笔记
            </button>
            {chainCategories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={`text-[10px] px-3 py-1.5 rounded-lg border transition-all
                  ${cat === selectedCategory
                    ? 'bg-[#EEEDFE] border-[#7F77DD] text-[#534AB7]'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ====== Node Type Legend ====== */}
        <div className="mt-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3">节点类型说明</p>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(NODE_TYPES).map(([key, nt]) => (
              <div key={key} className="text-center py-3 px-2 rounded-lg" style={{ background: nt.badge.split(' ')[0] }}>
                <div className="rounded-full mx-auto mb-1.5"
                  style={{ width: 12, height: 12, background: nt.dot.match(/bg-\[#[^\]]+\]/)?.[0] ? nt.dot.match(/bg-\[#[^\]]+\]/)[0].replace(/bg-\[(#.*?)\]/, '$1') : '#999' }}>
                </div>
                <div className="text-[10px] font-bold">{nt.label}</div>
                <div className="text-[9px] text-gray-400 mt-0.5">
                  {key === 'root' ? '第一条笔记' : key === 'extend' ? '内容较多' : key === 'detail' ? '简短备忘' : key === 'conclusion' ? '最后完成' : '进行中'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ====== All Chains Summary ====== */}
        {chains.length > 1 && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-violet-50/60 to-indigo-50/60
            dark:from-violet-950/20 dark:to-indigo-950/20 border border-violet-200 dark:border-violet-800/40">
            <p className="text-xs text-violet-800 dark:text-violet-300 leading-relaxed">
              <strong>当前共 {chains.length} 条思维链：</strong>
              {chains.map((c, i) => (
                <span key={c.category}>
                  「{c.category}」({c.nodeCount} 个节点)
                  {i < chains.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
