import React from 'react';
import Toast from './ui/Toast';

export default function ToastContainer({ toasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            autoDismiss={false}
            action={toast.action}
            actionLabel={toast.actionLabel}
            onAction={toast.onAction}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
