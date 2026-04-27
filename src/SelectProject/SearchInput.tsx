import React, { useState, useMemo } from 'react';
import { Pencil } from 'lucide-react';
import { ProjectPopup } from './ProjectPopup';
import projectMockData from './projectMockData.json';

interface SearchInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  popupTitle?: string;
  popupSubtitle?: string;
  data?: any[];
}

export function SearchInput({
  label = "Project",
  placeholder = "Search Project/Sprints/Cycle",
  value: controlledValue,
  onChange: controlledOnChange,
  className = "",
  popupTitle,
  popupSubtitle,
  data
}: SearchInputProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const value = controlledValue !== undefined ? controlledValue : inputValue;
  const onChange = controlledOnChange || ((e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value));

  const suggestions = useMemo(() => {
    if (!value) return [];
    const sourceData = data || projectMockData;
    return sourceData.filter(item => 
      item.title.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 5);
  }, [value, data]);

  const handleSuggestionClick = (title: string) => {
    if (controlledOnChange) {
      // If controlled, we can't directly set the value, but we can simulate the event
      const event = { target: { value: title } } as React.ChangeEvent<HTMLInputElement>;
      controlledOnChange(event);
    } else {
      setInputValue(title);
    }
    setShowSuggestions(false);
  };

  return (
    <>
      <div className={`flex flex-col ${className} relative w-full`}>
        {label && (
          <label>
            {label}
          </label>
        )}
        <div 
          className="bg-[#FAFAFA] border border-[#CCCCCC] rounded-[4px] flex items-center px-3 py-[7px] transition-all duration-200 focus-within:border-[var(--SiteBlue)] focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--SiteBlue)]/10" 
        >
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              onChange(e);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="flex-grow border-0 shadow-none p-0 bg-transparent outline-none text-[14px] text-[#333] placeholder:text-[var(--DisabledGrey)]"
          />
          <Pencil 
            size={14} 
            className="text-[var(--SiteBlue)] cursor-pointer ml-2 opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => setIsPopupOpen(true)}
          />
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 bg-white border w-full shadow-sm z-[1000] max-h-[200px] overflow-y-auto">
            {suggestions.map((item) => (
              <div 
                key={item.id} 
                className="p-2 border-bottom" 
                style={{ fontSize: '13px', cursor: 'pointer' }}
                onClick={() => handleSuggestionClick(item.title)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                {item.title}
              </div>
            ))}
          </div>
        )}
      </div>
      {isPopupOpen && <ProjectPopup 
        title={popupTitle}
        subtitle={popupSubtitle}
        data={data}
        onClose={() => setIsPopupOpen(false)} 
        onSave={(titles) => {
          if (controlledOnChange) {
            const event = { target: { value: titles.join(', ') } } as React.ChangeEvent<HTMLInputElement>;
            controlledOnChange(event);
          } else {
            setInputValue(titles.join(', '));
          }
        }} 
      />}
    </>
  );
}
