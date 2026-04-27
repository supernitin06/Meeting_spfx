
import React, { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { X, Menu, Calendar, Edit2, Plus, Trash2, Search, UserPlus, ExternalLink, History, Share2, Save, ChevronUp, ChevronRight } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  team: string;
  avatar: string;
}

interface EditProjectPopupProps {
  project: any;
  onClose: () => void;
  onSave: (updatedProject: any) => void;
  allTeamMembers: TeamMember[];
  categoryData: any[];
}

const ITEM_RANK_OPTIONS = [
  { value: 8, label: '(8) Top Highlights' },
  { value: 7, label: '(7) Featured Item' },
  { value: 6, label: '(6) Key Item' },
  { value: 5, label: '(5) Relevant Item' },
  { value: 4, label: '(4) Background Item' },
  { value: 2, label: '(2) to be verified' },
  { value: 1, label: '(1) Archive' },
  { value: 0, label: '(0) No Show' },
];

const STATUS_OPTIONS = [
  { value: 0, label: '0% Not Started' },
  { value: 1, label: '1% For Approval' },
  { value: 2, label: '2% Follow Up' },
  { value: 3, label: '3% Approved' },
  { value: 4, label: '4% Checking' },
  { value: 5, label: '5% Acknowledged' },
  { value: 8, label: '8% Priority Check' },
  { value: 9, label: '9% Ready To Go' },
  { value: 10, label: '10% working on it' },
  { value: 70, label: '70% Re-Open' },
  { value: 75, label: '75% Deployment Pending' },
  { value: 80, label: '80% In QA Review' },
  { value: 90, label: '90% Task completed' },
  { value: 100, label: '100% Closed' },
];

