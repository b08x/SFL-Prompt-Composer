
import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, description, id, className = '', ...props }) => {
  return (
    <div className={`relative flex items-start ${className}`}>
      <div className="flex h-6 items-center">
        <input
          id={id}
          aria-describedby={description ? `${id}-description` : undefined}
          type="checkbox"
          className="h-4 w-4 rounded border-slate-600 bg-slate-700/50 text-violet-600 focus:ring-violet-500 focus:ring-offset-slate-800"
          {...props}
        />
      </div>
      <div className="ml-3 text-sm leading-6">
        <label htmlFor={id} className="font-medium text-slate-200">
          {label}
        </label>
        {description && (
          <p id={`${id}-description`} className="text-slate-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
