import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CommandBar from '../components/CommandBar';
import { api } from '../utils/api';

export default function AssociationsPage() {
  const navigate = useNavigate();
  const [allNotes, setAllNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('graph'); // graph | list | suggest

  useEffect(() => {
    api.notes.list({}).then(res => {
      setAllNotes(res.data.notes || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // 计算关联分组
  const associations = useMemo(() => {
    const active = allNotes.filter(n => n.status !== 'done' && n.status !== 'archived');
    if (active.length < 2) return { groups: [], pairs: [], suggestions: [] };

    // 按分类分组
    const categoryMap = {};
    active.forEach(n => {
      const cat = n.category || '未分类';
      if (!categoryMap[cat]) categoryMap[cat] = [];
      categoryMap[cat].push(n);
    });

    // 找出关联对（同分类的笔记组合）
    const pairs = [];
    const catEntries = Object.entries(categoryMap).filter(([, notes]) => notes.length >= 2);
    catEntries.forEach(([cat, notes]) => {
      for (let i = 0; i < notes.length; i++) {
        for (let j = i + 1; j < notes.length; j++) {
          const a = notes[i];
          const b = notes[j];
          // 计算关联度
          let score = 60;
          // 同分类 +20
          score += 20;
          // 同标签 +10
          const aTags = a.tags || [];
          const bTags = b.tags || [];
          const sharedTags = aTags.filter(t => bTags.includes(t));
          score += sharedTags.length * 10;
          // 时间接近 +10
          if (a.created_at && b.created_at) {
            const diff = Math.abs(new Date(a.created_at) - new Date(b.created_at));
            if (diff < 86400000) score += 10; // 1天内
            else if (diff < 604800000) score += 5; // 1周内
          }
          // 优先级匹配 +5
          if (a.priority && b.priority && a.priority === b.priority) score += 5;
          // 内容关键词匹配（标题/内容中的共同词）+5
          const aWords = new Set(((a.title || '') + (a.content || '')).split(/[\s,，、。.：:;；]+/));
          const bWords = new Set(((b.title || '') + (b.content || '')).split(/[\s,，、。.：:;；]+/));
          const common = [...aWords].filter(w => w.length > 1 && bWords.has(w));
          score += Math.min(common.length * 3, 10);

          score = Math.min(score, 99);

          // 生成关联理由
          const reasons = [];
          reasons.push(`同分类「${cat}」`);
          if (sharedTags.length > 0) reasons.push(`共同标签「${sharedTags.join('」「')}」`);
          if (a.created_at && b.created_at) {
            const diff = Math.abs(new Date(a.created_at) - new Date(b.created_at));
            if (diff < 86400000) reasons.push('创建时间接近');
          }
          if (a.priority && b.priority && a.priority === b.priority && a.priority === 'urgent') {
            reasons.push('同为紧急事项');
          }

          pairs.push({
            a, b,
            score,
            category: cat,
            sharedTags,
            reasons: reasons.length > 0 ? reasons.join('，') : '内容语义关联',
            strength: score >= 80 ? '强关联' : score >= 60 ? '中关联' : '弱关联',
            strengthColor: score >= 80 ? 'red' : score >= 60 ? 'amber' : 'blue',
          });
        }
      }
    });

    // 按关联度排序
    pairs.sort((a, b) => b.score - a.score);

    // 生成整理建议（取最大的分类组）
    const suggestions = catEntries
      .filter(([, notes]) => notes.length >= 3)
      .map(([cat, notes]) => ({
        category: cat,
        count: notes.length,
        title: notes[0]?.title || notes[0]?.content?.slice(0, 20) || '笔记',
        subs: notes.slice(1, 5).map(n => n.title || n.content?.slice(0, 20) || '笔记'),
      }))
      .sort((a, b) => b.count - a.count);

    return { groups: catEntries, pairs, suggestions };
  }, [allNotes]);

  const tabs = [
    { id: 'graph', label: '🕸 关联图谱' },
    { id: 'list', label: '📋 关联列表' },
    { id: 'suggest', label: '💡 整理建议' },
  ];

  // 图谱视图 — StarLink 星链风格无极画布
  function GraphCanvas() {
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const dragRef = useRef(null);
    const canvasRef = useRef(null);

    if (associations.pairs.length === 0) {
      return (
        <div className="text-center py-16 text-gray-400">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-2xl">🔗</div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">暂未发现关联</p>
          <p className="text-xs text-gray-400 mt-1">给笔记添加分类或标签后，这里会显示关联图谱</p>
        </div>
      );
    }

    const topPair = associations.pairs[0];
    const center = topPair.a;

    const relatedNodes = new Map();
    relatedNodes.set(center.id, center);
    associations.pairs.slice(0, 8).forEach(p => {
      if (!relatedNodes.has(p.a.id) && relatedNodes.size < 8) relatedNodes.set(p.a.id, p.a);
      if (!relatedNodes.has(p.b.id) && relatedNodes.size < 8) relatedNodes.set(p.b.id, p.b);
    });
    const nodes = [...relatedNodes.values()];
    const centerIdx = nodes.findIndex(n => n.id === center.id);

    const CX = 600, CY = 450;
    const R = Math.min(nodes.length * 70, 300);
    const positions = nodes.map((_, i) => {
      if (i === centerIdx) return { x: CX, y: CY };
      const angle = ((i < centerIdx ? i : i - 1) / Math.max(nodes.length - 1, 1)) * Math.PI * 2 - Math.PI / 2;
      return { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) };
    });

    const nodeLabels = nodes.map(n => n.title || n.content?.slice(0, 12) || '笔记');

    const MIN_SCALE = 0.3, MAX_SCALE = 3;

    // 生成星空背景粒子
    const stars = useMemo(() => {
      const arr = [];
      for (let i = 0; i < 100; i++) {
        arr.push({
          id: i,
          x: Math.random() * 1200,
          y: Math.random() * 900,
          r: Math.random() * 1.8 + 0.3,
          opacity: Math.random() * 0.5 + 0.15,
          delay: Math.random() * 5,
          dur: Math.random() * 2.5 + 1.5,
        });
      }
      return arr;
    }, []);

    const handlePointerDown = useCallback((e) => {
      if (e.target === canvasRef.current || e.target.closest('svg')) {
        dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
        canvasRef.current.setPointerCapture(e.pointerId);
      }
    }, [offset]);

    const handlePointerMove = useCallback((e) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        canvasRef.current.style.cursor = 'grabbing';
      }
      setOffset({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy });
    }, []);

    const handlePointerUp = useCallback(() => {
      if (dragRef.current) canvasRef.current.style.cursor = 'grab';
      dragRef.current = null;
    }, []);

    const handleWheel = useCallback((e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.88 : 1 / 0.88;
      setScale(prev => {
        const next = prev * delta;
        if (next < MIN_SCALE) return MIN_SCALE;
        if (next > MAX_SCALE) return MAX_SCALE;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          setOffset(o => ({
            x: mx - (mx - o.x) * (next / prev),
            y: my - (my - o.y) * (next / prev),
          }));
        }
        return next;
      });
    }, []);

    // 连接线
    const lines = nodes.map((_, i) => {
      if (i === centerIdx) return null;
      const pair = associations.pairs.find(p =>
        (p.a.id === nodes[centerIdx].id && p.b.id === nodes[i].id) ||
        (p.b.id === nodes[centerIdx].id && p.a.id === nodes[i].id)
      );
      const isStrong = pair && pair.score >= 70;
      return { i, isStrong, score: pair?.score || 50 };
    }).filter(Boolean);

    return (
      <div
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        className="rounded-xl overflow-hidden select-none"
        style={{
          minHeight: 500,
          cursor: 'grab',
          touchAction: 'none',
          position: 'relative',
          background: 'linear-gradient(135deg, #050814 0%, #0c0824 30%, #1a0a3e 60%, #0a0e20 100%)',
        }}
      >
        {/* 星云光晕 */}
        <div className="absolute pointer-events-none" style={{
          zIndex: 0, inset: 0,
          background: 'radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(168,85,247,0.05) 0%, transparent 50%)',
        }} />

        {/* 星星粒子 */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          {stars.map(s => (
            <div
              key={s.id}
              className="absolute rounded-full bg-white"
              style={{
                left: s.x, top: s.y,
                width: s.r, height: s.r,
                opacity: s.opacity,
                boxShadow: s.r > 1.5 ? '0 0 3px rgba(255,255,255,0.4)' : 'none',
                animation: `starTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite alternate`,
              }}
            />
          ))}
        </div>

        {/* 操作提示 */}
        <div className="absolute top-3 left-3 z-30 text-[10px] flex items-center gap-2.5 pointer-events-none">
          <span className="text-white/40">🖱 拖拽平移 · 滚轮缩放</span>
          <span className="text-white/20">|</span>
          <span className="font-mono text-purple-300/80">{Math.round(scale * 100)}%</span>
        </div>

        {/* 画布内容 */}
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            width: 1200, height: 900,
            position: 'relative',
          }}
        >
          {/* SVG 连接线 — 带辉光滤镜 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }}>
            <defs>
              <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="lineGlowStrong" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {lines.map(({ i, isStrong }) => (
                <linearGradient key={i} id={`lineGrad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={isStrong ? '#a855f7' : '#6366f1'} stopOpacity={isStrong ? 0.7 : 0.3} />
                  <stop offset="100%" stopColor={isStrong ? '#7c3aed' : '#818cf8'} stopOpacity={isStrong ? 0.5 : 0.15} />
                </linearGradient>
              ))}
            </defs>
            {lines.map(({ i, isStrong, score }) => (
              <line
                key={i}
                x1={positions[centerIdx].x}
                y1={positions[centerIdx].y}
                x2={positions[i].x}
                y2={positions[i].y}
                stroke={`url(#lineGrad-${i})`}
                strokeWidth={isStrong ? 2.5 : 1.2}
                filter={isStrong ? 'url(#lineGlowStrong)' : 'url(#lineGlow)'}
                strokeLinecap="round"
                style={isStrong ? {
                  animation: `linePulse ${2 + (100 - score) / 20}s ease-in-out infinite`,
                } : undefined}
              />
            ))}
          </svg>

          {/* 节点 */}
          {nodes.map((n, i) => {
            const isCenter = i === centerIdx;
            const pos = positions[i];
            const label = nodeLabels[i];
            const size = isCenter ? 18 : 10;
            const glowSize = isCenter ? 80 : 36;
            return (
              <div
                key={n.id}
                onClick={() => navigate(`/note/${n.id}`)}
                className="absolute cursor-pointer select-none"
                style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)', zIndex: 3 }}
              >
                {/* 光晕层 */}
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: glowSize, height: glowSize,
                    left: '50%', top: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: isCenter
                      ? 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                    animation: isCenter ? 'pulseGlow 3s ease-in-out infinite' : 'none',
                  }}
                />
                {/* 中心节点轨道环 */}
                {isCenter && (
                  <div
                    className="absolute rounded-full border pointer-events-none"
                    style={{
                      width: 70, height: 70,
                      left: '50%', top: '50%',
                      transform: 'translate(-50%, -50%)',
                      borderColor: 'rgba(168,85,247,0.2)',
                      animation: 'orbitRotate 12s linear infinite',
                    }}
                  />
                )}
                {isCenter && (
                  <div
                    className="absolute rounded-full border pointer-events-none"
                    style={{
                      width: 50, height: 50,
                      left: '50%', top: '50%',
                      transform: 'translate(-50%, -50%)',
                      borderColor: 'rgba(168,85,247,0.12)',
                      borderStyle: 'dashed',
                      animation: 'orbitRotate 8s linear infinite reverse',
                    }}
                  />
                )}
                {/* 节点圆 */}
                <div
                  className="absolute rounded-full"
                  style={{
                    width: size, height: size,
                    left: '50%', top: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: isCenter
                      ? 'radial-gradient(circle at 35% 35%, #e0e7ff, #7c3aed)'
                      : 'radial-gradient(circle at 35% 35%, #c4b5fd, #6366f1)',
                    boxShadow: isCenter
                      ? '0 0 12px rgba(168,85,247,0.6), 0 0 40px rgba(168,85,247,0.25)'
                      : '0 0 6px rgba(99,102,241,0.4), 0 0 18px rgba(99,102,241,0.15)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.6)';
                    e.currentTarget.style.boxShadow = isCenter
                      ? '0 0 22px rgba(168,85,247,0.8), 0 0 60px rgba(168,85,247,0.4)'
                      : '0 0 12px rgba(99,102,241,0.7), 0 0 30px rgba(99,102,241,0.3)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                    e.currentTarget.style.boxShadow = isCenter
                      ? '0 0 12px rgba(168,85,247,0.6), 0 0 40px rgba(168,85,247,0.25)'
                      : '0 0 6px rgba(99,102,241,0.4), 0 0 18px rgba(99,102,241,0.15)';
                  }}
                />
                {/* 标签 */}
                <div
                  className="absolute whitespace-nowrap text-xs font-medium pointer-events-none"
                  style={{
                    left: '50%',
                    top: size / 2 + 10,
                    transform: 'translateX(-50%)',
                    color: isCenter ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)',
                    textShadow: '0 0 10px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.6)',
                    maxWidth: 120,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: isCenter ? 13 : 11,
                    fontWeight: isCenter ? 700 : 500,
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        {/* 图例 */}
        <div className="absolute bottom-3 left-0 right-0 text-center text-[10px] flex justify-center gap-5 pointer-events-none z-30">
          <span className="flex items-center gap-1.5 text-white/40">
            <span className="w-4 h-0.5 rounded" style={{
              background: 'linear-gradient(90deg, #a855f7, #7c3aed)',
              boxShadow: '0 0 4px rgba(168,85,247,0.5)',
            }}></span>
            强关联
          </span>
          <span className="flex items-center gap-1.5 text-white/35">
            <span className="w-4 h-0.5 rounded" style={{
              background: 'linear-gradient(90deg, #6366f1, #818cf8)',
              boxShadow: '0 0 2px rgba(99,102,241,0.3)',
              opacity: 0.5,
            }}></span>
            弱关联
          </span>
          <span className="flex items-center gap-1.5 text-white/35">
            <span className="w-2.5 h-2.5 rounded-full" style={{
              background: 'radial-gradient(circle at 35% 35%, #e0e7ff, #7c3aed)',
              boxShadow: '0 0 6px rgba(168,85,247,0.5)',
            }}></span>
            中心节点
          </span>
        </div>

        {/* 关键帧动画 */}
        <style>{`
          @keyframes starTwinkle {
            0% { opacity: 0.08; transform: scale(0.7); }
            100% { opacity: 1; transform: scale(1.3); }
          }
          @keyframes pulseGlow {
            0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.5; }
            50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.5; }
          }
          @keyframes orbitRotate {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }
          @keyframes linePulse {
            0% { opacity: 0.2; }
            50% { opacity: 0.7; }
            100% { opacity: 0.2; }
          }
        `}</style>
      </div>
    );
  }

  // 列表视图
  const renderListView = () => {
    if (associations.pairs.length === 0) {
      return (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">暂无关联数据</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {associations.pairs.slice(0, 12).map((pair, i) => {
          const scoreColor = pair.strengthColor;
          const bgColor = scoreColor === 'red' ? 'bg-red-50 dark:bg-red-900/15' :
            scoreColor === 'amber' ? 'bg-amber-50 dark:bg-amber-900/15' :
            'bg-blue-50 dark:bg-blue-900/15';
          const textColor = scoreColor === 'red' ? 'text-red-600 dark:text-red-400' :
            scoreColor === 'amber' ? 'text-amber-600 dark:text-amber-400' :
            'text-blue-600 dark:text-blue-400';
          const badgeColor = scoreColor === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
            scoreColor === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
            'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';

          const labelA = pair.a.title || pair.a.content?.slice(0, 20) || '无标题';
          const labelB = pair.b.title || pair.b.content?.slice(0, 20) || '无标题';

          return (
            <div key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-900
                border border-gray-200 dark:border-gray-800 shadow-sm cursor-pointer
                hover:border-accent hover:bg-accent/5 transition-all"
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${bgColor} ${textColor}`}>
                {pair.score}%
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                  📝 {labelA}
                  <span className="text-gray-400 mx-1">↔</span>
                  {labelB}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {pair.reasons}
                </p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${badgeColor}`}>
                {pair.strength}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // 整理建议视图
  const renderSuggestView = () => {
    if (associations.suggestions.length === 0) {
      return (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">暂无整理建议</p>
          <p className="text-xs mt-1">添加更多分类笔记后，AI 会给出整理建议</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {associations.suggestions.slice(0, 3).map((sg, i) => (
          <div key={i} className="p-5 rounded-xl bg-white dark:bg-gray-900
            border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600
                flex items-center justify-center text-white text-[8px]">✦</span>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">AI 整理建议</span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              发现 <strong className="text-gray-800 dark:text-gray-200">{sg.count} 条备忘</strong> 均与「{sg.category}」高度相关，
              建议整理为 <strong className="text-gray-800 dark:text-gray-200">「{sg.category}」任务列表</strong>：<br /><br />
              &nbsp;&nbsp;📝 {sg.title} → 作为父任务<br />
              {sg.subs.map((sub, j) => (
                <span key={j}>&nbsp;&nbsp;📄 {sub} → 作为子任务<br /></span>
              ))}
              <br />
              ✨ 整理后可在看板中统一管理，提升执行效率。
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => handleOrganize(sg)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold
                bg-gradient-to-r from-violet-500 to-indigo-600 text-white
                hover:opacity-90 transition-all active:scale-[0.98]"
              >
                ✨ 一键整理为任务
              </button>
              <button onClick={() => navigate('/ai/chain')}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold
                border border-gray-200 dark:border-gray-700
                text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800
                hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                🧠 查看思维链
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 一键整理为任务
  const handleOrganize = useCallback(async (sg) => {
    try {
      // 先创建父任务
      const parentRes = await api.notes.create({
        title: sg.title,
        content: `${sg.count} 条备忘整理为任务列表`,
        category: sg.category,
        status: 'todo',
      });
      const parentNote = parentRes.data?.note || parentRes.note;
      if (!parentNote) return;

      // 创建子任务
      await Promise.all(sg.subs.map(sub =>
        api.notes.create({
          title: sub,
          category: sg.category,
          status: 'todo',
          parent_id: parentNote.id,
        })
      ));

      // 提示用户刷新
      alert(`✅ 已创建任务「${sg.title}」及 ${sg.subs.length} 个子任务，可前往首页查看`);
    } catch (err) {
      console.error('整理失败:', err);
      alert('❌ 整理失败: ' + err.message);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <CommandBar
        breadcrumb="智能关联"
        showBack={true}
      />

      <main className="max-w-3xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">加载中...</div>
        ) : (
          <>
            {/* View tabs */}
            <div className="flex gap-1 mb-5 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all
                    ${viewMode === tab.id
                      ? 'bg-white dark:bg-gray-700 text-accent shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  {tab.label}
                  {tab.id === 'list' && ` (${associations.pairs.length})`}
                  {tab.id === 'suggest' && ` (${associations.suggestions.length})`}
                </button>
              ))}
            </div>

            {/* Render current view */}
            <div className="transition-all duration-200">
              {viewMode === 'graph' && <GraphCanvas />}
              {viewMode === 'list' && renderListView()}
              {viewMode === 'suggest' && renderSuggestView()}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
