import React from 'react';

export default function PageTransition({ children, className = '' }) {
  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
}
