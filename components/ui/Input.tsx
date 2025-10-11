
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  return (
    <input
      className={`block w-full bg-slate-700/50 border-slate-600 rounded-md shadow-sm py-2 px-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm transition ${className}`}
      {...props}
    />
  );
};
