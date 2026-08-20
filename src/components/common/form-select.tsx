import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className = "",
  icon
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 rounded-lg border-b-2 bg-muted text-foreground 
          flex items-center justify-between cursor-pointer transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed border-border' : 'border-input hover:border-ring'}
          ${isOpen ? 'border-primary' : ''}
        `}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {icon && <span className="text-muted-foreground flex-shrink-0">{icon}</span>}
          <span className={`truncate ${!selectedOption ? 'text-muted-foreground' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {options.length > 0 ? (
            options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`
                  px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm transition-colors
                  ${option.value === value ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}
                `}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && <Check className="w-4 h-4 flex-shrink-0" />}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              No options
            </div>
          )}
        </div>
      )}
    </div>
  );
}
