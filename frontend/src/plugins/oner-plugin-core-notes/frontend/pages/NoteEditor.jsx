/**
 * 核心笔记 - NoteEditor 占位
 * 实际功能待迁移自 frontend/src/pages/ViewNote.jsx
 */
import React from 'react';
import { useParams } from 'react-router-dom';

export default function NoteEditor() {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">✏️ 编辑笔记</h1>
      <p className="text-gray-500">笔记 ID: {id}</p>
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm">编辑器功能迁移中...</p>
      </div>
    </div>
  );
}
