import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Search, 
  Settings, 
  ChevronRight, 
  ChevronDown, 
  MoreHorizontal, 
  FileText, 
  FileSpreadsheet, 
  Brush, 
  Printer, 
  ChevronUp,
  Users,
  ExternalLink
} from 'lucide-react';
import { SmartTable } from '../GlobalCommonTable/Table/SmartTable';
import { ColumnSetting, TableSettings } from '../GlobalCommonTable/Table/TableTypes';
import { UserPopup } from './UserPopup';
import EditProjectPopup from './EditProjectPopup';
import { CreateSprintPopup } from './CreateSprintPopup';
import projectMockData from './projectMockData.json';

const USER_NAMES: Record<string, string> = {
  'avatar1': 'John Doe',
  'avatar2': 'Jane Smith',
  'avatar3': 'Robert Brown',
  'avatar4': 'Emily Davis',
  'avatar5': 'Michael Wilson',
};

const MOCK_CATEGORY_DATA = [
  { id: 'cat1', label: 'Development', icon: '💻', children: ['React', 'TypeScript', 'Node.js'] },
  { id: 'cat2', label: 'Design', icon: '🎨', children: ['UI/UX', 'Figma', 'Branding'] },
];

const MOCK_TEAM_MEMBERS = Object.entries(USER_NAMES).map(([id, name]) => ({
  id,
  name,
  team: 'Engineering',
  avatar: `https://picsum.photos/seed/${id}/20/20`
}));

const DEFAULT_SETTINGS: TableSettings = {
  showHeader: true,
  showColumnFilter: true,
  showAdvancedSearch: true,
  tableHeight: 'Flexible',
  visibleIcons: ['teams', 'import', 'excel', 'clear', 'print'],
  columns: [
    { id: 'id', key: 'id', label: 'ID', visible: true, width: 120, order: 1 },
    { id: 'title', key: 'title', label: 'Title', visible: true, width: 300, order: 2 },
    { id: 'clientCategory', key: 'clientCategory', label: 'Client Cate', visible: true, width: 120, order: 3 },
    { id: 'team', key: 'team', label: 'Team', visible: true, width: 150, order: 4 },
    { id: 'workingAction', key: 'workingAction', label: 'Working Action', visible: true, width: 120, order: 5 },
    { id: 'status', key: 'status', label: 'Sta', visible: true, width: 80, order: 6 },
    { id: 'items', key: 'items', label: 'Iter', visible: true, width: 80, order: 7 },
    { id: 'dueDate', key: 'dueDate', label: 'Due Date', visible: true, width: 120, order: 8 },
  ]
};

interface ProjectPopupProps {
  onClose: () => void;
  onSave: (selectedTitles: string[]) => void;
  title?: string;
  subtitle?: string;
  data?: any[];
}

