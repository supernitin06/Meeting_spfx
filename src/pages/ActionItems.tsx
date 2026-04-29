import React from 'react';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { Check, X, Edit2, Calendar, Briefcase, User as UserIcon, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import CreateTaskModal from '../components/CreateTaskModal';
import EditActionItemModal from '../components/EditActionItemModal';
import { ActionItem } from '../types';

export default function ActionItems() {
  const actionItems = useStore(state => state.actionItems);
  const meetings = useStore(state => state.meetings);
  const updateActionItem = useStore(state => state.updateActionItem);
  const addNotification = useStore(state => state.addNotification);
  const currentUser = useStore(state => state.currentUser);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActionItem, setSelectedActionItem] = useState<ActionItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEditItem, setSelectedEditItem] = useState<ActionItem | null>(null);

  const pendingItems = actionItems.filter(item => item.status === 'Pending Review');
  const processedItems = actionItems.filter(item => item.status !== 'Pending Review');

  const pendingItemsByMeeting = pendingItems.reduce((acc, item) => {
    if (!acc[item.meetingId]) acc[item.meetingId] = [];
    acc[item.meetingId].push(item);
    return acc;
  }, {} as Record<string, ActionItem[]>);

  const recentProcessedItems = processedItems.slice(0, 5);
  const processedItemsByMeeting = recentProcessedItems.reduce((acc, item) => {
    if (!acc[item.meetingId]) acc[item.meetingId] = [];
    acc[item.meetingId].push(item);
    return acc;
  }, {} as Record<string, ActionItem[]>);

  const handleApprove = (id: string, taskId?: string) => {
    updateActionItem(id, { status: 'Approved' });
    const item = actionItems.find(a => a.id === id);
    // In a real app, this would trigger Flow 3 to create an OMT Task
    setTimeout(() => {
      const generatedTaskId = taskId || `TASK-${Math.floor(Math.random() * 1000)}`;
      updateActionItem(id, { status: 'Task Created', omtTaskId: generatedTaskId });
      
      if (item && currentUser && item.assignedTo.id !== currentUser.id) {
        addNotification({
          userId: item.assignedTo.id,
          message: `A new task was assigned to you: ${item.description}`,
          type: 'Task',
          read: false,
          createdAt: new Date().toISOString(),
          link: `/action-items`
        });
      }
    }, 1500);
  };

  const handleOpenModal = (item: ActionItem) => {
    setSelectedActionItem(item);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ActionItem) => {
    setSelectedEditItem(item);
    setIsEditModalOpen(true);
  };

  const handleCreateTask = (taskId: string) => {
    if (selectedActionItem) {
      handleApprove(selectedActionItem.id, taskId);
    }
  };

  const handleDismiss = (id: string) => {
    updateActionItem(id, { status: 'Dismissed' });
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };




  const handleBulkApprove = () => {
    selectedItems.forEach(id => handleApprove(id));
    setSelectedItems(new Set());
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white p-8">
      <div className="mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-[var(--mainTitle)] font-bold text-[var(--SiteBlue)]">Action Items Review</h1>
            <p className="text-sm text-[var(--TextBlack)] mt-1">Review and approve AI-extracted action items.</p>
          </div>
          {selectedItems.size > 0 && (
            <button
              onClick={handleBulkApprove}
              className="btn-primary flex items-center gap-2"
            >
              <Check size={16} />
              Approve Selected ({selectedItems.size})
            </button>
          )}
        </header>

        <section className="space-y-6">
          <h2 className="text-sm font-bold text-[var(--TextBlack)] uppercase tracking-wider">Pending Review ({pendingItems.length})</h2>
          
          {pendingItems.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(pendingItemsByMeeting).map(([meetingId, items]) => {
                const meeting = meetings.find(m => m.id === meetingId);
                const meetingTitle = meeting ? meeting.title : 'Unknown Meeting';
                
                return (
                  <div key={meetingId} className="space-y-3">
                    <h3 className="text-sm font-bold text-[var(--SiteBlue)] bg-blue-50 px-3 py-2 rounded-md border border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        {meetingTitle}
                      </div>
                      {meeting && meeting.startDateTime && (
                        <span className="text-xs font-medium text-[var(--SiteBlue)] opacity-80">
                          {format(new Date(meeting.startDateTime), 'MMM d, yyyy')}
                        </span>
                      )}
                    </h3>
                    <div className="divide-y divide-[var(--BorderGrey)] border border-[var(--BorderGrey)] rounded-lg overflow-hidden bg-white">
                      {items.map(item => (
                        <div key={item.id} className={clsx(
                          "p-5 flex items-start gap-4 transition-colors",
                          selectedItems.has(item.id) ? "bg-blue-50/30" : "hover:bg-[var(--LightBgGrey)]"
                        )}>
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(item.id)}
                              onChange={() => toggleSelection(item.id)}
                              className="w-4 h-4 text-[var(--SiteBlue)] rounded border-[var(--BorderGrey)]"
                            />
                          </div>
                          <div className="flex-1 space-y-3 min-w-0">
                            <p className="text-[var(--TextBlack)] font-bold text-sm">{item.description}</p>
                            
                            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--TextBlack)]">
                              <div className="flex items-center gap-1.5 bg-[var(--LightBgGrey)] border border-[var(--BorderGrey)] px-2 py-1 rounded-md">
                                <UserIcon size={12} className="text-[var(--DisabledGrey)]" />
                                <span className="font-medium">{item.assignedTo.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-[var(--LightBgGrey)] border border-[var(--BorderGrey)] px-2 py-1 rounded-md">
                                <Briefcase size={12} className="text-[var(--DisabledGrey)]" />
                                <span className="font-medium">{item.linkedProject.name}</span>
                              </div>
                              {item.dueDate && (
                                <div className="flex items-center gap-1.5 bg-[var(--LightBgGrey)] border border-[var(--BorderGrey)] px-2 py-1 rounded-md">
                                  <Calendar size={12} className="text-[var(--DisabledGrey)]" />
                                  <span className="font-medium">{format(new Date(item.dueDate), 'MMM d, yyyy')}</span>
                                </div>
                              )}
                              <span className="text-[10px] font-bold text-[var(--SiteBlue)] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full ml-auto uppercase tracking-wider">
                                {item.source}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 ml-4">
                            <button 
                              onClick={() => handleApprove(item.id)}
                              className="p-1.5 text-[var(--SuccessGreen)] hover:bg-emerald-50 rounded-[4px] transition-colors border border-[#918D8D]"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => handleOpenModal(item)}
                              className="p-1.5 text-[var(--SiteBlue)] hover:bg-blue-50 rounded-[4px] transition-colors border border-[#918D8D]"
                              title="Create Task"
                            >
                              <Plus size={18} />
                            </button>
                            <button 
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-[var(--DisabledGrey)] hover:bg-[var(--LightBgGrey)] hover:text-[var(--TextBlack)] rounded-[4px] transition-colors border border-[#918D8D]"
                              title="Edit Action Item"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDismiss(item.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-[4px] transition-colors border border-[#918D8D]"
                              title="Dismiss"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>

        {processedItems.length > 0 && (
          <div className="space-y-6 pt-4">
            <h2 className="text-sm font-bold text-[var(--TextBlack)] uppercase tracking-wider">Recently Processed</h2>
            <div className="space-y-6">
              {Object.entries(processedItemsByMeeting).map(([meetingId, items]) => {
                const meeting = meetings.find(m => m.id === meetingId);
                const meetingTitle = meeting ? meeting.title : 'Unknown Meeting';
                
                return (
                  <div key={meetingId} className="space-y-3">
                    <h3 className="text-sm font-bold text-[var(--SiteBlue)] bg-blue-50 px-3 py-2 rounded-md border border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        {meetingTitle}
                      </div>
                      {meeting && meeting.startDateTime && (
                        <span className="text-xs font-medium text-[var(--SiteBlue)] opacity-80">
                          {format(new Date(meeting.startDateTime), 'MMM d, yyyy')}
                        </span>
                      )}
                    </h3>
                    <div className="bg-white rounded-lg shadow-sm border border-[var(--BorderGrey)] overflow-hidden">
                      <div className="divide-y divide-[var(--BorderGrey)]">
                        {items.map(item => (
                          <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--LightBgGrey)] transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-[var(--TextBlack)] font-bold text-sm truncate">{item.description}</p>
                              <p className="text-xs text-[var(--DisabledGrey)] mt-0.5">Assigned to <span className="font-medium">{item.assignedTo.name}</span></p>
                            </div>
                            <div className="flex items-center gap-3">
                              {item.omtTaskId && (
                                <span className="text-[11px] font-mono font-medium text-[var(--DisabledGrey)] bg-[var(--LightBgGrey)] border border-[var(--BorderGrey)] px-2 py-0.5 rounded-md">
                                  {item.omtTaskId}
                                </span>
                              )}
                              <span className={clsx(
                                "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border",
                                item.status === 'Task Created' ? "bg-emerald-50 text-[var(--SuccessGreen)] border-emerald-100" :
                                item.status === 'Approved' ? "bg-blue-50 text-[var(--SiteBlue)] border-blue-100" :
                                "bg-[var(--LightBgGrey)] text-[var(--TextBlack)] border-[var(--BorderGrey)]"
                              )}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actionItem={selectedActionItem}
        onCreate={handleCreateTask}
      />
      
      <EditActionItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        actionItem={selectedEditItem}
        onSave={updateActionItem}
      />
    </div>
  );
}
