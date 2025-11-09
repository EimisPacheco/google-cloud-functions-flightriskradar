import React, { useState, useRef, useEffect } from 'react';
import { useDarkMode } from '../../context/DarkModeContext';

interface AutocompleteOption {
  value: string;
  label: string;
  data?: {
    subtitle?: string;
    [key: string]: unknown;
  };
}

interface AutocompleteProps {
  placeholder: string;
  options: AutocompleteOption[];
  onSearch: (query: string) => void;
  onSelect: (option: AutocompleteOption) => void;
  value: string;
  className?: string;
  disabled?: boolean;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  placeholder,
  options,
  onSearch,
  onSelect,
  value,
  className = '',
  disabled = false
}) => {
  const { isDarkMode } = useDarkMode();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onSearch(newValue);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleOptionClick = (option: AutocompleteOption) => {
    setInputValue(option.label);
    onSelect(option);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < options.length) {
          handleOptionClick(options[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleBlur = () => {
    // Delay closing to allow for option clicks
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
    }, 150);
  };

  const handleFocus = () => {
    if (inputValue && options.length > 0) {
      setIsOpen(true);
    }
  };

  // Scroll selected option into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          isDarkMode 
            ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400' 
            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
        } ${disabled ? (isDarkMode ? 'bg-slate-800 cursor-not-allowed' : 'bg-gray-100 cursor-not-allowed') : ''} ${className}`}
        autoComplete="off"
      />
      
      {isOpen && options.length > 0 && (
        <ul
          ref={listRef}
          className={`absolute z-50 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
            isDarkMode 
              ? 'bg-slate-700 border-slate-600' 
              : 'bg-white border-gray-300'
          }`}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              onClick={() => handleOptionClick(option)}
              className={`px-4 py-3 cursor-pointer border-b last:border-b-0 ${
                isDarkMode 
                  ? 'hover:bg-slate-600 border-slate-600' 
                  : 'hover:bg-blue-50 border-gray-100'
              } ${
                index === selectedIndex 
                  ? (isDarkMode ? 'bg-slate-600' : 'bg-blue-100') 
                  : ''
              }`}
            >
              <div className="flex flex-col">
                <span className={`font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {option.label}
                </span>
                {option.data && (
                  <span className={`text-sm ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-500'
                  }`}>
                    {option.data.subtitle}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {isOpen && options.length === 0 && inputValue.length >= 2 && (
        <div className={`absolute z-50 w-full mt-1 border rounded-lg shadow-lg ${
          isDarkMode 
            ? 'bg-slate-700 border-slate-600' 
            : 'bg-white border-gray-300'
        }`}>
          <div className={`px-4 py-3 text-center ${
            isDarkMode ? 'text-slate-300' : 'text-gray-500'
          }`}>
            No results found
          </div>
        </div>
      )}
    </div>
  );
}; 