import React, { useState, useRef, useEffect } from 'react';

type SearchType = 'All Words' | 'Any Words' | 'Exact Phrase';

interface ToolbarProps {
  totalCount: number;
  showingCount: number;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  searchType: SearchType;
  onSearchTypeChange: (type: SearchType) => void;
  onAdvancedSearchClick: () => void;
  onSettingsClick: () => void;
  onIconClick: (id: string) => void;
  visibleIcons: string[];
  actions?: React.ReactNode;
}

export const TableToolbar: React.FC<ToolbarProps> = ({
  totalCount,
  showingCount,
  searchQuery,
  onSearchChange,
  searchType,
  onSearchTypeChange,
  onAdvancedSearchClick,
  onSettingsClick,
  onIconClick,
  visibleIcons,
  actions
}) => {
  const [showSearchTypeDropdown, setShowSearchTypeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSearchTypeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ToolbarIcon = ({ id, icon, title, noBorder }: { id: string, icon: string, title: string, noBorder?: boolean }) => {
    if (!visibleIcons.includes(id)) return null;
    return (
      <button 
        className={`bg-transparent ${noBorder ? 'border-0' : 'border-2 border-[#918D8D] hover:border-[var(--SiteBlue)] focus:border-[var(--SiteBlue)] active:border-[var(--SiteBlue)]'} w-8 h-8 p-0 hover:opacity-80 transition-opacity cursor-pointer`} 
        title={title}
        onClick={() => onIconClick(id)}
      >
        <i className={`bi ${icon} text-[#2F5596]`}></i>
      </button>
    );
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-[#F4F4F4] border border-[#DDDDDD] border-b-0 mt-4">
      <span className="text-xs font-medium text-[#333333] ml-1 min-w-max">
        Showing {showingCount} of {totalCount}
      </span>
      
      <div className="flex bg-white border border-[#DDDDDD] rounded-sm items-center px-2 py-0.5 w-[220px] h-8">
        <input 
          type="search" 
          placeholder="Search all"
          className="border-0 shadow-none text-[13px] flex-grow outline-none placeholder-[#918D8D] bg-transparent"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <i className="bi bi-search text-sm text-[#918D8D] ml-1"></i>
      </div>

      <button className="bg-transparent w-8 h-8 p-0 hover:opacity-80 transition-opacity cursor-pointer" onClick={onAdvancedSearchClick} title="Search Settings">
        <i className="bi bi-gear text-[#2F5596]"></i>
      </button>

      <div className="custom-dropdown-container relative" ref={dropdownRef}>
        <div 
          className="custom-dropdown-trigger flex items-center justify-between bg-white border border-[#DDDDDD] rounded-sm px-2 h-8 min-w-[110px] text-xs cursor-pointer" 
          onClick={() => setShowSearchTypeDropdown(!showSearchTypeDropdown)}
        >
          <span className="truncate">{searchType}</span>
          <i className={`bi bi-chevron-down ml-1 text-[#2F5596] ${showSearchTypeDropdown ? 'rotate-180' : ''}`} style={{ transition: 'transform 0.2s' }}></i>
        </div>
        {showSearchTypeDropdown && (
          <div className="custom-dropdown-list absolute top-full left-0 min-w-max bg-white shadow-lg border border-[#DDDDDD] rounded-sm z-[1000] mt-1 p-1">
            {(['All Words', 'Any Words', 'Exact Phrase'] as SearchType[]).map((option) => (
              <div 
                key={option} 
                className={`flex items-center px-2 py-1.5 text-[13px] cursor-pointer rounded-sm whitespace-nowrap ${searchType === option ? 'bg-[#2F5596] text-white' : 'text-[#333333] hover:bg-[#F0F0F0]'}`}
                onClick={() => {
                  onSearchTypeChange(option);
                  setShowSearchTypeDropdown(false);
                }}
              >
                <i className={`bi bi-check2 mr-2 text-base leading-none ${searchType === option ? 'opacity-100' : 'opacity-0'}`}></i>
                {option}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 ml-2">
        {actions}
      </div>

      <div className="ml-auto flex gap-2 items-center">
        <ToolbarIcon id="teams" icon="bi-microsoft-teams" title="Share to MS Teams" />
        <ToolbarIcon id="import" icon="bi-box-arrow-in-right" title="Import Data" />
        <ToolbarIcon id="excel" icon="bi-file-earmark-excel" title="Export to Excel" />
        <ToolbarIcon id="pencil" icon="bi-pencil" title="Quick Edit Mode" />
        <ToolbarIcon id="print" icon="bi-printer" title="Print Table" />
        
        <button className="bg-transparent border-2 border-[#918D8D] hover:border-[var(--SiteBlue)] focus:border-[var(--SiteBlue)] active:border-[var(--SiteBlue)] w-8 h-8 p-0 ml-1 hover:opacity-80 transition-opacity cursor-pointer" onClick={onSettingsClick} title="SmartTable Settings">
          <i className="bi bi-gear text-[#2F5596]"></i>
        </button>
      </div>

      <style>{`
        .rotate-180 { transform: rotate(180deg); }
        .custom-dropdown-item:hover { background-color: #f8fafc; color: #2f5596; }
        .toolbar { border-top-left-radius: 4px; border-top-right-radius: 4px; }
      `}</style>
    </div>
  );
};