const EditProjectPopup: React.FC<EditProjectPopupProps> = ({ project, onClose, onSave, allTeamMembers, categoryData }) => {
  const [activeTab, setActiveTab] = useState('BASIC INFORMATION');
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [showCategoriesPopup, setShowCategoriesPopup] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [mainCategorySearch, setMainCategorySearch] = useState('');
  const [showMainCategoryDropdown, setShowMainCategoryDropdown] = useState(false);
  const [hoveredParent, setHoveredParent] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const filteredMainCategories = useMemo(() => {
    if (!mainCategorySearch) return [];
    const results: { parent: string, child: string }[] = [];
    categoryData.forEach(p => {
      p.children.forEach((c: string) => {
        if (c.toLowerCase().includes(mainCategorySearch.toLowerCase()) && !selectedCategories.includes(c)) {
          results.push({ parent: p.label, child: c });
        }
      });
    });
    return results;
  }, [mainCategorySearch, selectedCategories, categoryData]);

  const [formData, setFormData] = useState({
    priority: 10,
    itemRank: 'High',
    status: 0,
    statusLabel: 'Not Started',
    categories: '',
    description: '',
    relevantUrl: '',
    verified: false,
    portfolioItems: [],
    comment: '',
    teamMembers: [] as TeamMember[],
    workingMembers: [] as TeamMember[],
    ...project
  });

  const [teamSearch, setTeamSearch] = useState('');
  const [hoveredMember, setHoveredMember] = useState<{ member: TeamMember, x: number, y: number } | null>(null);

  const handleDragStart = (e: React.DragEvent, member: TeamMember) => {
    e.dataTransfer.setData('memberId', member.id);
  };

  const handleDrop = (e: React.DragEvent, target: 'teamMembers' | 'workingMembers') => {
    e.preventDefault();
    const memberId = e.dataTransfer.getData('memberId');
    const member = allTeamMembers.find(m => m.id === memberId);
    if (member) {
      const currentList = formData[target] || [];
      if (!currentList.some((m: TeamMember) => m.id === member.id)) {
        setFormData({
          ...formData,
          [target]: [...currentList, member]
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeMember = (id: string, target: 'teamMembers' | 'workingMembers') => {
    const currentList = formData[target] || [];
    setFormData({
      ...formData,
      [target]: currentList.filter((m: TeamMember) => m.id !== id)
    });
  };

  useEffect(() => {
    if (project.categories) {
      setSelectedCategories(project.categories.split(', ').filter(Boolean));
    }
  }, [project]);

  const handleCategoryToggle = (cat: string) => {
    setSelectedCategories(prev => {
      const next = prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat];
      setFormData(f => ({ ...f, categories: next.join(', ') }));
      return next;
    });
  };

  const handlePriorityChange = (val: string | number) => {
    const priority = typeof val === 'string' ? parseInt(val) : val;
    const clampedPriority = Math.min(10, Math.max(0, priority));
    
    let rank = 'Normal';
    if (clampedPriority <= 3) rank = 'Low';
    else if (clampedPriority <= 7) rank = 'Normal';
    else rank = 'High';
    
    setFormData(prev => ({ ...prev, priority: clampedPriority, itemRank: rank }));
  };

  const handleRankChange = (rank: string) => {
    let priority = 5;
    if (rank === 'Low') priority = 2;
    else if (rank === 'Normal') priority = 5;
    else if (rank === 'High') priority = 9;
    
    setFormData(prev => ({ ...prev, itemRank: rank, priority }));
  };

  const tabs = ['BASIC INFORMATION', 'CONCEPT', 'TEAM COMPOSITION'];

  const renderBasicInfo = () => (
    <div className="flex gap-4 p-4 overflow-auto" style={{ maxHeight: 'calc(95vh - 180px)' }}>
      {/* Left Column - Main Form */}
      <div className="flex-grow flex flex-col gap-4" style={{ maxWidth: '65%' }}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8">
            <label className="block text-xs font-bold text-[var(--DisabledGrey)] uppercase tracking-wider mb-1">Title</label>
            <input 
              type="text" 
              className="w-full text-sm border border-[var(--BorderGrey)] rounded-sm px-3 py-1.5 outline-none focus:border-[var(--SiteBlue)]" 
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="col-span-4">
            <label className="block text-xs font-bold text-[var(--DisabledGrey)] uppercase tracking-wider mb-1">Priority</label>
            <input 
              type="number" 
              className="w-full text-sm border border-[var(--BorderGrey)] rounded-sm px-3 py-1.5 outline-none focus:border-[var(--SiteBlue)]" 
              min="0"
              max="10"
              value={formData.priority}
              onChange={(e) => handlePriorityChange(e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8">
            <label className="block text-xs font-bold text-[var(--DisabledGrey)] uppercase tracking-wider mb-1">Item Rank</label>
            <select 
              className="w-full text-sm border border-[var(--BorderGrey)] rounded-sm px-3 py-1.5 outline-none focus:border-[var(--SiteBlue)] bg-white"
              value={formData.priority}
              onChange={(e) => handlePriorityChange(e.target.value)}
            >
              <option value="">Select Item Rank</option>
              {ITEM_RANK_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="col-span-4 flex items-end">
            <div className="flex gap-4 mb-1">
              {['High', 'Normal', 'Low'].map(rank => (
                <div key={rank} className="flex items-center gap-2">
                  <input 
                    className="w-4 h-4 text-[var(--SiteBlue)] border-[var(--BorderGrey)] focus:ring-[var(--SiteBlue)]" 
                    type="radio" 
                    name="rank_basic" 
                    id={`rank-basic-${rank}`} 
                    checked={formData.itemRank === rank} 
                    onChange={() => handleRankChange(rank)}
                  />
                  <label className="text-xs text-[var(--TextBlack)] font-medium cursor-pointer" htmlFor={`rank-basic-${rank}`}>{rank}</label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <label className="block text-xs font-bold text-[var(--DisabledGrey)] uppercase tracking-wider mb-1">Status</label>
            <div className="flex">
              <input type="text" className="flex-grow text-sm border border-[var(--BorderGrey)] rounded-l-sm px-3 py-1.5 outline-none bg-gray-50" value={formData.status} readOnly />
              <span 
                className="flex items-center px-3 border border-l-0 border-[var(--BorderGrey)] rounded-r-sm bg-white cursor-pointer hover:bg-gray-50"
                onClick={() => setShowStatusPopup(true)}
              >
                <Edit2 size={14} className="text-[var(--SiteBlue)]" />
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <input className="w-4 h-4 text-[var(--SiteBlue)] border-[var(--BorderGrey)]" type="radio" checked readOnly />
              <label className="text-xs text-[var(--DisabledGrey)] font-medium">{formData.statusLabel}</label>
            </div>
          </div>
          <div className="col-span-6">
            <label className="block text-xs font-bold text-[var(--DisabledGrey)] uppercase tracking-wider mb-1">Working Member</label>
            <div 
              className="flex gap-1 flex-wrap items-center border border-[var(--BorderGrey)] rounded-sm p-1 min-h-[34px] bg-gray-50"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'workingMembers')}
            >
              {(formData.workingMembers || []).length > 0 ? (
                <>
                  {(formData.workingMembers || []).slice(0, 3).map((member: TeamMember, idx: number) => (
                    <div 
                      key={member.id} 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm relative" 
                      style={{ 
                        marginLeft: idx === 0 ? '0' : '-8px',
                        zIndex: 10 - idx,
                      }}
                      onMouseEnter={(e) => setHoveredMember({ member, x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoveredMember(null)}
                    >
                      <img 
                        src={member.avatar} 
                        alt={member.name} 
                        className="w-full h-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div 
                        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 shadow-sm"
                        style={{ fontSize: '8px', zIndex: 20 }}
                        onClick={() => removeMember(member.id, 'workingMembers')}
                      >
                        ×
                      </div>
                    </div>
                  ))}
                  {(formData.workingMembers || []).length > 3 && (
                    <span className="text-[10px] font-bold text-[var(--DisabledGrey)] ml-1">
                      +{(formData.workingMembers || []).length - 3}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-[var(--DisabledGrey)] px-2 italic">Drop here</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4">
            <label className="block text-xs font-bold text-[var(--DisabledGrey)] uppercase tracking-wider mb-1">Start Date</label>
            <div className="flex">
              <input type="text" className="flex-grow text-sm border border-[var(--BorderGrey)] rounded-l-sm px-3 py-1.5 outline-none" placeholder="DD MMM YYYY" />
              <span className="flex items-center px-3 border border-l-0 border-[var(--BorderGrey)] rounded-r-sm bg-white">
                <Calendar size={14} className="text-[var(--DisabledGrey)]" />
              </span>
            </div>
          </div>
          <div className="col-span-4">
            <label className="block text-xs font-bold text-[var(--DisabledGrey)] uppercase tracking-wider mb-1">Due Date</label>
            <div className="flex">
              <input type="text" className="flex-grow text-sm border border-[var(--BorderGrey)] rounded-l-sm px-3 py-1.5 outline-none" placeholder="DD MMM YYYY" />
              <span className="flex items-center px-3 border border-l-0 border-[var(--BorderGrey)] rounded-r-sm bg-white">
                <Calendar size={14} className="text-[var(--DisabledGrey)]" />
              </span>
            </div>
          </div>
          <div className="col-span-4">
            <label className="block text-xs font-bold text-[var(--DisabledGrey)] uppercase tracking-wider mb-1">Completion Date</label>
            <div className="flex">
              <input type="text" className="flex-grow text-sm border border-[var(--BorderGrey)] rounded-l-sm px-3 py-1.5 outline-none" placeholder="DD MMM YYYY" />
              <span className="flex items-center px-3 border border-l-0 border-[var(--BorderGrey)] rounded-r-sm bg-white">
                <Calendar size={14} className="text-[var(--DisabledGrey)]" />
              </span>
            </div>
          </div>
        </div>

        <div className="relative">
          <label className="block text-xs font-bold text-[var(--DisabledGrey)] uppercase tracking-wider mb-1">Categories</label>
          <div className="flex">
            <input 
              type="text" 
              className="flex-grow text-sm border border-[var(--BorderGrey)] rounded-l-sm px-3 py-1.5 outline-none focus:border-[var(--SiteBlue)]" 
              placeholder="Search category" 
              value={mainCategorySearch || formData.categories}
              onChange={(e) => {
                setMainCategorySearch(e.target.value);
                setShowMainCategoryDropdown(true);
              }}
              onFocus={() => setShowMainCategoryDropdown(true)}
              onBlur={() => setTimeout(() => setShowMainCategoryDropdown(false), 200)}
              style={{ color: formData.categories ? 'var(--SiteBlue)' : 'inherit' }}
            />
            {formData.categories && !mainCategorySearch && (
              <span 
                className="flex items-center px-2 border-y border-[var(--BorderGrey)] bg-white cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  setSelectedCategories([]);
                  setFormData(f => ({ ...f, categories: '' }));
                }}
              >
                <X size={14} className="text-[var(--DisabledGrey)]" />
              </span>
            )}
            <span 
              className="flex items-center px-3 border border-l-0 border-[var(--BorderGrey)] rounded-r-sm bg-white cursor-pointer hover:bg-gray-50"
              onClick={() => setShowCategoriesPopup(true)}
            >
              <Edit2 size={14} className="text-[var(--SiteBlue)]" />
            </span>
          </div>
          {showMainCategoryDropdown && filteredMainCategories.length > 0 && (
            <div className="absolute left-0 right-0 bg-white border border-[var(--BorderGrey)] rounded-sm shadow-lg mt-1 overflow-auto z-[100] max-h-[200px]">
              {filteredMainCategories.map((res, i) => (
                <div 
                  key={i} 
                  className="p-2 border-b border-[var(--BorderGrey)] last:border-0 text-xs cursor-pointer hover:bg-[var(--LightBgGrey)]"
                  onClick={() => {
                    handleCategoryToggle(res.child);
                    setMainCategorySearch('');
                    setShowMainCategoryDropdown(false);
                  }}
                >
                  <span className="text-[var(--DisabledGrey)]">{res.parent} &gt; </span>
                  <span className="text-[var(--SiteBlue)] font-medium">{res.child}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 mt-1">
          {['Phone', 'Approval', 'Immediate', 'Email Notification'].map(label => (
            <div key={label} className="flex items-center gap-2">
              <input 
                className="w-4 h-4 text-[var(--SiteBlue)] border-[var(--BorderGrey)] rounded focus:ring-[var(--SiteBlue)]" 
                type="checkbox" 
                id={label} 
                checked={selectedCategories.includes(label)}
                onChange={() => handleCategoryToggle(label)}
              />
              <label className="text-xs text-[var(--TextBlack)] font-medium cursor-pointer" htmlFor={label}>{label}</label>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--DisabledGrey)] uppercase tracking-wider mb-1">Relevant URL</label>
          <input 
            type="text" 
            className="w-full text-sm border border-[var(--BorderGrey)] rounded-sm px-3 py-1.5 outline-none focus:border-[var(--SiteBlue)]" 
            placeholder="Url" 
            value={formData.relevantUrl || ''}
            onChange={(e) => setFormData({ ...formData, relevantUrl: e.target.value })}
          />
        </div>

        <div className="border border-[var(--BorderGrey)] rounded-sm mt-2 overflow-hidden">
          <div className="bg-[var(--LightBgGrey)] px-4 py-2 border-b border-[var(--BorderGrey)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChevronUp size={14} className="text-[var(--SiteBlue)]" />
              <span className="text-xs font-bold text-[var(--SiteBlue)] uppercase tracking-wider">Description</span>
            </div>
            <div className="flex items-center gap-2">
              <input 
                className="w-4 h-4 text-[var(--SiteBlue)] border-[var(--BorderGrey)] rounded focus:ring-[var(--SiteBlue)]" 
                type="checkbox" 
                id="verified" 
                checked={formData.verified || false}
                onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
              />
              <label className="text-xs text-[var(--TextBlack)] font-medium cursor-pointer" htmlFor="verified">Verified</label>
            </div>
          </div>
          <div className="p-0">
            <div className="bg-white border-b border-[var(--BorderGrey)] p-1.5 flex gap-2 flex-wrap">
              <button className="p-1.5 hover:bg-gray-100 rounded transition-colors"><Edit2 size={14} className="text-[var(--DisabledGrey)]" /></button>
              <div className="w-px h-6 bg-[var(--BorderGrey)] mx-1"></div>
              <button className="p-1.5 hover:bg-gray-100 rounded transition-colors font-bold text-sm text-[var(--TextBlack)]">B</button>
              <button className="p-1.5 hover:bg-gray-100 rounded transition-colors italic text-sm text-[var(--TextBlack)]">I</button>
              <div className="w-px h-6 bg-[var(--BorderGrey)] mx-1"></div>
              <button className="p-1.5 hover:bg-gray-100 rounded transition-colors text-xs font-medium text-[var(--TextBlack)]">List</button>
            </div>
            <textarea 
              className="w-full border-0 p-4 outline-none text-sm text-[var(--TextBlack)] leading-relaxed" 
              rows={8} 
              style={{ resize: 'none' }}
              placeholder="Enter project description..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="bg-[var(--LightBgGrey)] px-4 py-1.5 border-t border-[var(--BorderGrey)] flex justify-between items-center text-[10px] font-bold text-[var(--DisabledGrey)] uppercase tracking-widest">
              <span>
                CHARS: {formData.description?.length || 0} | WORDS: {formData.description?.trim() ? formData.description.trim().split(/\s+/).length : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Comments & Portfolio */}
      <div className="flex flex-col gap-4" style={{ width: '32%' }}>
        <div className="border border-[var(--BorderGrey)] rounded-sm overflow-hidden shadow-sm">
          <div className="bg-[var(--SiteBlue)] text-white px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Comments</span>
            <div className="flex gap-3">
              <ExternalLink size={14} className="cursor-pointer hover:opacity-80" />
              <Menu size={14} className="cursor-pointer hover:opacity-80" />
            </div>
          </div>
          <div className="p-4 bg-white">
            <div className="flex items-center gap-3 border-b border-[var(--BorderGrey)] pb-3 mb-4">
              <span className="text-xs font-bold text-[var(--DisabledGrey)] uppercase">To:</span>
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-gray-300"></div>
                <span className="text-[10px] font-bold text-[var(--DisabledGrey)]">+1</span>
              </div>
              <div className="flex items-center flex-grow bg-gray-50 border border-[var(--BorderGrey)] rounded-sm px-2 py-1">
                <Search size={12} className="text-[var(--DisabledGrey)] mr-2" />
                <input type="text" className="bg-transparent border-0 outline-none text-xs flex-grow" placeholder="Tag user" />
                <Plus size={14} className="text-[var(--SiteBlue)] cursor-pointer" />
              </div>
            </div>
            <textarea 
              className="w-full text-sm border border-[var(--BorderGrey)] rounded-sm p-3 mb-4 outline-none focus:border-[var(--SiteBlue)] bg-gray-50" 
              placeholder="Enter your comments" 
              rows={4}
              style={{ resize: 'none' }}
              value={formData.comment || ''}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            />
            <div className="flex justify-end">
              <button 
                className={clsx(
                  "px-6 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all",
                  formData.comment?.trim() ? "bg-[var(--SiteBlue)] text-white shadow-md" : "bg-gray-300 text-white cursor-not-allowed"
                )}
                disabled={!formData.comment?.trim()} 
              >
                Post
              </button>
            </div>
          </div>
        </div>

        <div className="border border-[var(--BorderGrey)] rounded-sm overflow-hidden shadow-sm">
          <div className="bg-[var(--LightBgGrey)] px-4 py-2 border-b border-[var(--BorderGrey)] flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--DisabledGrey)] uppercase tracking-wider">Portfolio Items</span>
          </div>
          <div className="p-4 bg-white">
            <div className="flex flex-col gap-2">
              {(formData.portfolioItems || ['C153 Power BI']).map((item: string, i: number) => (
                <div key={i} className="border border-blue-100 bg-blue-50 text-[var(--SiteBlue)] px-3 py-2 rounded-sm flex items-center justify-between group">
                  <span className="text-xs font-medium">{item}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={14} className="text-[var(--DisabledGrey)] cursor-pointer hover:text-red-500" onClick={() => {
                      const next = (formData.portfolioItems || ['C153 Power BI']).filter((_: any, idx: number) => idx !== i);
                      setFormData({ ...formData, portfolioItems: next });
                    }} />
                    <Edit2 size={14} className="text-[var(--SiteBlue)] cursor-pointer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConcept = () => {
    const teams = Array.from(new Set(allTeamMembers.map(m => m.team)));
    const filteredMembers = allTeamMembers.filter(m => 
      m.name.toLowerCase().includes(teamSearch.toLowerCase()) || 
      m.team.toLowerCase().includes(teamSearch.toLowerCase())
    );

    return (
      <div className="p-3 d-flex flex-column gap-3 overflow-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
        <div className="border rounded p-2">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
              <span className="small text-primary fw-bold">Select Team Members</span>
              <input 
                type="text" 
                className="form-control form-control-sm" 
                placeholder="Search team member" 
                style={{ width: '200px' }} 
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
              />
            </div>
            <div className="d-flex align-items-center gap-1 text-primary small">
              <span>Task User Management</span>
              <Menu size={14} />
            </div>
          </div>
          
          <div className="d-flex gap-4 overflow-auto pb-2">
            {teams.map(team => {
              const teamMembers = filteredMembers.filter(m => m.team === team);
              return (
                <div key={team} className="d-flex flex-column gap-1" style={{ minWidth: '100px' }}>
                  <span className="text-muted" style={{ fontSize: '10px' }}>{team}</span>
                  <div className="d-flex gap-0 align-items-center">
                    {teamMembers.slice(0, 3).map((member, idx) => (
                      <div 
                        key={member.id} 
                        className="rounded-circle border border-white cursor-pointer" 
                        style={{ 
                          width: '24px', 
                          height: '24px', 
                          marginLeft: idx === 0 ? '0' : '-8px',
                          zIndex: 10 - idx,
                          overflow: 'hidden'
                        }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, member)}
                        onMouseEnter={(e) => setHoveredMember({ member, x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHoveredMember(null)}
                      >
                        <img 
                          src={member.avatar} 
                          alt={member.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                    {teamMembers.length > 3 && (
                      <span className="small text-muted ms-1" style={{ fontSize: '10px' }}>
                        +{teamMembers.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="row mt-2">
            <div className="col-md-6">
              <label className="small text-muted mb-1">Team Members</label>
              <div 
                className="border rounded p-2 d-flex gap-0 flex-wrap align-items-center" 
                style={{ minHeight: '40px' }}
                onDrop={(e) => handleDrop(e, 'teamMembers')}
                onDragOver={handleDragOver}
              >
                {(formData.teamMembers || []).map((member: TeamMember, idx: number) => (
                  <div 
                    key={member.id} 
                    className="rounded-circle border border-white position-relative" 
                    style={{ 
                      width: '28px', 
                      height: '28px', 
                      marginLeft: idx === 0 ? '0' : '-10px',
                      zIndex: 10 - idx,
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => setHoveredMember({ member, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setHoveredMember(null)}
                  >
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      referrerPolicy="no-referrer"
                    />
                    <div 
                      className="position-absolute top-0 end-0 bg-danger rounded-circle d-flex align-items-center justify-content-center cursor-pointer" 
                      style={{ width: '12px', height: '12px', zIndex: 20 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMember(member.id, 'teamMembers');
                      }}
                    >
                      <X size={8} className="text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-md-6">
              <label className="small text-muted mb-1">Working Members</label>
              <div className="d-flex align-items-center gap-2">
                <div 
                  className="border rounded p-2 flex-grow-1 d-flex gap-0 flex-wrap align-items-center" 
                  style={{ minHeight: '40px' }}
                  onDrop={(e) => handleDrop(e, 'workingMembers')}
                  onDragOver={handleDragOver}
                >
                  {(formData.workingMembers || []).map((member: TeamMember, idx: number) => (
                    <div 
                      key={member.id} 
                      className="rounded-circle border border-white position-relative" 
                      style={{ 
                        width: '28px', 
                        height: '28px', 
                        marginLeft: idx === 0 ? '0' : '-10px',
                        zIndex: 10 - idx,
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => setHoveredMember({ member, x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoveredMember(null)}
                    >
                      <img 
                        src={member.avatar} 
                        alt={member.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        referrerPolicy="no-referrer"
                      />
                      <div 
                        className="position-absolute top-0 end-0 bg-danger rounded-circle d-flex align-items-center justify-content-center cursor-pointer" 
                        style={{ width: '12px', height: '12px', zIndex: 20 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMember(member.id, 'workingMembers');
                        }}
                      >
                        <X size={8} className="text-white" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white" style={{ width: '32px', height: '32px' }}>
                  <Edit2 size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {['Background', 'Idea'].map(section => (
          <div key={section} className="border rounded">
            <div className="bg-light px-3 py-1 border-bottom d-flex align-items-center justify-content-between">
              <span className="small text-primary fw-bold">{section}</span>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" />
                <label className="form-check-label small">Verified</label>
              </div>
            </div>
            <textarea className="form-control border-0 p-2" rows={3} style={{ resize: 'none' }} />
          </div>
        ))}

        <div className="border rounded">
          <div className="bg-light px-3 py-1 border-bottom">
            <span className="small text-primary fw-bold">Deliverables</span>
          </div>
          <div className="p-2">
            <div className="border-bottom pb-2 mb-2">
              {/* Toolbar icons */}
            </div>
            <textarea className="form-control border-0 p-0" rows={4} style={{ resize: 'none' }} />
          </div>
        </div>
      </div>
    );
  };

  const renderTeamComposition = () => {
    const teams = Array.from(new Set(allTeamMembers.map(m => m.team)));
    const filteredMembers = allTeamMembers.filter(m => 
      m.name.toLowerCase().includes(teamSearch.toLowerCase()) || 
      m.team.toLowerCase().includes(teamSearch.toLowerCase())
    );

    return (
      <div className="d-flex gap-3 p-3 overflow-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
        {/* Left Sidebar */}
        <div className="d-flex flex-column gap-2" style={{ width: '200px' }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small fw-bold">Categories</span>
            <button className="btn btn-sm btn-outline-primary py-0 px-2" style={{ fontSize: '10px' }}>+ New Category</button>
          </div>
          {['Technical', 'QA', 'Design', 'UX', 'Lead', 'Coordination', 'Development', 'Concept', 'Strategy'].map(cat => (
            <div key={cat} className={`p-2 border rounded d-flex justify-content-between align-items-center ${cat === 'Concept' ? 'border-primary bg-light' : ''}`}>
              <span className="small">{cat}</span>
              <div className="d-flex gap-1">
                <Edit2 size={12} className="text-muted" />
                <Trash2 size={12} className="text-muted" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 d-flex flex-column gap-3">
          <div className="border rounded p-3">
            <h6 className="small fw-bold mb-3">Assign Users with Roles and Responsibilities</h6>
            
            <div className="mb-3">
              <label className="small text-muted mb-1">Select Team Members</label>
              <input 
                type="text" 
                className="form-control form-control-sm" 
                placeholder="Search team member" 
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
              />
            </div>

            <div className="d-flex gap-4 overflow-auto pb-2 mb-3">
              {teams.map(team => (
                <div key={team} className="d-flex flex-column gap-1" style={{ minWidth: '100px' }}>
                  <span className="text-muted" style={{ fontSize: '10px' }}>{team}</span>
                  <div className="d-flex gap-1">
                    {filteredMembers.filter(m => m.team === team).map(member => (
                      <div 
                        key={member.id} 
                        className="rounded-circle d-flex align-items-center justify-content-center text-white cursor-pointer" 
                        style={{ width: '20px', height: '20px', backgroundColor: member.avatar, fontSize: '10px' }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, member)}
                        title={member.name}
                      >
                        {member.name.charAt(0)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-3">
              <label className="small text-muted mb-1">Assigned Users</label>
              <div className="d-flex align-items-center gap-2">
                <div 
                  className="border rounded p-2 flex-grow-1 d-flex gap-1 flex-wrap align-items-center" 
                  style={{ minHeight: '40px' }}
                  onDrop={(e) => handleDrop(e, 'workingMembers')}
                  onDragOver={handleDragOver}
                >
                  {(formData.workingMembers || []).map((member: TeamMember) => (
                    <div 
                      key={member.id} 
                      className="rounded-circle d-flex align-items-center justify-content-center text-white position-relative" 
                      style={{ width: '24px', height: '24px', backgroundColor: member.avatar, fontSize: '11px' }}
                      title={member.name}
                    >
                      {member.name.charAt(0)}
                      <div 
                        className="position-absolute top-0 end-0 bg-danger rounded-circle d-flex align-items-center justify-content-center cursor-pointer" 
                        style={{ width: '10px', height: '10px', marginTop: '-2px', marginRight: '-2px' }}
                        onClick={() => removeMember(member.id, 'workingMembers')}
                      >
                        <X size={8} className="text-white" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white" style={{ width: '32px', height: '32px' }}>
                  <Edit2 size={16} />
                </div>
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-12">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="small text-muted">Assigned Role</label>
                  <button className="btn btn-sm btn-outline-primary py-0 px-2" style={{ fontSize: '10px' }}>+ New Role</button>
                </div>
                <select className="form-select form-select-sm">
                  <option>Select Role</option>
                  <option value="Lead">Lead</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="small text-muted mb-1">Assigned Responsibility</label>
              <input type="text" className="form-control form-control-sm" placeholder="Type New Responsibility" />
            </div>

            <div className="d-flex justify-content-end mb-3">
              <button className="btn btn-sm btn-primary px-4">Add</button>
            </div>

            <table className="table table-sm table-bordered small">
              <thead className="bg-light">
                <tr>
                  <th>Category</th>
                  <th>Role</th>
                  <th>Team Members</th>
                  <th>Responsibility</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Concept</td>
                  <td>Lead</td>
                  <td>
                    <div className="d-flex gap-0 align-items-center">
                      {(formData.workingMembers || []).slice(0, 3).map((member: TeamMember, idx: number) => (
                        <div 
                          key={member.id} 
                          className="rounded-circle border border-white" 
                          style={{ 
                            width: '20px', 
                            height: '20px', 
                            marginLeft: idx === 0 ? '0' : '-6px',
                            zIndex: 10 - idx,
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => setHoveredMember({ member, x: e.clientX, y: e.clientY })}
                          onMouseLeave={() => setHoveredMember(null)}
                        >
                          <img 
                            src={member.avatar} 
                            alt={member.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ))}
                      {(formData.workingMembers || []).length > 3 && (
                        <span className="small text-muted ms-1" style={{ fontSize: '10px' }}>
                          +{(formData.workingMembers || []).length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td></td>
                  <td>
                    <div className="d-flex gap-2 justify-content-center">
                      <Edit2 size={12} className="text-muted" />
                      <Trash2 size={12} className="text-muted" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{ zIndex: 1100 }}
    >
      {hoveredMember && (
        <div 
          className="fixed bg-white border rounded shadow-sm p-2 flex items-center gap-2"
          style={{ 
            left: hoveredMember.x + 15, 
            top: hoveredMember.y + 15, 
            zIndex: 3000,
            pointerEvents: 'none',
            minWidth: '150px'
          }}
        >
          <img 
            src={hoveredMember.member.avatar} 
            alt="" 
            className="rounded-full" 
            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
            referrerPolicy="no-referrer"
          />
          <span className="text-xs font-bold text-gray-900">{hoveredMember.member.name}</span>
        </div>
      )}
      <div
        className="modal-container rounded-lg"
        style={{ width: '95vw', height: '95vh', maxWidth: '1400px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="modal-header">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-[var(--SiteBlue)] flex items-center justify-center text-white text-xs" style={{ width: '24px', height: '24px' }}>P</div>
            <h2 className="text-[var(--popupTitle)] font-semibold text-[var(--SiteBlue)]">{project.id} - {project.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-[var(--DisabledGrey)] hover:text-[var(--TextBlack)] transition-colors">
              <Menu size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[var(--DisabledGrey)] hover:text-[var(--TextBlack)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Breadcrumbs */}
        <div className="px-6 py-1 bg-[var(--LightBgGrey)] border-b border-[var(--BorderGrey)] flex items-center gap-1 text-[11px]">
          <span className="bg-gray-500 text-white px-2 rounded-full text-[10px]">Project</span>
          <span className="text-[var(--DisabledGrey)]">/</span>
          <span className="text-[var(--DisabledGrey)]">{project.id} {project.title}</span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--BorderGrey)] px-6 bg-white">
          {tabs.map(tab => (
            <div 
              key={tab}
              className={`px-4 py-2 cursor-pointer text-sm font-bold transition-colors ${activeTab === tab ? 'text-[var(--SiteBlue)] border-b-2 border-[var(--SiteBlue)]' : 'text-[var(--DisabledGrey)]'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-grow overflow-hidden">
          {activeTab === 'BASIC INFORMATION' && renderBasicInfo()}
          {activeTab === 'CONCEPT' && renderConcept()}
          {activeTab === 'TEAM COMPOSITION' && renderTeamComposition()}
        </div>

        {/* Footer */}
        <footer className="modal-footer justify-between bg-white">
          <div className="flex flex-col text-[11px]">
            <div className="text-[var(--DisabledGrey)]">Created <span className="text-[var(--SiteBlue)]">19 Jul 2023</span> By <span className="text-[var(--SiteBlue)]">Deepak Trivedi</span></div>
            <div className="text-[var(--DisabledGrey)]">Last modified <span className="text-[var(--SiteBlue)]">18 Aug 2025</span> By <span className="text-[var(--SiteBlue)]">Rashi Shukla</span></div>
            <div className="flex gap-2 mt-1">
              <span className="text-[var(--SiteBlue)] cursor-pointer flex items-center gap-1"><Trash2 size={12} /> Delete this PX</span>
              <span className="text-[var(--DisabledGrey)]">|</span>
              <span className="text-[var(--SiteBlue)] cursor-pointer">Version History</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex gap-3 text-[11px] text-[var(--SiteBlue)]">
              <span className="cursor-pointer hover:underline">Go to Landing Page</span>
              <span className="text-[var(--DisabledGrey)]">||</span>
              <span className="cursor-pointer hover:underline flex items-center gap-1"><Share2 size={14} /> Share this PX</span>
              <span className="text-[var(--DisabledGrey)]">||</span>
              <span className="cursor-pointer hover:underline">Open out-of-the-box form</span>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary px-8" style={{ borderRadius: '2px' }} onClick={() => onSave(formData)}>Save</button>
              <button className="btn-default px-8" style={{ borderRadius: '2px' }} onClick={onClose}>Cancel</button>
            </div>
          </div>
        </footer>

        {/* Status Update Popup */}
        {showStatusPopup && (
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-container rounded-lg" style={{ width: '400px', height: 'auto', maxHeight: '80vh' }}>
              <header className="modal-header">
                <h2 className="text-[var(--popupTitle)] font-semibold text-[var(--SiteBlue)]">Update Task Status</h2>
                <button onClick={() => setShowStatusPopup(false)} className="text-[var(--DisabledGrey)] hover:text-[var(--TextBlack)]">
                  <X size={20} />
                </button>
              </header>
              <div className="modal-body p-6">
                <div className="flex flex-col gap-3">
                  {STATUS_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-3 p-2 hover:bg-[var(--LightBgGrey)] rounded cursor-pointer transition-colors">
                      <input 
                        type="radio" 
                        name="taskStatus" 
                        checked={formData.status === opt.value}
                        onChange={() => {
                          const label = opt.label.split('% ')[1] || opt.label;
                          setFormData({ ...formData, status: opt.value, statusLabel: label });
                          setShowStatusPopup(false);
                        }}
                      />
                      <span className="text-sm text-[var(--TextBlack)]">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <footer className="modal-footer">
                <button className="btn-default px-8" style={{ borderRadius: '2px' }} onClick={() => setShowStatusPopup(false)}>Cancel</button>
              </footer>
            </div>
          </div>
        )}

        {/* Categories Update Popup */}
        {showCategoriesPopup && (
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-container rounded-lg" style={{ width: '600px', height: '80vh' }}>
              <header className="modal-header">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="includeDesc" defaultChecked />
                  <label className="text-xs text-[var(--DisabledGrey)] cursor-pointer" htmlFor="includeDesc">Include description (info-icons) in search</label>
                </div>
                <button onClick={() => setShowCategoriesPopup(false)} className="text-[var(--DisabledGrey)] hover:text-[var(--TextBlack)]">
                  <X size={20} />
                </button>
              </header>

              <div className="modal-body p-6 flex flex-col">
                <div className="relative mb-4">
                  <input 
                    type="text" 
                    className="w-full pr-10" 
                    placeholder="Search Category" 
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 items-center">
                    {categorySearch && <X size={14} className="text-[var(--DisabledGrey)] cursor-pointer" onClick={() => setCategorySearch('')} />}
                    <Search size={14} className="text-[var(--DisabledGrey)]" />
                  </div>
                </div>

                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedCategories.map(cat => (
                      <div key={cat} className="bg-[var(--SiteBlue)] text-white px-2 py-1 rounded flex items-center gap-2 text-xs">
                        {cat}
                        <X size={14} className="cursor-pointer" onClick={() => handleCategoryToggle(cat)} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex relative flex-grow min-h-[300px]">
                  {/* Search Results */}
                  {categorySearch ? (
                    <div className="border border-[var(--BorderGrey)] rounded w-full overflow-auto max-h-[300px]">
                      {categoryData.flatMap(p => p.children.filter((c: string) => c.toLowerCase().includes(categorySearch.toLowerCase())).map((c: string) => ({ parent: p.label, child: c }))).map((res, i) => (
                        <div 
                          key={i} 
                          className="p-2 border-b border-[var(--BorderGrey)] last:border-0 text-sm cursor-pointer hover:bg-[var(--LightBgGrey)]"
                          onClick={() => {
                            handleCategoryToggle(res.child);
                            setCategorySearch('');
                          }}
                        >
                          <span className="text-[var(--DisabledGrey)]">{res.parent} &gt; </span>
                          <span className="text-[var(--SiteBlue)]">{res.child}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Parent List */}
                      <div className="border border-[var(--BorderGrey)] rounded w-[250px] overflow-y-auto">
                        {categoryData.map(parent => (
                          <div 
                            key={parent.id}
                            className={`p-2 border-b border-[var(--BorderGrey)] last:border-0 flex items-center justify-between cursor-pointer transition-colors ${hoveredParent === parent.id ? 'bg-[var(--LightBgGrey)]' : ''}`}
                            onMouseEnter={() => setHoveredParent(parent.id)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{parent.icon}</span>
                              <span className="text-sm text-[var(--SiteBlue)]">{parent.label}</span>
                            </div>
                            <ChevronRight size={14} className="text-[var(--SiteBlue)]" />
                          </div>
                        ))}
                      </div>

                      {/* Child List (on hover) */}
                      {hoveredParent && (
                        <div 
                          className="border border-[var(--BorderGrey)] rounded absolute bg-white shadow-xl w-[250px] max-h-full overflow-y-auto z-10" 
                          style={{ left: '250px', top: 0 }}
                          onMouseLeave={() => setHoveredParent(null)}
                        >
                          {categoryData.find(p => p.id === hoveredParent)?.children.map((child: string) => (
                            <div 
                              key={child}
                              className={`p-2 border-b border-[var(--BorderGrey)] last:border-0 text-sm cursor-pointer hover:bg-[var(--LightBgGrey)] flex items-center gap-2 ${selectedCategories.includes(child) ? 'bg-[var(--LightBgGrey)] font-bold' : ''}`}
                              onClick={() => handleCategoryToggle(child)}
                            >
                              {categoryData.find(p => p.id === hoveredParent)?.icon && (
                                <span className="text-sm">{categoryData.find(p => p.id === hoveredParent)?.icon}</span>
                              )}
                              <span className="text-[var(--SiteBlue)]">{child}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <footer className="modal-footer">
                <button className="btn-primary px-8" style={{ borderRadius: '2px' }} onClick={() => setShowCategoriesPopup(false)}>Done</button>
              </footer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProjectPopup;
