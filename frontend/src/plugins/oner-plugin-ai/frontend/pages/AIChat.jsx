/**
 * AI 智能助手 - AIChat 占位
 * 实际功能待迁移自 frontend/src/pages/AIChat.jsx
 */
import React from 'react';

export default function AIChat() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🤖 AI 智能助手</h1>
      <p className="text-gray-500">此页面由 AI 插件提供</p>
      <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <p className="text-sm mb-2">功能迁移中，当前支持：</p>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
          <li>AI 对话</li>
          <li>笔记润色</li>
          <li>智能总结</li>
          <li>内容拆解</li>
        </ul>
      </div>
    </div>
  );
}