export function ProjectPopup({ 
  onClose, 
  onSave, 
  title = "Select Project", 
  subtitle = "Search and select projects to link with your meeting.",
  data: propsData
}: ProjectPopupProps) {
  const [data, setData] = useState<any[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSingleSelect, setIsSingleSelect] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('All Words');
  const [selectedSearchFields, setSelectedSearchFields] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [popupData, setPopupData] = useState<{ users: string[], position: { top: number, left: number } } | null>(null);
  const popupTimer = React.useRef<NodeJS.Timeout | null>(null);
  const [tableSettings, setTableSettings] = useState<TableSettings>(DEFAULT_SETTINGS);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const showPopup = (users: string[], position: { top: number, left: number }) => {
    if (popupTimer.current) clearTimeout(popupTimer.current);
    setPopupData({ users, position });
  };

  const renderCell = (item: any, column: ColumnSetting) => {
    switch (column.key) {
      case 'id':
        return (
          <div className="flex items-center gap-2">
            <div 
              className="rounded-full bg-[var(--SiteBlue)] text-white flex items-center justify-center" 
              style={{ width: '18px', height: '18px', fontSize: '11px', fontWeight: 'bold' }}
            >
              P
            </div>
            <span className="text-sm text-[var(--DisabledGrey)]">{item.id}</span>
          </div>
        );
      case 'title':
        return (
          <div className="flex items-center gap-2" style={{ paddingLeft: `${item.level * 20}px` }}>
            <span className="text-[var(--SiteBlue)] hover:underline cursor-pointer font-medium" style={{ fontSize: '13px' }}>{item.title}</span>
          </div>
        );
      case 'team':
        return (
          <div className="d-flex align-items-center">
            {item.team.map((member: string, idx: number) => {
              if (member.startsWith('+')) {
                return (
                  <span 
                    key={idx} 
                    className="ms-1 text-muted" 
                    style={{ fontSize: '11px', cursor: 'pointer' }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const names = item.team
                        .filter((m: string) => !m.startsWith('+'))
                        .map((m: string) => USER_NAMES[m] || m);
                      showPopup(names, { top: rect.bottom, left: rect.left });
                    }}
                    onMouseLeave={hidePopup}
                  >
                    {member}
                  </span>
                );
              }
              return (
                <div 
                  key={idx} 
                  className="rounded-circle bg-secondary overflow-hidden border border-white" 
                  style={{ 
                    width: '20px', 
                    height: '20px', 
                    marginLeft: idx > 0 ? '-6px' : '0',
                    zIndex: 10 - idx,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    showPopup([USER_NAMES[member] || member], { top: rect.bottom, left: rect.left });
                  }}
                  onMouseLeave={hidePopup}
                >
                  <img 
                    src={`https://picsum.photos/seed/${member}/20/20`} 
                    alt="avatar" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    referrerPolicy="no-referrer"
                  />
                </div>
              );
            })}
          </div>
        );
      case 'status':
        return <span style={{ fontSize: '13px' }}>{item.status}</span>;
      default:
        return <span style={{ fontSize: '13px' }}>{item[column.key]}</span>;
    }
  };

  const hidePopup = () => {
    popupTimer.current = setTimeout(() => {
      setPopupData(null);
    }, 200);
  };

  const flattenData = (items: any[], level = 0): any[] => {
    let result: any[] = [];
    items.forEach(item => {
      result.push({ ...item, level });
      if (expandedRows[item.id] && item.children && item.children.length > 0) {
        result = result.concat(flattenData(item.children, level + 1));
      }
    });
    return result;
  };

  const toggleSearchField = (field: string) => {
    setSelectedSearchFields(prev => 
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const handlePrint = () => {
    const headers = ['ID', 'Title', 'Client Category', 'Team', 'Working Action', 'Status', 'Iter', 'Due Date'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        item.id,
        `"${item.title.replace(/"/g, '""')}"`,
        `"${item.clientCategory || ''}"`,
        `"${item.team.join('; ')}"`,
        `"${item.workingAction || ''}"`,
        item.status,
        item.items || 0,
        item.dueDate || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'tasks.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  useEffect(() => {
    setData(propsData || projectMockData);
  }, [propsData]);

  const filteredData = useMemo(() => {
    const checkItemMatch = (item: any) => {
      // Global search
      let globalMatch = true;
      if (searchQuery !== '') {
        const query = searchQuery.toLowerCase();
        const fieldsToSearch = selectedSearchFields.length > 0 
          ? selectedSearchFields.map(label => {
              const mapping: Record<string, string> = {
                'ID': 'id',
                'Title': 'title',
                'Client Category': 'clientCategory',
                'Team': 'team',
                'Working Actions': 'workingAction',
                'Status': 'status',
                'Iter': 'items',
                'Due Date': 'dueDate'
              };
              return mapping[label] || label;
            })
          : ['id', 'title', 'team', 'status', 'clientCategory', 'workingAction', 'items', 'dueDate'];
        
        const checkMatch = (value: any) => {
          const strValue = String(value).toLowerCase();
          if (searchMode === 'Exact Phrase') return strValue === query;
          if (searchMode === 'Any Words') {
            const words = query.split(' ');
            return words.some(word => strValue.includes(word));
          }
          const words = query.split(' ');
          return words.every(word => strValue.includes(word));
        };

        globalMatch = fieldsToSearch.some(field => {
          const value = item[field];
          if (value === undefined || value === null) return false;
          if (Array.isArray(value)) return value.some(v => checkMatch(v));
          return checkMatch(value);
        });
      }

      // Column filters
      let filterMatch = true;
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '') {
          const query = (value as string).toLowerCase();
          const itemValue = item[key];
          if (itemValue === undefined || itemValue === null) {
            filterMatch = false;
            return;
          }
          let match = false;
          if (Array.isArray(itemValue)) {
            match = itemValue.some((v: any) => String(v).toLowerCase().includes(query));
          } else {
            match = String(itemValue).toLowerCase().includes(query);
          }
          if (!match) filterMatch = false;
        }
      });

      return globalMatch && filterMatch;
    };

    const filterTree = (items: any[]): any[] => {
      return items.reduce((acc: any[], item: any) => {
        const itemMatches = checkItemMatch(item);
        const filteredChildren = item.children ? filterTree(item.children) : [];
        
        if (itemMatches || filteredChildren.length > 0) {
          acc.push({
            ...item,
            children: filteredChildren
          });
        }
        return acc;
      }, []);
    };

    let result = filterTree(data);
    
    if (sortConfig !== null) {
      const sortItems = (items: any[]): any[] => {
        return [...items].sort((a, b) => {
          const aVal = a[sortConfig.key] ?? '';
          const bVal = b[sortConfig.key] ?? '';
          
          let comparison = 0;
          if (aVal < bVal) comparison = -1;
          else if (aVal > bVal) comparison = 1;
          
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }).map(item => ({
          ...item,
          children: item.children ? sortItems(item.children) : []
        }));
      };
      result = sortItems(result);
    }
    
    return result;
  }, [data, searchQuery, filters, searchMode, selectedSearchFields, sortConfig]);

  const flattenedFilteredData = useMemo(() => flattenData(filteredData), [filteredData, expandedRows]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSelection = (id: string) => {
    if (isSingleSelect) {
      setSelectedIds(prev => prev.includes(id) ? [] : [id]);
    } else {
      setSelectedIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    }
  };

  const handleSave = () => {
    localStorage.setItem('selectedProjectIds', JSON.stringify(selectedIds));
    const selectedTitles = data
      .filter(item => selectedIds.includes(item.id))
      .map(item => item.title);
    onSave(selectedTitles);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal-container rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="modal-header">
          <div>
            <h2 className="text-[var(--popupTitle)] font-semibold text-[var(--SiteBlue)]">{title}</h2>
            <p className="text-[var(--DisabledGrey)] text-sm mt-1">
              {subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--DisabledGrey)] hover:text-[var(--TextBlack)] transition-colors"
          >
            <X size={24} />
          </button>
        </header>

        <div className="modal-body bg-[var(--LightBgGrey)] p-0">
          <div className="bg-white flex flex-col h-full">
            {/* Selected Items Section */}
            {selectedIds.length > 0 && (
              <div className="border-b border-[var(--BorderGrey)] bg-white">
                <div className="flex items-center px-6 py-2 bg-[#F4F4F4] text-[var(--DisabledGrey)] font-bold text-[11px] uppercase tracking-wider border-b border-[var(--BorderGrey)]">
                  <span className="w-10"></span>
                  <span className="w-[80px]">ID</span>
                  <span className="flex-grow">Title</span>
                  <span className="w-[100px] text-center">Team</span>
                  <span className="w-[100px] text-right">Created</span>
                </div>
                <div className="max-h-[150px] overflow-y-auto">
                  {data.filter(item => selectedIds.includes(item.id)).map(item => (
                    <div key={item.id} className="flex items-center px-6 py-2 border-b border-[var(--BorderGrey)] last:border-0 text-[13px]">
                      <div className="w-10">
                        <input 
                          type="checkbox" 
                          checked={true} 
                          onChange={() => toggleSelection(item.id)} 
                        />
                      </div>
                      <span className="w-[80px] text-[var(--DisabledGrey)]">{item.id}</span>
                      <span className="flex-grow text-[var(--SiteBlue)] font-medium cursor-pointer hover:underline">{item.title}</span>
                      <div className="w-[100px] flex justify-center">
                        <div className="flex items-center">
                          {item.team.map((member: string, idx: number) => {
                            if (member.startsWith('+')) {
                              return (
                                <span 
                                  key={idx} 
                                  className="ml-1 text-[var(--DisabledGrey)] text-[11px] cursor-pointer"
                                  onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const names = item.team
                                      .filter((m: string) => !m.startsWith('+'))
                                      .map((m: string) => USER_NAMES[m] || m);
                                    showPopup(names, { top: rect.bottom, left: rect.left });
                                  }}
                                  onMouseLeave={hidePopup}
                                >
                                  {member}
                                </span>
                              );
                            }
                            return (
                              <div 
                                key={idx} 
                                className="rounded-full bg-gray-200 overflow-hidden border border-white" 
                                style={{ 
                                  width: '20px', 
                                  height: '20px', 
                                  marginLeft: idx > 0 ? '-6px' : '0',
                                  zIndex: 10 - idx,
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  showPopup([USER_NAMES[member] || member], { top: rect.bottom, left: rect.left });
                                }}
                                onMouseLeave={hidePopup}
                              >
                                <img 
                                  src={`https://picsum.photos/seed/${member}/20/20`} 
                                  alt="avatar" 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <span className="w-[100px] text-right text-[var(--DisabledGrey)]">01-03-2023</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Table Content */}
            <div className="flex-grow overflow-hidden flex flex-col">
              <div className="flex-grow overflow-hidden">
                <SmartTable
                  data={flattenedFilteredData}
                  columns={tableSettings.columns}
                  tableSettings={tableSettings}
                  onSettingsChange={setTableSettings}
                  defaultSettings={DEFAULT_SETTINGS}
                  selectedIds={new Set(selectedIds)}
                  onToggleSelect={toggleSelection}
                  onToggleSelectAll={() => {
                    if (selectedIds.length === flattenedFilteredData.length && flattenedFilteredData.length > 0) {
                      setSelectedIds([]);
                    } else {
                      setSelectedIds(flattenedFilteredData.map(item => item.id));
                    }
                  }}
                  isAllSelected={selectedIds.length === flattenedFilteredData.length && flattenedFilteredData.length > 0}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  searchType={searchMode as 'All Words' | 'Any Words' | 'Exact Phrase'}
                  onSearchTypeChange={setSearchMode}
                  searchFields={selectedSearchFields}
                  onSearchFieldsChange={setSelectedSearchFields}
                  searchFieldOptions={[
                    'ID', 
                    'Title', 
                    'Client Category', 
                    'Team', 
                    'Working Actions', 
                    'Status', 
                    'Iter', 
                    'Due Date', 
                    'All content'
                  ]}
                  sortKey={sortConfig?.key || null}
                  sortDirection={sortConfig?.direction || null}
                  onSort={requestSort}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  renderCell={renderCell}
                  onIconClick={(id) => {
                    if (id === 'print') handlePrint();
                    if (id === 'clear') {
                      setSearchQuery('');
                      setFilters({});
                      setSearchMode('All Words');
                      setSortConfig(null);
                      setSelectedSearchFields([]);
                    }
                  }}
                  toolbarActions={
                    <div className="flex items-center gap-2">
                      <button 
                        className="btn-primary" 
                        style={{ fontSize: '13px', padding: '4px 16px', height: '32px', borderRadius: '2px' }} 
                        onClick={() => setIsCreateSprintOpen(true)}
                      >
                        Add PXC
                      </button>
                      <button 
                        className="btn-default" 
                        style={{ fontSize: '13px', padding: '4px 16px', height: '32px', backgroundColor: '#B0B0B0', color: 'white', borderColor: '#B0B0B0', borderRadius: '2px' }}
                      >
                        Compare
                      </button>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-[var(--SiteBlue)] text-[13px]">Select single project</span>
                        <label className="switch">
                          <input 
                            type="checkbox" 
                            checked={isSingleSelect}
                            onChange={(e) => {
                              setIsSingleSelect(e.target.checked);
                              if (e.target.checked && selectedIds.length > 1) {
                                setSelectedIds([selectedIds[0]]);
                              }
                            }}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    </div>
                  }
                  viewportHeight={500}
                  onEditClick={(item) => setEditingProject(item)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="modal-footer">
          <button className="btn-primary px-8" style={{ borderRadius: '2px' }} onClick={handleSave}>Save</button>
          <button className="btn-default px-8" style={{ borderRadius: '2px' }} onClick={onClose}>Cancel</button>
        </footer>

        {isCreateSprintOpen && <CreateSprintPopup onClose={() => setIsCreateSprintOpen(false)} />}
        {editingProject && (
          <EditProjectPopup 
            project={editingProject} 
            onClose={() => setEditingProject(null)} 
            allTeamMembers={MOCK_TEAM_MEMBERS}
            categoryData={MOCK_CATEGORY_DATA}
            onSave={(updated) => {
              console.log('Saved project:', updated);
              setEditingProject(null);
            }} 
          />
        )}
        {popupData && (
          <UserPopup 
            users={popupData.users} 
            position={popupData.position} 
            onClose={() => setPopupData(null)}
            onMouseEnter={() => { if (popupTimer.current) clearTimeout(popupTimer.current); }}
            onMouseLeave={hidePopup}
          />
        )}
      </div>
    </div>
  );
}
