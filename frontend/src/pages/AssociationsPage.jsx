import React, { useState, useEffect, useMemo } from 'react';
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

  // 图谱视图
  const renderGraphView = () => {
    if (associations.pairs.length === 0) {
      return (
        <div className="text-center py-16 text-gray-400">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-2xl">🔗</div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">暂未发现关联</p>
          <p className="text-xs text-gray-400 mt-1">给笔记添加分类或标签后，这里会显示关联图谱</p>
        </div>
      );
    }

    // 取关联度最高的笔记作为中心节点
    const topPair = associations.pairs[0];
    const center = topPair.a;

    // 关联节点（去重，最多8个）
    const relatedNodes = new Map();
    relatedNodes.set(center.id, center);
    associations.pairs.slice(0, 8).forEach(p => {
      if (!relatedNodes.has(p.a.id) && relatedNodes.size < 8) relatedNodes.set(p.a.id, p.a);
      if (!relatedNodes.has(p.b.id) && relatedNodes.size < 8) relatedNodes.set(p.b.id, p.b);
    });
    const nodes = [...relatedNodes.values()];
    const centerIdx = nodes.findIndex(n => n.id === center.id);

    // 计算节点位置（中心节点居中，其他围绕排列）
    const positions = nodes.map((_, i) => {
      if (i === centerIdx) return { x: 50, y: 50 };
      const angle = ((i < centerIdx ? i : i - 1) / Math.max(nodes.length - 1, 1)) * Math.PI * 2 - Math.PI / 2;
      return {
        x: 50 + 32 * Math.cos(angle),
        y: 50 + 28 * Math.sin(angle),
      };
    });

    const nodeLabels = nodes.map(n => n.title || n.content?.slice(0, 12) || '笔记');

    return (
      <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm p-4 min-h-[360px] relative overflow-hidden">
        {/* SVG lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {nodes.map((_, i) => {
            if (i === centerIdx) return null;
            const pair = associations.pairs.find(p =>
              (p.a.id === nodes[centerIdx].id && p.b.id === nodes[i].id) ||
              (p.b.id === nodes[centerIdx].id && p.a.id === nodes[i].id)
            );
            const isStrong = pair && pair.score >= 70;
            return (
              <line
                key={i}
                x1={`${positions[centerIdx].x}%`} y1={`${positions[centerIdx].y}%`}
                x2={`${positions[i].x}%`} y2={`${positions[i].y}%`}
                stroke={isStrong ? '#7c3aed' : '#c4b5fd'}
                strokeWidth={isStrong ? 2 : 1.5}
                strokeOpacity={isStrong ? 0.45 : 0.3}
                strokeDasharray={isStrong ? 'none' : '5'}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((n, i) => {
          const isCenter = i === centerIdx;
          return (
            <div
              key={n.id}
              onClick={() => navigate(`/note/${n.id}`)}
              className="absolute px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer
                transition-all hover:scale-105 hover:shadow-md select-none whitespace-nowrap z-10"
              style={{
                left: `calc(${positions[i].x}% - ${nodeLabels[i].length * 4 + 16}px)`,
                top: `calc(${positions[i].y}% - 18px)`,
                background: isCenter
                  ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                  : 'white',
                color: isCenter ? 'white' : '#6366f1',
                border: isCenter ? 'none' : '2px solid #e0e7ff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              {isCenter ? '📌 ' : ''}{nodeLabels[i]}
            </div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-gray-400 flex justify-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-purple-500 inline-block" style={{ opacity: 0.45 }}></span>
            强关联
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 border-t border-dashed border-purple-300 inline-block"></span>
            弱关联
          </span>
        </div>
      </div>
    );
  };

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
              <button className="px-4 py-1.5 rounded-lg text-xs font-semibold
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
              {viewMode === 'graph' && renderGraphView()}
              {viewMode === 'list' && renderListView()}
              {viewMode === 'suggest' && renderSuggestView()}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
