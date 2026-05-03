import React, { useState, useRef, useEffect } from 'react';
import { Download, FileArchive, Database } from 'lucide-react';
import { api } from '../utils/api';

export default function BackupMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Download size={20} className="text-gray-600 dark:text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl
          shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <button
            onClick={() => {
              api.backup.exportZip();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700
              dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <FileArchive size={16} />
            导出 ZIP
          </button>
          <button
            onClick={() => {
              api.backup.downloadDb();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700
              dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
              border-t border-gray-100 dark:border-gray-800"
          >
            <Database size={16} />
            下载数据库
          </button>
        </div>
      )}
    </div>
  );
}
