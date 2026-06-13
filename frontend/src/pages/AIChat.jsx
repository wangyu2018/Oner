import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Send, Trash2, MessageSquare, Loader2, Tag, FileText, Sparkles,
  Lightbulb, Zap, BookOpen, ArrowRight
} from 'lucide-react';
import { api } from '../utils/api';
import MarkdownRenderer from '../components/MarkdownRenderer';
import CommandBar from '../components/CommandBar';
import AIThinkingIndicator from '../components/AIThinkingIndicator';

export default function AIChat() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [thinkingElapsed, setThinkingElapsed] = useState(0);
  const thinkingTimerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamContent, scrollToBottom]);

  useEffect(() => {
    loadConversations();
    api.categories.list().then(res => {
      setCategories(res.data?.categories || []);
    }).catch(() => {});
  }, []);

  const loadConversations = async () => {
    try {
      const res = await api.ai.conversations();
      setConversations(res.data?.conversations || []);
    } catch {}
  };

  const loadConversation = async (id) => {
    try {
      const res = await api.ai.getConversation(id);
      setActiveConv(res.data.conversation);
      setMessages(res.data.conversation.messages || []);
      setSelectedCategory(res.data.conversation.context_id || '');
      setShowSidebar(false);
    } catch {}
  };

  const handleNewConversation = () => {
    setActiveConv(null);
    setMessages([]);
    setSelectedCategory('');
    setShowSidebar(false);
  };

  const handleDeleteConversation = async (id, e) => {
    e.stopPropagation();
    try {
      await api.ai.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConv?.id === id) handleNewConversation();
    } catch {}
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || streaming) return;
    setInput('');

    const userMsg = { role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    const contextType = selectedCategory ? 'category' : 'global';
    const contextId = selectedCategory || undefined;

    // 使用流式输出
    setLoading(true);
    setStreaming(true);
    setStreamContent('');
    setThinkingElapsed(0);
    thinkingTimerRef.current = Date.now();

    let convId = activeConv?.id;
    let fullContent = '';

    try {
      await api.ai.chatStream(
        {
          message: text,
          conversationId: convId,
          contextType,
          contextId,
        },
        (chunk) => {
          fullContent += chunk;
          setStreamContent(fullContent);
          setThinkingElapsed(0); // 收到第一个 chunk 后停止思考计时
        },
        () => {
          setStreaming(false);
          setThinkingElapsed(0);
          setMessages(prev => [...prev, { role: 'assistant', content: fullContent, timestamp: Date.now() }]);
          setStreamContent('');
          loadConversations();
        }
      );
    } catch (err) {
      setStreaming(false);
      setThinkingElapsed(0);
      setStreamContent('');
      setMessages(prev => [...prev, { role: 'assistant', content: `错误：${err.message}`, isError: true, timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  // 思考计时器
  useEffect(() => {
    if (loading && !streamContent && thinkingTimerRef.current) {
      const interval = setInterval(() => {
        setThinkingElapsed(Date.now() - thinkingTimerRef.current);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [loading, streamContent]);

  // 快捷提示
  const quickPrompts = [
    { icon: Lightbulb, text: '帮我整理今天的待办事项', color: 'text-amber-500' },
    { icon: Zap, text: '分析我最近的效率趋势', color: 'text-blue-500' },
    { icon: BookOpen, text: '总结本周的笔记要点', color: 'text-green-500' },
  ];

  const handleQuickPrompt = (text) => {
    setInput(text);
  };

  const handleSummarize = async () => {
    if (!selectedCategory || loading) return;
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: `【总结分类：${selectedCategory}】`, timestamp: Date.now() }]);
    try {
      const res = await api.ai.summarize({ category: selectedCategory });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.summary, timestamp: Date.now() }]);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <CommandBar
        breadcrumb="AI 对话"
        rightContent={
          <>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              title="对话列表"
            >
              <MessageSquare size={16} />
            </button>
            <button
              onClick={handleNewConversation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-accent text-white hover:bg-accent-600 transition-colors"
            >
              <Plus size={16} />
              新对话
            </button>
          </>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* 侧栏 - 对话列表 */}
        <div className={`${showSidebar ? 'block' : 'hidden'} md:block w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto flex-shrink-0`}>
          <div className="p-3 space-y-1">
            {conversations.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">暂无对话</p>
            )}
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  activeConv?.id === conv.id
                    ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <MessageSquare size={14} className="flex-shrink-0" />
                <span className="flex-1 text-sm truncate">{conv.title || '新对话'}</span>
                <button
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 对话区域 */}
        <div className="flex-1 flex flex-col">
          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !streaming && (
              <div className="flex flex-col items-center justify-center h-full">
                {/* Logo + 标题 */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center">
                    <Sparkles size={32} className="text-accent" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-white dark:border-gray-950 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">AI 智能助手</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-8 text-center max-w-sm">
                  结合你的笔记和待办，给出个性化建议
                </p>

                {/* 快捷提示卡片 */}
                <div className="grid gap-2 w-full max-w-sm">
                  {quickPrompts.map((prompt, i) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => handleQuickPrompt(prompt.text)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl
                          bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700
                          hover:border-accent/30 dark:hover:border-accent/30
                          hover:shadow-sm transition-all text-left group"
                      >
                        <Icon size={16} className={prompt.color} />
                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{prompt.text}</span>
                        <ArrowRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-accent transition-colors" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-accent text-white rounded-br-md'
                    : msg.isError
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-bl-md'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm rounded-bl-md'
                }`}>
                  {msg.role === 'assistant' && !msg.isError ? (
                    <div className="markdown-content">
                      <MarkdownRenderer content={msg.content} />
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {/* 流式输出 + 打字机光标 */}
            {streaming && streamContent && (
              <div className="flex justify-start">
                <div className="max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm rounded-bl-md border border-gray-100 dark:border-gray-700">
                  <div className="markdown-content">
                    <MarkdownRenderer content={streamContent} />
                  </div>
                  <span className="inline-block w-0.5 h-4 bg-accent animate-pulse ml-0.5 align-middle" />
                </div>
              </div>
            )}

            {/* AI 思考可视化 */}
            {loading && !streamContent && (
              <AIThinkingIndicator elapsed={thinkingElapsed} />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 - 玻璃态 */}
          <div className="border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            {/* 分类选择 + 总结 */}
            <div className="flex items-center gap-2 mb-2 overflow-x-auto scrollbar-none">
              <Tag size={14} className="text-gray-400 flex-shrink-0" />
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                  !selectedCategory ? 'bg-accent text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                全局
              </button>
              {categories.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name === selectedCategory ? '' : cat.name)}
                  className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                    selectedCategory === cat.name ? 'bg-accent text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
              {selectedCategory && (
                <button
                  onClick={handleSummarize}
                  disabled={loading}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 whitespace-nowrap"
                >
                  <FileText size={12} />
                  总结此分类
                </button>
              )}
            </div>

            {/* 输入框 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedCategory ? `在"${selectedCategory}"分类下提问...` : '输入你的问题...'}
                disabled={loading || streaming}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl
                  bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100
                  placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
              <button
                onClick={handleSend}
                disabled={loading || streaming || !input.trim()}
                className="px-4 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-600 transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
