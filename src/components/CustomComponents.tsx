import React from 'react';

interface ButtonProps {
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  type?: 'primary' | 'default' | 'text' | 'dashed';
  disabled?: boolean;
  shape?: 'circle' | 'default';
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  className = '',
  icon,
  children,
  style,
  type = 'default',
  disabled = false,
  shape = 'default'
}) => {
  const baseClasses = 'px-4 py-2 transition-colors duration-200';
  const shapeClasses = {
    circle: 'rounded-full w-10 h-10 p-0 flex items-center justify-center',
    default: 'rounded-md'
  };
  const typeClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    default: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    text: 'bg-transparent hover:bg-gray-100 text-gray-800',
    dashed: 'border-2 border-dashed border-gray-300 hover:border-gray-400 bg-transparent text-gray-800'
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${shapeClasses[shape]} ${typeClasses[type]} ${className}`}
      style={style}
      disabled={disabled}
    >
      {icon && <span className={children ? 'mr-2' : ''}>{icon}</span>}
      {children}
    </button>
  );
};

interface InputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  type?: 'text' | 'password' | 'number';
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  style,
  type = 'text',
  disabled = false
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      style={style}
      disabled={disabled}
    />
  );
};

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  className = '',
  style,
  placeholder
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      style={style}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

interface SliderProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Slider: React.FC<SliderProps> = ({
  value = 0,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className = '',
  style
}) => {
  return (
    <input
      type="range"
      value={value}
      onChange={(e) => onChange?.(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${className}`}
      style={style}
    />
  );
};

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  footer
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-xl z-10 w-full max-w-md mx-4">
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">{title}</h3>
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const message = {
  success: (content: string) => {
    // Implement toast notification
    console.log('Success:', content);
  },
  error: (content: string) => {
    // Implement toast notification
    console.error('Error:', content);
  },
  info: (content: string) => {
    // Implement toast notification
    console.info('Info:', content);
  }
}; 