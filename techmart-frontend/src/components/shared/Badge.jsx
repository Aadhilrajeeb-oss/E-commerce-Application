import React from 'react';

const Badge = ({ variant = 'default', children }) => {
  const variants = {
    default: 'bg-gray-800 text-gray-300 border-gray-700',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]',
  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${selectedVariant}`}>
      {children}
    </span>
  );
};

export default Badge;
