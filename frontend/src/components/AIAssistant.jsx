import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Lightbulb, BookOpen, PenLine, Loader2, PlugZap, Send, Trash2, MessageSquare } from 'lucide-react';
import { api } from '../utils/api';
import { usePluginManagerContext } from '../App';
import { useAIChat } from '../hooks/useAIChat';

const QUICK_TAGS = [
  '拆解任务', '推荐行动', '扩展内容', '总结要点', '生成标题', '翻译英文', '润色表达',
];

export default function AIAssistant({ noteId, content, title, onContentUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [relatedNotes, setRelatedNotes] = useState([]);
  const [continuations, setContinuations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [activeTab, setActiveTab] = useState('actions'); // 'actions' | 'chat'
  const { isPluginActive } = usePluginManagerContext();
  const aiEnabled = isPluginActive?.('oner.plugin.ai') ?? true;

  // AI 对话 hook
  const chat = useAIChat({ noteId, contextType: noteId ? 'note' : 'global', contextId: noteId });
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const [chatInput, setChatInput] = useState('');

  // 对话滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages, chat.streamContent]);

  // 加载建议
  useEffect(() => {
    if (!expanded || !noteId) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.ai.analyze({ noteId, action: 'suggest' }).catch(() => ({ data: { result: '暂无建议' } })),
      api.notes.list({ limit: 3 }).catch(() => ({ data: { notes: [] } })),
    ]).then(([suggestRes, notesRes]) => {
      if (cancelled) return;
      // 解析建议
      const rawSuggest = suggestRes.data?.result || '';
      const lines = rawSuggest.split('\n').filter(l => l.trim()).slice(0, 4);
      setSuggestions(lines.length > 0 ? lines : ['暂无可用建议，试试拆解任务或扩展内容']);

      // 相关笔记（排除当前笔记）
      const allNotes = notesRes.data?.notes || [];
      setRelatedNotes(allNotes.filter(n => n.id !== noteId).slice(0, 3));

      // 续写建议
      const continuations = [
        '补充更多细节描述...',
        '添加具体的行动步骤...',
        '总结关键要点和结论...',
      ];
      setContinuations(continuations);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [expanded, noteId]);

  const handleTagClick = async (tag) => {
    if (loading || !noteId) return;
    setActiveAction(tag);
    setLoading(true);
    try {
      const actionMap = {
        '拆解任务': 'decompose',
        '推荐行动': 'recommend',
        '扩展内容': 'expand',
        '总结要点': 'summarize',
        '生成标题': 'title',
        '翻译英文': 'translate',
        '润色表达': 'polish',
      };
      const res = await api.ai.analyze({ noteId, action: actionMap[tag] || 'suggest' });
      const result = res.data?.result || '';

      // 将分析结果也追加到对话历史
      if (result.trim()) {
        const actionLabel = tag;
        const chatMsg = `[${actionLabel}] ${result.trim()}`;
        chat.setMessages(prev => [
          ...prev,
          { role: 'assistant', content: chatMsg, timestamp: Date.now(), fromAction: true },
        ]);
      }

      // 润色/扩展/翻译 → 直接输出到编辑器
      if (['polish', 'expand', 'translate'].includes(actionMap[tag]) && onContentUpdate) {
        const polished = result.trim();
        if (polished && polished.length > 10) {
          onContentUpdate(polished);
          setSuggestions([`✅ ${tag}已应用到编辑器`]);
        } else {
          setSuggestions([`⚠️ ${tag}结果太短，请重试`]);
        }
      } else if (actionMap[tag] === 'title' && onContentUpdate) {
        // 生成标题不覆盖内容，只显示
        setSuggestions([`📝 建议标题: ${result.trim()}`]);
      } else {
        setSuggestions([`✅ ${tag}完成:`, ...result.split('\n').filter(l => l.trim()).slice(0, 4)]);
      }
    } catch {
      setSuggestions([`❌ ${tag}失败，请重试`]);
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  const handleContinuation = (text) => {
    // 续写建议追加到编辑器内容末尾
    if (onContentUpdate && content) {
      onContentUpdate(content + '\n\n' + text.replace('...', ''));
    }
  };

  // 发送聊天消息
  const handleSendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chat.loading || chat.streaming) return;
    setChatInput('');
    await chat.sendStreamMessage(msg);
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  // AI 插件已停用
  if (!aiEnabled) {
    return (
      <div className="border-t border-gray-100 dark:border-gray-800">
        <div className="h-10 flex items-center gap-2 px-4 opacity-40 cursor-not-allowed">
          <PlugZap size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">AI 助手</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-400 rounded">已停用</span>
          <span className="ml-auto text-[10px] text-gray-400">前往设置启用</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 dark:border-gray-800">
      {/* 折叠态：40px 渐变条 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full h-10 flex items-center gap-2 px-4
          bg-gradient-to-r from-violet-50/80 via-white to-indigo-50/80
          dark:from-violet-950/20 dark:via-gray-900 dark:to-indigo-950/20
          hover:from-violet-100/80 hover:to-indigo-100/80
          transition-all duration-200 group"
      >
        <span className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600
          flex items-center justify-center shadow-sm flex-shrink-0">
          <Sparkles size={11} className="text-white" />
        </span>
        <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
          AI 助手
        </span>
        {/* Tab 切换 */}
        <span
          onClick={(e) => { e.stopPropagation(); setActiveTab('actions'); }}
          className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors cursor-pointer
            ${activeTab === 'actions'
              ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
              : 'bg-white/80 dark:bg-gray-800/60 text-gray-500 hover:text-violet-500'
            }`}
        >
          <Lightbulb size={10} className="mr-0.5" /> 快捷
        </span>
        <span
          onClick={(e) => { e.stopPropagation(); setActiveTab('chat'); }}
          className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors cursor-pointer
            ${activeTab === 'chat'
              ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
              : 'bg-white/80 dark:bg-gray-800/60 text-gray-500 hover:text-violet-500'
            }`}
        >
          <MessageSquare size={10} className="mr-0.5" /> 对话{chat.messages.length > 0 ? ` (${chat.messages.length})` : ''}
        </span>
        {/* 快速标签 chip — 仅在 actions tab 显示 */}
        {activeTab === 'actions' && QUICK_TAGS.slice(0, 2).map(tag => (
          <span key={tag}
            onClick={(e) => { e.stopPropagation(); handleTagClick(tag); }}
            className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium
              bg-white/80 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300
              border border-gray-200/50 dark:border-gray-700/50
              hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200
              transition-colors cursor-pointer"
          >
            {tag}
          </span>
        ))}
        <span className="ml-auto text-[11px] text-gray-400 flex items-center gap-0.5">
          {expanded ? '收起' : '展开'}
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </button>

      {/* 展开态 */}
      {expanded && activeTab === 'actions' && (
        <div className="h-[200px] grid grid-cols-3 gap-0 border-t border-gray-100 dark:border-gray-800
          bg-gray-50/50 dark:bg-gray-900/50 overflow-hidden">

          {/* 列1: 建议标签云 */}
          <div className="p-3 border-r border-gray-100 dark:border-gray-800 overflow-y-auto">
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb size={12} className="text-amber-500" />
              <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">快捷操作</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  disabled={loading}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all
                    ${activeAction === tag
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-violet-300 hover:text-violet-600'
                    }
                    disabled:opacity-50`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {/* AI 建议结果 */}
            {loading && (
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400">
                <Loader2 size={11} className="animate-spin" />
                思考中...
              </div>
            )}
            {suggestions.length > 0 && !loading && (
              <div className="mt-2 space-y-1">
                {suggestions.map((s, i) => (
                  <p key={i} className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    {s}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* 列2: 相关笔记 */}
          <div className="p-3 border-r border-gray-100 dark:border-gray-800 overflow-y-auto">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen size={12} className="text-blue-500" />
              <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">相关笔记</span>
            </div>
            {relatedNotes.length > 0 ? (
              <div className="space-y-1.5">
                {relatedNotes.map(note => (
                  <div key={note.id}
                    className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700
                      cursor-pointer hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                  >
                    <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300 line-clamp-1">
                      {note.title || '无标题'}
                    </p>
                    <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                      {note.content?.slice(0, 40) || ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400">暂无相关笔记</p>
            )}
          </div>

          {/* 列3: 续写建议 */}
          <div className="p-3 overflow-y-auto">
            <div className="flex items-center gap-1.5 mb-2">
              <PenLine size={12} className="text-emerald-500" />
              <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">续写建议</span>
            </div>
            <div className="space-y-1.5">
              {continuations.map((text, i) => (
                <button
                  key={i}
                  onClick={() => handleContinuation(text)}
                  className="w-full text-left p-2 rounded-lg bg-white dark:bg-gray-800
                    border border-gray-100 dark:border-gray-700
                    text-[11px] text-gray-600 dark:text-gray-300
                    hover:border-emerald-200 dark:hover:border-emerald-800
                    hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10
                    transition-colors cursor-pointer"
                >
                  <span className="text-emerald-500 mr-1">+</span>
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 对话 Tab */}
      {expanded && activeTab === 'chat' && (
        <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          {/* 消息区域 */}
          <div className="h-[180px] overflow-y-auto px-3 py-2 space-y-2">
            {chat.messages.length === 0 && !chat.streaming && (
              <p className="text-[11px] text-gray-400 text-center py-4">
                对话历史会自动保留，试试发送消息吧
              </p>
            )}
            {chat.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-2.5 py-1.5 rounded-lg text-[11px] leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300'
                    : msg.error
                      ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700'
                  }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.fromAction && (
                    <span className="text-[9px] text-violet-400 mt-0.5 block">来自快捷操作</span>
                  )}
                </div>
              </div>
            ))}
            {/* 流式输出中 */}
            {chat.streaming && chat.streamContent && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-2.5 py-1.5 rounded-lg text-[11px] leading-relaxed
                  bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                  <p className="whitespace-pre-wrap">{chat.streamContent}</p>
                  <span className="inline-block w-1 h-3 bg-violet-500 animate-pulse ml-0.5" />
                </div>
              </div>
            )}
            {chat.loading && !chat.streaming && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <Loader2 size={11} className="animate-spin" /> 思考中...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          {/* 输入栏 */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100 dark:border-gray-800">
            <input
              ref={chatInputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder="输入问题..."
              className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700 outline-none
                focus:border-violet-300 dark:focus:border-violet-700 transition-colors"
            />
            <button
              onClick={handleSendChat}
              disabled={!chatInput.trim() || chat.loading || chat.streaming}
              className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30
                text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50
                disabled:opacity-40 transition-colors"
            >
              <Send size={12} />
            </button>
            {chat.messages.length > 0 && (
              <button
                onClick={chat.clearChat}
                title="清空对话"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
