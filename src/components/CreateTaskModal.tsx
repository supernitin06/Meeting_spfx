import React, { useState, useEffect } from 'react';
import { X, Play, Loader2 } from 'lucide-react';
import { ActionItem } from '../types';
import { useStore } from '../store/useStore';
import { SearchInput } from '../SelectProject/SearchInput';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionItem: ActionItem | null;
  onCreate: (taskId: string) => void;
}

const websitesSP = [
  { id: 'da', label: 'ALAKDigital', text: 'DA', color: 'bg-[#6b7280]' },
  { id: 'de', label: 'DE', text: 'DE', color: 'bg-[#6b7280]', textColor: 'text-green-400' },
  { id: 'edu', label: 'Education', icon: 'building', color: 'bg-[#6b7280]' },
  { id: 'ei', label: 'EI', text: 'e+i', color: 'bg-[#6b7280]' },
  { id: 'eps', label: 'EPS', text: 'EPS', color: 'bg-[#6b7280]', textColor: 'text-red-500', bgInner: 'bg-white' },
  { id: 'gruene', label: 'Gruene', icon: 'gruene', color: 'bg-[#1f2937]' },
  { id: 'hhhh', label: 'HHHH', text: 'HHHH', color: 'bg-[#3b82f6]' },
  { id: 'ilf', label: 'ILF', icon: 'ilf', color: 'bg-[#3b82f6]' },
  { id: 'kb', label: 'KathaBeck', text: 'KB', color: 'bg-[#6b7280]', textColor: 'text-green-400' },
  { id: 'mig', label: 'Migration', icon: 'migration', color: 'bg-[#6b7280]' },
  { id: 'share', label: 'Shareweb', icon: 'share', color: 'bg-[#6b7280]' },
  { id: 'small', label: 'Small Projects', icon: 'small', color: 'bg-[#6b7280]' },
  { id: 'smart', label: 'SmartAdmin', text: 'SM', color: 'bg-[#1f2937]', textColor: 'text-teal-400' },
];

export default function CreateTaskModal({ isOpen, onClose, actionItem, onCreate }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [needsAutoMatch, setNeedsAutoMatch] = useState(false);
  const portfolioItems = useStore(state => state.portfolioItems);
  
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('');

  // Extract unique projects
  const uniqueProjects = Array.from(new Map(portfolioItems.map(item => [item.projectId, { id: item.projectId, title: item.projectTitle }])).values());
  
  // Extract unique components from all portfolio items
  const uniqueComponents = Array.from(new Map(portfolioItems.map(item => [item.componentId, { id: item.componentId, title: item.componentTitle }])).values());

  const handleMatchPortfolio = async (matchTitle: string, matchDesc: string) => {
    if (!matchTitle && !matchDesc) return;
    
    setIsMatching(true);
    try {
      const query = `${matchTitle} ${matchDesc}`.toLowerCase();
      const matchedProject = portfolioItems.find(
        (p) => query.includes((p.projectTitle || '').toLowerCase())
      );
      const matchedComponent = portfolioItems.find(
        (p) => query.includes((p.componentTitle || '').toLowerCase())
      );

      if (matchedProject) {
        setSelectedProject(matchedProject.projectTitle);
      }
      if (matchedComponent) {
        setSelectedComponent(matchedComponent.componentTitle);
      }
    } catch (error) {
      console.error('Failed to match portfolio:', error);
    } finally {
      setIsMatching(false);
    }
  };

  useEffect(() => {
    if (actionItem && isOpen) {
      setTitle(actionItem.description);
      
      if (actionItem.taskDescription) {
        setDescription(actionItem.taskDescription);
        setIsGenerating(false);
        setNeedsAutoMatch(true);
      } else {
        setDescription('');
        
        const generateDescription = async () => {
          setIsGenerating(true);
          try {
            setDescription(`Task: ${actionItem.description}. Please execute this item and provide a concise implementation/update note once completed.`);
            setNeedsAutoMatch(true);
          } catch (error) {
            console.error('Failed to generate description:', error);
          } finally {
            setIsGenerating(false);
          }
        };

        generateDescription();
      }
    }
  }, [actionItem, isOpen]);

  useEffect(() => {
    if (needsAutoMatch && !isGenerating && title && description && portfolioItems.length > 0) {
      setNeedsAutoMatch(false);
      handleMatchPortfolio(title, description);
    }
  }, [needsAutoMatch, isGenerating, title, description, portfolioItems]);

  if (!isOpen) return null;

  const handleCreate = () => {
    onCreate(`TASK-${Math.floor(Math.random() * 1000)}`);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container rounded-lg w-full max-w-5xl h-[90vh]">
        {/* Header */}
        <header className="modal-header">
          <h2 className="text-[var(--popupTitle)] font-semibold text-[var(--SiteBlue)]">Create Task</h2>
          <button onClick={onClose} className="text-[var(--TextBlack)] hover:text-[var(--SiteBlue)] transition-colors">
            <X size={20} />
          </button>
        </header>

        {/* Content */}
        <div className="modal-body flex gap-8">
          {/* Left Column */}
          <div className="flex-1 space-y-6">
            <div>
              <label className="block text-[15px] font-semibold text-[var(--TextBlack)] mb-2">Task Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="relative">
              <label className="block text-[15px] font-semibold text-[var(--TextBlack)] mb-2">Task Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isGenerating}
                placeholder={isGenerating ? 'AI is generating description...' : ''}
                className="w-full min-h-[300px] px-3 py-2 border border-[var(--BorderGrey)] focus:outline-none resize-none disabled:bg-gray-50 disabled:text-gray-500"
              />
              {isGenerating && (
                <div className="absolute top-10 right-3">
                  <Loader2 size={16} className="animate-spin text-[var(--SiteBlue)]" />
                </div>
              )}
            </div>

            
          </div>

          {/* Right Column */}
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[15px] font-semibold text-[var(--TextBlack)]">Suggested Portfolio</h3>
                <button 
                  className="text-xs bg-[var(--SiteBlue)] text-white px-3 py-1 rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1 disabled:opacity-50"
                  onClick={() => handleMatchPortfolio(title, description)}
                  disabled={isMatching || (!title && !description)}
                >
                  {isMatching ? <Loader2 size={12} className="animate-spin" /> : null}
                  Match Portfolio
                </button>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <SearchInput
                    label="Select Project"
                    placeholder="Search Project/Sprints/Cycle"
                    value={selectedProject}
                    onChange={(e) => {
                      setSelectedProject(e.target.value);
                      setSelectedComponent(''); // Reset component when project changes
                    }}
                    popupTitle="Select Project"
                    popupSubtitle="Search and select projects to link with your task."
                    data={uniqueProjects.map(p => ({
                      id: p.id,
                      title: p.title,
                      team: [],
                      status: 0,
                      clientCategory: '',
                      workingAction: '',
                      items: 0,
                      dueDate: ''
                    }))}
                  />
                </div>
                <div className="relative">
                  <SearchInput
                    label="Select Portfolio"
                    placeholder="Search Portfolio/Components"
                    value={selectedComponent}
                    onChange={(e) => setSelectedComponent(e.target.value)}
                    popupTitle="Select Portfolio"
                    popupSubtitle="Search and select portfolio components to link with your task."
                    data={uniqueComponents.map(c => ({
                      id: c.id,
                      title: c.title,
                      team: [],
                      status: 0,
                      clientCategory: '',
                      workingAction: '',
                      items: 0,
                      dueDate: ''
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="modal-footer">
          <button
            onClick={handleCreate}
            className="btn-primary"
          >
            Create
          </button>
          <button
            onClick={onClose}
            className="btn-default"
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
}
