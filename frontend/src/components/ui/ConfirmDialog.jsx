import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = '确认操作',
  description = '确定要执行此操作吗？',
  confirmLabel = '确认',
  cancelLabel = '取消',
  variant = 'danger',
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in-fast" />

      {/* Dialog */}
      <div
        className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-[14px] shadow-md
          border border-gray-200 dark:border-gray-700 p-6 animate-scale-in-fast"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        {variant === 'danger' && (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
        )}

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
          {description}
        </p>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-[10px] text-xs font-medium
              border border-gray-200 dark:border-gray-600
              bg-white dark:bg-gray-700
              text-gray-700 dark:text-gray-300
              hover:bg-gray-50 dark:hover:bg-gray-600
              transition-all duration-150"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-[10px] text-xs font-medium
              bg-red-500 hover:bg-red-600 disabled:bg-red-400
              text-white transition-all duration-150
              active:scale-[0.97] flex items-center gap-1.5"
          >
            {loading && (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
            )}
            {confirmLabel}
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg
            text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
