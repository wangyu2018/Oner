import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, RotateCcw } from 'lucide-react';

const TYPES = {
  success: {
    icon: CheckCircle,
    borderColor: 'border-l-green-500',
    textClass: 'text-green-700 dark:text-green-300',
    iconColor: 'text-green-500',
    timerColor: 'bg-green-500',
  },
  error: {
    icon: AlertCircle,
    borderColor: 'border-l-red-500',
    textClass: 'text-red-700 dark:text-red-300',
    iconColor: 'text-red-500',
    timerColor: 'bg-red-500',
  },
  warning: {
    icon: AlertTriangle,
    borderColor: 'border-l-amber-500',
    textClass: 'text-amber-700 dark:text-amber-300',
    iconColor: 'text-amber-500',
    timerColor: 'bg-amber-500',
  },
  info: {
    icon: Info,
    borderColor: 'border-l-blue-500',
    textClass: 'text-blue-700 dark:text-blue-300',
    iconColor: 'text-blue-500',
    timerColor: 'bg-blue-500',
  },
  undo: {
    icon: RotateCcw,
    containerClass: 'bg-gray-900 dark:bg-gray-800 text-white border-none',
    textClass: 'text-white',
    iconColor: 'text-white/70',
    timerColor: 'bg-white/30',
  },
};

export default function Toast({
  type = 'info',
  message,
  sub,
  duration = 3000,
  autoDismiss = true,
  onClose,
  action,
  onAction,
  actionLabel,
}) {
  const config = TYPES[type] || TYPES.info;
  const Icon = config.icon;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!autoDismiss || !onClose) return;
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [autoDismiss, duration, onClose]);

  const isUndo = type === 'undo';
  const containerClass = isUndo
    ? config.containerClass
    : `bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-l-4 ${config.borderColor}`;

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-[10px] shadow-md
        animate-toast-in
        ${visible ? 'opacity-100' : 'opacity-0 translate-x-4'}
        transition-all duration-200
        ${containerClass}
        relative overflow-hidden
      `}
    >
      <div className={
        `w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0
        ${isUndo ? 'bg-white/15' : type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
          type === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
          type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30' :
          'bg-blue-100 dark:bg-blue-900/30'}`
      }>
        <Icon size={13} className={config.iconColor} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${config.textClass} ${isUndo ? '' : ''}`}>
          {message}
        </p>
        {sub && (
          <span className="text-[11px] text-gray-400 dark:text-gray-500 block mt-0.5">
            {sub}
          </span>
        )}
      </div>

      {action && onAction && actionLabel && (
        <button
          onClick={onAction}
          className={`px-2.5 py-1 rounded-[8px] text-xs font-semibold transition-all duration-150
            ${isUndo
              ? 'bg-white/15 text-white hover:bg-white/25'
              : type === 'error'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
        >
          {actionLabel}
        </button>
      )}

      {onClose && (
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 200); }}
          className={`p-0.5 rounded transition-colors ${isUndo ? 'text-white/50 hover:text-white/80' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          aria-label="关闭"
        >
          <X size={14} />
        </button>
      )}

      {/* Timer bar */}
      {autoDismiss && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-100 dark:bg-gray-700">
          <div
            className={`h-full rounded-full ${config.timerColor} animate-timer-shrink`}
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      )}
    </div>
  );
}
