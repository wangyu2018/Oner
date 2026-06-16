import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../utils/api';

const STORAGE_KEY = 'oner_ai_chat_history';
const MAX_STORED = 50; // 最多保留 50 条对话消息

/**
 * AI 对话 hook — 统一管理对话上下文、消息历史、流式输出
 * @param {Object} options
 * @param {string} options.noteId - 关联的笔记 ID（可选）
 * @param {string} options.contextType - 上下文类型 'note' | 'category' | 'global'
 * @param {string} options.contextId - 上下文 ID
 */
export function useAIChat({ noteId, contextType = 'global', contextId } = {}) {
  // 对话消息列表（当前会话）
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const abortRef = useRef(null);

  // localStorage key（按 noteId 隔离）
  const storageKey = noteId
    ? `${STORAGE_KEY}_${noteId}`
    : `${STORAGE_KEY}_global`;

  // 从 localStorage 恢复对话
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          setMessages(parsed.messages.slice(-MAX_STORED));
          setConversationId(parsed.conversationId || null);
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  // 持久化到 localStorage
  const persistMessages = useCallback(
    (msgs, convId) => {
      try {
        const toStore = {
          messages: msgs.slice(-MAX_STORED),
          conversationId: convId,
          updatedAt: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(toStore));
      } catch {
        // storage full — ignore
      }
    },
    [storageKey]
  );

  // 发送消息（非流式）
  const sendMessage = useCallback(
    async (message) => {
      if (!message?.trim() || loading) return;
      setLoading(true);

      const userMsg = { role: 'user', content: message.trim(), timestamp: Date.now() };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);

      try {
        const res = await api.ai.chat({
          message: message.trim(),
          conversationId,
          contextType,
          contextId: contextId || noteId,
        });
        const reply = res.data?.reply || '抱歉，AI 暂无回复。';
        const convId = res.data?.conversationId || conversationId;
        const assistantMsg = { role: 'assistant', content: reply, timestamp: Date.now() };
        const finalMessages = [...newMessages, assistantMsg];
        setMessages(finalMessages);
        setConversationId(convId);
        persistMessages(finalMessages, convId);
      } catch (err) {
        const errMsg = { role: 'assistant', content: `❌ 请求失败: ${err.message}`, timestamp: Date.now(), error: true };
        const finalMessages = [...newMessages, errMsg];
        setMessages(finalMessages);
        persistMessages(finalMessages, conversationId);
      } finally {
        setLoading(false);
      }
    },
    [messages, conversationId, contextType, contextId, noteId, loading, persistMessages]
  );

  // 发送消息（流式）
  const sendStreamMessage = useCallback(
    async (message) => {
      if (!message?.trim() || loading || streaming) return;
      setLoading(true);
      setStreaming(true);
      setStreamContent('');

      const userMsg = { role: 'user', content: message.trim(), timestamp: Date.now() };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);

      let fullContent = '';
      try {
        await api.ai.chatStream(
          {
            message: message.trim(),
            conversationId,
            contextType,
            contextId: contextId || noteId,
          },
          (chunk) => {
            fullContent += chunk;
            setStreamContent(fullContent);
          },
          () => {
            // onDone
            const assistantMsg = { role: 'assistant', content: fullContent, timestamp: Date.now() };
            const finalMessages = [...newMessages, assistantMsg];
            setMessages(finalMessages);
            setStreamContent('');
            setStreaming(false);
            setLoading(false);
            // conversationId 可能从后端返回，此处暂不更新（流式不返回 convId）
            persistMessages(finalMessages, conversationId);
          }
        );
      } catch (err) {
        const errMsg = { role: 'assistant', content: `❌ 请求失败: ${err.message}`, timestamp: Date.now(), error: true };
        const finalMessages = [...newMessages, errMsg];
        setMessages(finalMessages);
        setStreamContent('');
        setStreaming(false);
        setLoading(false);
        persistMessages(finalMessages, conversationId);
      }
    },
    [messages, conversationId, contextType, contextId, noteId, loading, streaming, persistMessages]
  );

  // 清空当前对话
  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setStreamContent('');
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    // 如果有 conversationId，也尝试删除后端记录
    if (conversationId) {
      api.ai.deleteConversation(conversationId).catch(() => {});
    }
  }, [storageKey, conversationId]);

  // 从后端加载历史对话
  const loadConversation = useCallback(async (convId) => {
    try {
      setLoading(true);
      const res = await api.ai.getConversation(convId);
      const conv = res.data?.conversation;
      if (conv?.messages) {
        const msgs = conv.messages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        }));
        setMessages(msgs);
        setConversationId(convId);
        persistMessages(msgs, convId);
      }
    } catch (err) {
      console.error('Load conversation error:', err);
    } finally {
      setLoading(false);
    }
  }, [persistMessages]);

  return {
    messages,
    conversationId,
    loading,
    streaming,
    streamContent,
    sendMessage,
    sendStreamMessage,
    clearChat,
    loadConversation,
    setMessages,
  };
}
