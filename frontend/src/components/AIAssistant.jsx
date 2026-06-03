import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Send, Loader2, ListChecks, Compass, Expand } from 'lucide-react';
import { api } from '../utils/api';
import MarkdownRenderer from './MarkdownRenderer';

const QUICK_ACTIONS = [
  { id: 'decompose', label: '拆解任务', icon: ListChecks, description: '将笔记拆解为具体子任务' },
  { id: 'recommend', label: '推荐行动', icon: Compass, description: '给出下一步行动建议' },
  { id: 'expand', label: '扩展内容', icon: Expand, description: '补充完善笔记内容' },
];

export default function AIAssistant({ noteId, content, title }) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleQuickAction = async (action) => {
    if (loading) return;
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: `【${QUICK_ACTIONS.find(a => a.id === action)?.label}】`, timestamp: Date.now() }]);

    try {
      const res = await api.ai.analyze({ noteId, action });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.result, timestamp: Date.now() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `错误：${err.message}`, isError: true, timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setLoading(true);

    const userMsg = { role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await api.ai.chat({
        message: text,
        conversationId,
        contextType: 'note',
        contextId: noteId,
      });
      setConversationId(res.data.conversationId);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply, timestamp: Date.now() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `错误：${err.message}`, isError: true, timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-100 dark:border-gray-800">
      {/* 折叠按钮 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          AI 助手
        </span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* 展开内容 */}
      {expanded && (
        <div className="px-4 pb-3 space-y-3">
          {/* 快捷操作 */}
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleQuickAction(id)}
                disabled={loading || !noteId}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                  bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300
                  hover:bg-accent-100 dark:hover:bg-accent-900/40 transition-colors disabled:opacity-50"
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* 消息区域 */}
          {messages.length > 0 && (
            <div className="max-h-60 overflow-y-auto space-y-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
              {messages.map((msg, i) => (
                <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-[90%] rounded-lg px-3 py-2 ${
                    msg.role === 'user'
                      ? 'bg-accent text-white'
                      : msg.isError
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}>
                    {msg.role === 'assistant' && !msg.isError ? (
                      <div className="markdown-content text-sm">
                        <MarkdownRenderer content={msg.content} />
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 size={14} className="animate-spin" />
                  思考中...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* 输入框 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="问AI关于这条笔记的问题..."
              disabled={loading}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg
                bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="p-2 rounded-lg bg-accent text-white hover:bg-accent-600 transition-colors disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
