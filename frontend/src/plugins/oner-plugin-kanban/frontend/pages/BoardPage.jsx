/**
 * 看板视图 - BoardPage 占位
 * 实际功能待迁移自 frontend/src/pages/BoardPage.jsx
 */
import React from 'react';

export default function BoardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📋 看板视图</h1>
      <p className="text-gray-500">此页面由看板插件提供</p>
      <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
        <p className="text-sm mb-2">功能迁移中，支持：</p>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
          <li>泳道看板</li>
          <li>拖拽排序</li>
          <li>状态流转</li>
          <li>WIP 限制</li>
        </ul>
      </div>
    </div>
  );
}
