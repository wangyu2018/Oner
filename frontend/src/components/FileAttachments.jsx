import React, { useState, useEffect, useCallback } from 'react';
import { Paperclip, Download, Trash2, FileText, Upload, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(mimeType) {
  return FileText;
}

export default function FileAttachments({ noteId, readOnly = false }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [show, setShow] = useState(false);

  const loadFiles = useCallback(async () => {
    if (!noteId) return;
    try {
      const res = await api.files.list(noteId);
      setFiles(res.data.files);
    } catch (err) {
      console.error('Load files error:', err);
    }
  }, [noteId]);

  useEffect(() => {
    if (noteId && show) loadFiles();
  }, [noteId, show, loadFiles]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('文件大小不能超过 10MB');
      return;
    }
    setUploading(true);
    try {
      const res = await api.files.upload(noteId, file);
      setFiles(prev => [res.data.attachment, ...prev]);
    } catch (err) {
      alert('上传失败: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除此文件？')) return;
    try {
      await api.files.delete(id);
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      alert('删除失败: ' + err.message);
    }
  };

  const handleDownload = async (file) => {
    try {
      await api.files.download(file.id);
    } catch (err) {
      alert('下载失败: ' + err.message);
    }
  };

  return (
    <div className="mt-2">
      <button
        onClick={() => setShow(!show)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <Paperclip size={14} />
        {files.length > 0 ? `${files.length} 个附件` : '附件'}
        {uploading && <Loader2 size={12} className="animate-spin" />}
      </button>

      {show && (
        <div className="mt-2 space-y-1">
          {/* 上传按钮（非只读模式） */}
          {!readOnly && (
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg cursor-pointer transition-colors border border-dashed border-gray-300 dark:border-gray-600">
              <Upload size={14} />
              上传文件 (最大10MB)
              <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          )}

          {/* 文件列表 */}
          {files.map(file => (
            <div key={file.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={14} className="text-gray-400 shrink-0" />
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{file.original_name}</span>
                <span className="text-[10px] text-gray-400 shrink-0">{formatSize(file.size)}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleDownload(file)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="下载">
                  <Download size={12} />
                </button>
                {!readOnly && (
                  <button onClick={() => handleDelete(file.id)}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"
                    title="删除">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
