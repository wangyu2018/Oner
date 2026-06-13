/**
 * 密码保险库 - PasswordVault 占位
 * 实际功能待迁移自 frontend/src/pages/PasswordVault.jsx
 */
import React from 'react';

export default function PasswordVault() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🔐 密码保险库</h1>
      <p className="text-gray-500">此页面由密码插件提供</p>
      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <p className="text-sm mb-2">功能迁移中，支持：</p>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
          <li>密码安全存储（AES-256）</li>
          <li>强密码生成</li>
          <li>PIN 保护</li>
          <li>自动锁定</li>
        </ul>
      </div>
    </div>
  );
}
