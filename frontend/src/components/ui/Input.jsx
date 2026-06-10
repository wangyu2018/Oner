import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  iconRight: IconRight,
  size = 'md',
  fullWidth = true,
  className = '',
  containerClassName = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base',
  };

  const iconPadding = {
    sm: 'pl-7',
    md: 'pl-9',
    lg: 'pl-10',
  };

  const iconRightPadding = {
    sm: 'pr-7',
    md: 'pr-9',
    lg: 'pr-10',
  };

  const iconSizes = { sm: 12, md: 16, lg: 18 };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon size={iconSizes[size] || 16} />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-lg border transition-all duration-fast
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            outline-none
            ${sizeStyles[size] || sizeStyles.md}
            ${Icon ? (iconPadding[size] || iconPadding.md) : ''}
            ${IconRight ? (iconRightPadding[size] || iconRightPadding.md) : ''}
            ${error
              ? 'border-red-300 dark:border-red-700 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
              : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500'
            }
            ${className}
          `}
          {...props}
        />

        {IconRight && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
            <IconRight size={iconSizes[size] || 16} />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-400">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
