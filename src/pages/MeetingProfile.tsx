import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { format, differenceInMilliseconds } from 'date-fns';
import { Calendar, Clock, MapPin, Users, Briefcase, FileText, Upload, CheckSquare, File, ChevronLeft, Sparkles, AlertCircle, MessageSquare, LayoutGrid, LogIn, LogOut, Plus, Link as LinkIcon, ChevronDown, Edit2, Trash2, X, GripVertical, Copy, Loader2, Globe, Check, User as UserIcon, Eye } from 'lucide-react';
import { clsx } from 'clsx';
import { AncTool } from '../Global Common/AncTool';
import CreateTaskModal from '../components/CreateTaskModal';
import EditActionItemModal from '../components/EditActionItemModal';
import { PeoplePicker, UserModal } from '../Global Common/PeoplePicker';
import { ActionItem, AgendaItem, MeetingRole } from '../types';
import * as mammoth from 'mammoth';

type Tab = 'info' | 'transcript' | 'actionItems' | 'tasks' | 'documents' | 'attendance';

function AgendaItemCard({ item, index, meeting, onEdit, onDelete, currentUserRole, isDragging }: { item: AgendaItem, index: number, meeting: any, onEdit: (item: AgendaItem) => void, onDelete: (id: string) => void, currentUserRole: string, isDragging?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const owner = meeting.participants.find((p: any) => p.user.id === item.ownerId)?.user;
  const setActivePreviewFile = useStore(state => state.setActivePreviewFile);

  return (
    <div 
      className={clsx(
        "group border rounded-xl overflow-hidden transition-all duration-200",
        isDragging 
          ? "border-[var(--SiteBlue)] shadow-2xl ring-2 ring-blue-100 bg-white" 
          : "border-[var(--BorderGrey)] shadow-sm hover:shadow-md hover:border-[var(--BorderGrey)] hover:-translate-y-0.5",
        isExpanded && !isDragging ? "bg-[var(--LightBgGrey)]" : "bg-white"
      )}
    >
      <div className="flex items-stretch">
        {/* Drag Handle */}
        {currentUserRole !== 'Observer' && (
          <div className="w-10 flex items-start justify-center bg-white text-[var(--DisabledGrey)] group-hover:text-[var(--TextBlack)] cursor-grab active:cursor-grabbing transition-colors pt-[29px]">
            <GripVertical size={18} />
          </div>
        )}
        
        <div className="flex-1">
          <div 
            className="p-5 cursor-pointer flex items-start gap-4"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className={clsx(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mt-0.5 border transition-colors",
              isDragging ? "bg-blue-50 text-[var(--SiteBlue)] border-blue-200" : "bg-blue-50 text-[var(--SiteBlue)] border-blue-100"
            )}>
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <h4 className={clsx(
                    "text-base font-semibold truncate transition-colors",
                    isDragging ? "text-[var(--SiteBlue)]" : "text-[var(--TextBlack)] group-hover:text-[var(--SiteBlue)]"
                  )}>
                    {item.text}
                  </h4>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {item.priority && (
                      <span className={clsx(
                        "px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide",
                        item.priority === 'High' ? "bg-red-50 text-red-700 border border-red-100" :
                        item.priority === 'Medium' ? "bg-[var(--HighlightYellow)] text-[var(--TextBlack)] border border-amber-200" :
                        "bg-emerald-50 text-[var(--SuccessGreen)] border border-emerald-100"
                      )}>
                        {item.priority}
                      </span>
                    )}
                    {item.status && (
                      <span className={clsx(
                        "px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide",
                        item.status === 'Completed' ? "bg-emerald-50 text-[var(--SuccessGreen)] border border-emerald-100" :
                        item.status === 'In Progress' ? "bg-blue-50 text-[var(--SiteBlue)] border border-blue-100" :
                        "bg-[var(--LightBgGrey)] text-[var(--TextBlack)] border border-[var(--BorderGrey)]"
                      )}>
                        {item.status}
                      </span>
                    )}
                    {currentUserRole !== 'Observer' && (
                      <div className="flex items-center gap-1 ml-2 transition-opacity duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                          }}
                          className="p-1.5 text-[var(--DisabledGrey)] hover:text-[var(--SiteBlue)] hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit Agenda Item"
                        >
                          <Edit2 size={16} />
                        </button>
                        {currentUserRole === 'Organizer' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(item.id);
                            }}
                            className="p-1.5 text-[var(--DisabledGrey)] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Agenda Item"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    )}
                    <div 
                      className={clsx(
                        "text-[var(--DisabledGrey)] hover:text-[var(--TextBlack)] transition-all duration-300 ml-1",
                        isExpanded ? "rotate-180" : "rotate-0"
                      )}
                    >
                      <ChevronDown size={20} />
                    </div>
                  </div>
                </div>

                {/* Always show details instead of hiding them in accordion */}
                <div className="flex flex-wrap items-center gap-4 mt-1">
                  {owner && (
                    <div className="flex items-center gap-1.5 bg-[var(--LightBgGrey)] border border-[var(--BorderGrey)] px-2.5 py-1 rounded-md text-xs text-[var(--TextBlack)]">
                      <Users size={12} className="text-[var(--DisabledGrey)]" />
                      <span className="font-medium">{owner.name}</span>
                    </div>
                  )}
                  {item.tasks && (
                    <a 
                      href={item.tasks} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-[var(--LightBgGrey)] border border-[var(--BorderGrey)] px-2.5 py-1 rounded-md text-xs text-[var(--SiteBlue)] hover:bg-blue-50 hover:border-blue-100 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CheckSquare size={12} />
                      <span className="font-medium">Task Link</span>
                    </a>
                  )}
                  {item.documentUrl && (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const fileName = item.documentStoragePath?.split('_').slice(1).join('_') || item.text || 'Document';
                        setActivePreviewFile({
                          id: item.id,
                          name: fileName,
                          url: item.documentUrl!,
                          storagePath: item.documentStoragePath,
                          type: 'application/octet-stream',
                          meetingId: meeting.id,
                          agendaItemId: item.id
                        });
                      }}
                      className="flex items-center gap-1.5 bg-[var(--LightBgGrey)] border border-[var(--BorderGrey)] px-2.5 py-1 rounded-md text-xs text-[var(--SiteBlue)] hover:bg-blue-50 hover:border-blue-100 transition-colors"
                    >
                      <File size={12} />
                      <span className="font-medium">Related Document</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div 
            className={clsx(
              "grid transition-all duration-300 ease-in-out",
              isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <div className="px-5 pb-5 pt-2 border-t border-[var(--BorderGrey)]">
                <div className="pl-12 space-y-5">
                  <div className="text-sm text-[var(--DisabledGrey)]">
                    No further details.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditAgendaModal({ 
  isOpen, 
  onClose, 
  agendaItem, 
  onSave,
  meeting
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  agendaItem: AgendaItem | null; 
  onSave: (updatedItem: AgendaItem) => void;
  meeting: any;
}) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');
  const [ownerId, setOwnerId] = useState('');
  const [tasks, setTasks] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentStoragePath, setDocumentStoragePath] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Update local state when agendaItem changes
  useMemo(() => {
    if (agendaItem) {
      setText(agendaItem.text || '');
      setPriority(agendaItem.priority || 'Medium');
      setStatus(agendaItem.status || 'Pending');
      setOwnerId(agendaItem.ownerId || '');
      setTasks(agendaItem.tasks || '');
      setDocumentUrl(agendaItem.documentUrl || '');
      setDocumentStoragePath(agendaItem.documentStoragePath || '');
    }
  }, [agendaItem]);

  if (!isOpen || !agendaItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...agendaItem,
      text,
      priority,
      status,
      ownerId,
      tasks,
      documentUrl,
      documentStoragePath
    });
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !meeting) return;
    setIsUploading(true);
    try {
      const fileId = Math.random().toString(36).substring(7);
      const storagePath = `local/${meeting.id}/agenda/${fileId}_${file.name}`;
      const downloadURL = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Unable to read file'));
        reader.readAsDataURL(file);
      });
      setDocumentUrl(downloadURL);
      setDocumentStoragePath(storagePath);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container w-full max-w-4xl p-0">
        <div className="modal-header bg-white border-b border-[var(--BorderGrey)] p-4 rounded-t-lg">
          <h2 className="text-[var(--popupTitle)] font-semibold text-[var(--SiteBlue)]">Edit Agenda Item</h2>
          <button onClick={onClose} className="p-2 text-[var(--DisabledGrey)] hover:text-[var(--TextBlack)] hover:bg-[var(--LightBgGrey)] rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body space-y-4 bg-[var(--LightBgGrey)] p-4 rounded-b-lg">
          {/* ROW 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Agenda Title */}
            <div className="min-w-0 w-full">
              <label className="block text-sm font-medium mb-1 text-[var(--TextBlack)]">
                Agenda Title
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter agenda item title..."
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--SiteBlue)] text-sm"
                required
              />
            </div>

            {/* Related Documents */}
            <div className="min-w-0 w-full">
              <label className="block text-sm font-medium mb-1 text-[var(--TextBlack)]">
                Related Documents
              </label>
              <div className="flex gap-2 w-full">
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    value={documentUrl}
                    onChange={(e) => setDocumentUrl(e.target.value)}
                    placeholder="Paste URL or upload..."
                    className="w-full px-3 py-2 border rounded-md pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--SiteBlue)]"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    {documentUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          useStore.getState().setActivePreviewFile({
                            id: agendaItem?.id || '',
                            name: documentStoragePath?.split('_').slice(1).join('_') || 'Document',
                            url: documentUrl,
                            storagePath: documentStoragePath,
                            type: 'application/octet-stream',
                            meetingId: meeting.id,
                            agendaItemId: agendaItem?.id
                          });
                        }}
                        className="text-[var(--SiteBlue)] hover:text-[#1e3e6d]"
                      >
                        <Eye size={14} />
                      </button>
                    )}
                    <LinkIcon size={14} className="text-gray-400" />
                  </div>
                </div>
                {/* Upload */}
                <label className="flex items-center justify-center px-3 border rounded cursor-pointer bg-white">
                  {isUploading ? <Loader2 size={16} className="animate-spin text-gray-500" /> : <FileText size={16} className="text-gray-500" />}
                  <input
                    type="file"
                    className="hidden"
                    disabled={isUploading}
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>

            {/* Task Link */}
            <div className="min-w-0 w-full">
              <label className="block text-sm font-medium mb-1 text-[var(--TextBlack)]">
                Task Link
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tasks}
                  onChange={(e) => setTasks(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border rounded-md pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--SiteBlue)]"
                />
                <LinkIcon size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* ROW 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Priority */}
            <div className="min-w-0 w-full">
              <label className="block text-sm font-medium mb-1 text-[var(--TextBlack)]">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--SiteBlue)]"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Status */}
            <div className="min-w-0 w-full">
              <label className="block text-sm font-medium mb-1 text-[var(--TextBlack)]">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--SiteBlue)]"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Owner */}
            <div className="min-w-0 w-full">
              <PeoplePicker
                multiple={false}
                onSelectionChange={(users) => setOwnerId(users.length > 0 ? users[0].id : '')}
                placeholder="Select owner..."
                label="Owner"
                users={meeting?.participants?.map((p: any) => p.user) || []}
                value={meeting?.participants?.find((p: any) => p.user.id === ownerId) ? [meeting.participants.find((p: any) => p.user.id === ownerId).user] : []}
              />
            </div>
          </div>
        </form>

        <div className="modal-footer bg-white border-t border-[var(--BorderGrey)] p-4 rounded-b-lg">
          <button
            onClick={handleSubmit}
            className="btn-primary"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-default"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function SortableAgendaList({ 
  items, 
  meeting, 
  onEdit, 
  onDelete, 
  currentUserRole, 
  onReorder 
}: { 
  items: AgendaItem[], 
  meeting: any, 
  onEdit: (item: AgendaItem) => void, 
  onDelete: (id: string) => void, 
  currentUserRole: string,
  onReorder: (startIndex: number, endIndex: number) => void
}) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorder(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isDragging = draggedIndex === index;
        const isDragOver = dragOverIndex === index;
        const isDragOverTop = isDragOver && draggedIndex !== null && draggedIndex > index;
        const isDragOverBottom = isDragOver && draggedIndex !== null && draggedIndex < index;

        return (
          <div
            key={item.id}
            className="relative"
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
          >
            {isDragOverTop && (
              <div className="absolute -top-1.5 left-0 right-0 h-1 bg-indigo-500 rounded-full z-10 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
            )}
            
            <div
              draggable={currentUserRole !== 'Observer'}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              className={clsx(
                "transition-all duration-300 ease-in-out",
                isDragging ? "opacity-50 scale-[0.98] shadow-2xl z-50 relative" : "opacity-100 scale-100"
              )}
            >
              <AgendaItemCard 
                item={item} 
                index={index} 
                meeting={meeting}
                onEdit={onEdit}
                onDelete={onDelete}
                currentUserRole={currentUserRole}
                isDragging={isDragging}
              />
            </div>

            {isDragOverBottom && (
              <div className="absolute -bottom-1.5 left-0 right-0 h-1 bg-indigo-500 rounded-full z-10 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PasteTranscriptModal({
  isOpen,
  onClose,
  onSummarize,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSummarize: (text: string) => void;
}) {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container w-full max-w-2xl">
        <div className="modal-header">
          <h2 className="text-[var(--popupTitle)] font-semibold text-[var(--SiteBlue)]">Paste Transcript</h2>
          <button onClick={onClose} className="p-2 text-[var(--DisabledGrey)] hover:text-[var(--TextBlack)] hover:bg-[var(--LightBgGrey)] rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body p-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your meeting transcript here..."
            className="w-full h-96 p-4 border border-[var(--BorderGrey)] rounded-md outline-none resize-y font-mono text-sm bg-[var(--LightBgGrey)] text-[var(--TextBlack)]"
          />
        </div>
        <div className="modal-footer">
          <button
            onClick={() => {
              onSummarize(text);
              onClose();
            }}
            disabled={!text.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles size={16} />
            Summarize with AI
          </button>
          <button onClick={onClose} className="btn-default">Cancel</button>
        </div>
      </div>
    </div>
  );
}

const PageLoader = ({ active, message }: { active: boolean, message?: string }) => active ? (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
    <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 text-[var(--SiteBlue)] animate-spin" />
      <p className="text-sm font-medium text-[var(--TextBlack)]">{message || 'Saving changes...'}</p>
    </div>
  </div>
) : null;

export default function MeetingProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const meetings = useStore(state => state.meetings);
  const meeting = meetings.find(m => m.id === id);
  const updateMeeting = useStore(state => state.updateMeeting);
  const openMeetingModal = useStore(state => state.openMeetingModal);
  const allActionItems = useStore(state => state.actionItems);
  const actionItems = allActionItems.filter(a => a.meetingId === id);
  
  const currentUser = useStore(state => state.currentUser);
  const joinMeeting = useStore(state => state.joinMeeting);
  const leaveMeeting = useStore(state => state.leaveMeeting);
  const users = useStore(state => state.users);
  const teams = useStore(state => state.teams);
  
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [transcriptInput, setTranscriptInput] = useState(meeting?.transcriptText || '');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActionItem, setSelectedActionItem] = useState<ActionItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEditItem, setSelectedEditItem] = useState<ActionItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingAgendaItem, setEditingAgendaItem] = useState<AgendaItem | null>(null);
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [isPeoplePickerModalOpen, setIsPeoplePickerModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const updateActionItem = useStore(state => state.updateActionItem);
  const addActionItem = useStore(state => state.addActionItem);
  const addNotification = useStore(state => state.addNotification);
  const deleteMeeting = useStore(state => state.deleteMeeting);
  const setActivePreviewFile = useStore(state => state.setActivePreviewFile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDeletingMeeting, setIsDeletingMeeting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDeleteMeeting = async () => {
    if (!meeting) return;
    setIsDeletingMeeting(true);
    try {
      await deleteMeeting(meeting.id);
      navigate('/');
    } catch (error) {
      console.error('Failed to delete meeting:', error);
      setIsDeletingMeeting(false);
    }
  };

  const currentUserAttendance = meeting?.attendance?.[currentUser.id];
  const isCurrentlyJoined = currentUserAttendance?.sessions.some(s => !s.leaveTime);
  const currentUserRole = meeting?.participants.find(p => p.user.id === currentUser.id)?.role || 'Observer';

  const handleEditAgendaItem = (item: AgendaItem) => {
    setEditingAgendaItem(item);
    setIsAgendaModalOpen(true);
  };

  const handleDeleteAgendaItem = (itemId: string) => {
    setItemToDelete(itemId);
  };

  const confirmDeleteAgendaItem = async () => {
    if (!meeting || !itemToDelete) return;
    
    setIsSaving(true);
    try {
      const updatedAgendaItems = meeting.agendaItems?.filter(item => item.id !== itemToDelete) || [];
      await updateMeeting(meeting.id, { agendaItems: updatedAgendaItems });
      setItemToDelete(null);
      
      // Notify participants
      meeting.participants.forEach(p => {
        if (p.user.id !== currentUser.id) {
          addNotification({
            userId: p.user.id,
            message: `An agenda item was deleted in meeting: ${meeting.title}`,
            type: 'Meeting',
            read: false,
            createdAt: new Date().toISOString(),
            link: `/meetings/${meeting.id}`
          });
        }
      });
    } catch (error) {
      console.error('Failed to delete agenda item:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAgendaItem = async (updatedItem: AgendaItem) => {
    if (!meeting) return;
    
    setIsSaving(true);
    try {
      const existingItems = meeting.agendaItems || [];
      const itemExists = existingItems.some(item => item.id === updatedItem.id);
      
      let updatedAgendaItems;
      if (itemExists) {
        updatedAgendaItems = existingItems.map(item => 
          item.id === updatedItem.id ? updatedItem : item
        );
      } else {
        updatedAgendaItems = [...existingItems, updatedItem];
      }
      
      await updateMeeting(meeting.id, { agendaItems: updatedAgendaItems });
      
      // Notify participants
      meeting.participants.forEach(p => {
        if (p.user.id !== currentUser.id) {
          addNotification({
            userId: p.user.id,
            message: `An agenda item was ${itemExists ? 'updated' : 'added'} in meeting: ${meeting.title}`,
            type: 'Meeting',
            read: false,
            createdAt: new Date().toISOString(),
            link: `/meetings/${meeting.id}`
          });
        }
      });
    } catch (error) {
      console.error('Failed to save agenda item:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReorderAgendaItems = async (startIndex: number, endIndex: number) => {
    if (!meeting || !meeting.agendaItems) return;
    
    setIsSaving(true);
    try {
      const newItems = Array.from(meeting.agendaItems);
      const [removed] = newItems.splice(startIndex, 1);
      newItems.splice(endIndex, 0, removed);
      
      await updateMeeting(meeting.id, { agendaItems: newItems });
    } catch (error) {
      console.error('Failed to reorder agenda items:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const attendanceReport = useMemo(() => {
    if (!meeting) return [];
    
    return meeting.participants.map(participant => {
      const attendance = meeting.attendance?.[participant.user.id];
      let totalTimeSpentMs = 0;
      let firstJoin: string | null = null;
      let lastLeave: string | null = null;
      
      if (attendance && attendance.sessions.length > 0) {
        firstJoin = attendance.sessions[0].joinTime;
        
        attendance.sessions.forEach(session => {
          const start = new Date(session.joinTime).getTime();
          const end = session.leaveTime ? new Date(session.leaveTime).getTime() : Date.now();
          totalTimeSpentMs += (end - start);
          
          if (session.leaveTime) {
            if (!lastLeave || new Date(session.leaveTime) > new Date(lastLeave)) {
              lastLeave = session.leaveTime;
            }
          }
        });
      }
      
      const isUserCurrentlyJoined = attendance?.sessions.some(s => !s.leaveTime);
      
      const status = isUserCurrentlyJoined ? 'In Meeting' : 
                     (totalTimeSpentMs > 0 ? 'Attended' : 'Not Attended');
                     
      return {
        user: participant,
        firstJoin,
        lastLeave,
        totalTimeSpentMs,
        status
      };
    });
  }, [meeting]);

  const formatDuration = (ms: number) => {
    if (ms === 0) return '-';
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  if (!meeting) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--LightBgGrey)]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-[var(--TextBlack)] tracking-tight">Meeting not found</h2>
          <Link to="/" className="text-[var(--SiteBlue)] hover:underline mt-2 inline-block text-sm font-medium">Return to Overview</Link>
        </div>
      </div>
    );
  }

  const handleSaveTranscript = async () => {
    setIsSaving(true);
    try {
      await updateMeeting(meeting.id, { transcriptText: transcriptInput });
      // Notify participants
      meeting.participants.forEach(p => {
        if (p.user.id !== currentUser.id) {
          addNotification({
            userId: p.user.id,
            message: `Transcript updated for meeting: ${meeting.title}`,
            type: 'Meeting',
            read: false,
            createdAt: new Date().toISOString(),
            link: `/meetings/${meeting.id}`
          });
        }
      });
    } catch (error) {
      console.error('Failed to save transcript:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSummarizeText = async (textToSummarize: string) => {
    if (!textToSummarize.trim() || !meeting) return;
    
    setTranscriptInput(textToSummarize);
    updateMeeting(meeting.id, { transcriptText: textToSummarize });
    setIsSummarizing(true);
    try {
      const lines = textToSummarize
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const summarySource = lines.slice(0, 8).join(' ');
      const parsed = {
        summary: summarySource || 'Transcript captured. Review details and add key outcomes.',
        actionItems: lines
          .filter((line) => /action|todo|follow up|next step/i.test(line))
          .slice(0, 8)
          .map((line) => ({ description: line })),
      };
        
      updateMeeting(meeting.id, { 
        aiProcessed: true, 
        aiSummary: parsed.summary
      });

      if (parsed.actionItems && Array.isArray(parsed.actionItems)) {
        parsed.actionItems.forEach((item: any) => {
          const assignedUser = meeting.participants[0]?.user || currentUser;

          addActionItem({
            meetingId: meeting.id,
            description: item.description,
            assignedTo: assignedUser,
            status: 'Pending Review',
            source: 'AI-Extracted',
            linkedProject: meeting.project
          });
        });
      }

      setActiveTab('transcript');
      
      meeting.participants.forEach(p => {
          if (p.user.id !== currentUser.id) {
            addNotification({
              userId: p.user.id,
              message: `AI summary generated for meeting: ${meeting.title}`,
              type: 'Meeting',
              read: false,
              createdAt: new Date().toISOString(),
              link: `/meetings/${meeting.id}`
            });
          }
        });
    } catch (error) {
      console.error('Error summarizing transcript:', error);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSummarize = () => {
    handleSummarizeText(transcriptInput);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !meeting) return;

    try {
      let text = '';
      if (file.name.endsWith('.txt')) {
        text = await file.text();
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        alert('Unsupported file format. Please upload .txt or .docx');
        return;
      }

      setTranscriptInput(text);
      updateMeeting(meeting.id, { transcriptText: text });
      
      // Automatically summarize after upload
      handleSummarizeText(text);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read file.');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenModal = (item: ActionItem) => {
    setSelectedActionItem(item);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ActionItem) => {
    setSelectedEditItem(item);
    setIsEditModalOpen(true);
  };

  const handleApprove = (id: string, taskId?: string) => {
    updateActionItem(id, { status: 'Approved' });
    const item = allActionItems.find(a => a.id === id);
    // In a real app, this would trigger Flow 3 to create an OMT Task
    setTimeout(() => {
      const generatedTaskId = taskId || `TASK-${Math.floor(Math.random() * 1000)}`;
      updateActionItem(id, { status: 'Task Created', omtTaskId: generatedTaskId });
      
      if (item && item.assignedTo.id !== currentUser.id) {
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

  const handleCreateTask = (taskId: string) => {
    if (selectedActionItem) {
      handleApprove(selectedActionItem.id, taskId);
    }
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'info', label: 'Info', icon: FileText },
    { id: 'transcript', label: 'Transcript', icon: FileText },
    { id: 'actionItems', label: 'Action Items', icon: CheckSquare },
    { id: 'tasks', label: 'Linked Tasks', icon: Briefcase },
    { id: 'documents', label: 'Documents', icon: File },
    { id: 'attendance', label: 'Attendance', icon: Users },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[var(--LightBgGrey)] overflow-hidden">
      <PageLoader active={isDeletingMeeting} message="Deleting meeting..." />
      <PageLoader active={isSaving} />
      <PageLoader active={isSummarizing} message="AI is summarizing transcript..." />
      {/* Header */}
      <header className="bg-white border-b border-[var(--BorderGrey)] px-8 py-6 shrink-0">
        <div className="mx-auto">
          <Link to="/" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--DisabledGrey)] hover:text-[var(--TextBlack)] mb-4 transition-colors uppercase tracking-wider">
            <ChevronLeft size={14} />
            Back to Overview
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={clsx(
                  "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border",
                  meeting.status === 'Completed' ? "bg-[var(--LightBgGrey)] text-[var(--TextBlack)] border-[var(--BorderGrey)]" :
                  meeting.status === 'Scheduled' ? "bg-blue-50 text-[var(--SiteBlue)] border-blue-100" :
                  "bg-red-50 text-red-600 border-red-100"
                )}>
                  {meeting.status}
                </span>
                <span className="text-[10px] font-semibold text-[var(--DisabledGrey)] uppercase tracking-wider">{meeting.type}</span>
                {meeting.aiProcessed && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--SiteBlue)] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <Sparkles size={10} />
                    AI Processed
                  </span>
                )}
              </div>
              <h1 className="text-[var(--mainTitle)] font-bold text-[var(--SiteBlue)] tracking-tight">{meeting.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-[var(--TextBlack)]">
                <div className="flex items-center gap-1.5 bg-[var(--LightBgGrey)] border border-[var(--BorderGrey)] px-2.5 py-1 rounded-md">
                  <Calendar size={14} className="text-[var(--DisabledGrey)]" />
                  <span className="font-medium">{format(new Date(meeting.startDateTime), 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[var(--LightBgGrey)] border border-[var(--BorderGrey)] px-2.5 py-1 rounded-md">
                  <Clock size={14} className="text-[var(--DisabledGrey)]" />
                  <span className="font-medium">{format(new Date(meeting.startDateTime), 'h:mm a')} - {format(new Date(meeting.endDateTime), 'h:mm a')} {meeting.timeZone && `(${meeting.timeZone})`}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[var(--LightBgGrey)] border border-[var(--BorderGrey)] px-2.5 py-1 rounded-md">
                  <Briefcase size={14} className="text-[var(--DisabledGrey)]" />
                  <span className="font-medium">{meeting.project?.name || 'No Project'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[var(--LightBgGrey)] border border-[var(--BorderGrey)] px-2.5 py-1 rounded-md">
                  <Globe size={14} className="text-[var(--DisabledGrey)]" />
                  <span className="font-medium">{meeting.category || 'Online'}</span>
                </div>
                {meeting.location && (
                  <div className="flex items-center gap-1.5 bg-[var(--LightBgGrey)] border border-[var(--BorderGrey)] px-2.5 py-1 rounded-md">
                    <MapPin size={14} className="text-[var(--DisabledGrey)]" />
                    <span className="font-medium">{meeting.location}</span>
                  </div>
                )}
                {meeting.meetingLink && (
                  <a 
                    href={meeting.meetingLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md text-[var(--SiteBlue)] hover:bg-blue-100 transition-colors"
                  >
                    <LinkIcon size={14} />
                    <span className="font-medium">{meeting.platform || 'Meeting Link'}</span>
                  </a>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {meeting.status !== 'Completed' && (
                isCurrentlyJoined ? (
                  <button 
                    onClick={() => leaveMeeting(meeting.id, currentUser.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut size={16} />
                    Leave Meeting
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      joinMeeting(meeting.id, currentUser.id);
                      if (meeting.meetingLink) {
                        window.open(meeting.meetingLink, '_blank');
                      } else if (meeting.category === 'Online' || meeting.category === 'Hybrid') {
                        alert('Meeting link is not available.');
                      }
                    }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <LogIn size={16} />
                    Join {meeting.platform || 'Teams'}
                  </button>
                )
              )}
              {currentUserRole === 'Organizer' && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openMeetingModal(meeting.id)}
                    className="btn-default"
                  >
                    Edit Meeting
                  </button>
                  <button 
                    onClick={handleDeleteMeeting}
                    disabled={isDeletingMeeting}
                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm font-medium hover:bg-red-100 transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    {isDeletingMeeting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-[var(--BorderGrey)] px-8 shrink-0">
        <div className="mx-auto">
          <nav className="flex gap-8 space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === tab.id
                    ? "border-[var(--SiteBlue)] text-[var(--SiteBlue)]"
                    : "border-transparent text-[var(--DisabledGrey)] hover:text-[var(--TextBlack)] hover:border-[var(--BorderGrey)]"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.id === 'actionItems' && actionItems.length > 0 && (
                  <span className="ml-1.5 bg-[var(--LightBgGrey)] text-[var(--TextBlack)] py-0.5 px-2 rounded-full text-[10px] font-bold">
                    {actionItems.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto">
          
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="flex  gap-8">
              <div className="space-y-8">
                <section className="bg-white rounded-xl shadow-sm border border-[var(--BorderGrey)] p-6">
                  <h3 className="text-sm font-semibold text-[var(--TextBlack)] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-[var(--DisabledGrey)]" />
                    Description
                  </h3>
                  <div 
                    className="prose prose-sm max-w-none text-[var(--TextBlack)]"
                    dangerouslySetInnerHTML={{ __html: meeting.description || '<p class="text-[var(--DisabledGrey)] italic">No description provided.</p>' }}
                  />
                </section>

                {(meeting.agendaItems && meeting.agendaItems.length > 0) || currentUserRole !== 'Observer' ? (
                  <section className="bg-white rounded-xl shadow-sm border border-[var(--BorderGrey)] p-6">
                    <h3 className="text-sm font-semibold text-[var(--TextBlack)] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <LayoutGrid size={16} className="text-[var(--DisabledGrey)]" />
                      Agenda
                    </h3>
                    {meeting.agendaItems && meeting.agendaItems.length > 0 ? (
                      <SortableAgendaList 
                        items={meeting.agendaItems}
                        meeting={meeting}
                        onEdit={handleEditAgendaItem}
                        onDelete={handleDeleteAgendaItem}
                        currentUserRole={currentUserRole}
                        onReorder={handleReorderAgendaItems}
                      />
                    ) : (
                      <div className="text-center py-8 bg-[var(--LightBgGrey)] rounded-lg border border-dashed border-[var(--BorderGrey)]">
                        <p className="text-[var(--DisabledGrey)] text-sm mb-4">No agenda items yet.</p>
                        {currentUserRole !== 'Observer' && (
                          <button
                            onClick={() => {
                              const newItem: AgendaItem = {
                                id: `temp-${Date.now()}`,
                                text: 'New Agenda Item',
                                subItems: []
                              };
                              handleEditAgendaItem(newItem);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--SiteBlue)] bg-white border border-blue-100 hover:bg-blue-50 rounded-lg transition-colors shadow-sm"
                          >
                            <Plus size={16} />
                            Add First Agenda Item
                          </button>
                        )}
                      </div>
                    )}
                    {currentUserRole !== 'Observer' && meeting.agendaItems && meeting.agendaItems.length > 0 && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => {
                            const newItem: AgendaItem = {
                              id: `temp-${Date.now()}`,
                              text: 'New Agenda Item',
                              subItems: []
                            };
                            handleEditAgendaItem(newItem);
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--SiteBlue)] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Plus size={16} />
                          Add Agenda Item
                        </button>
                      </div>
                    )}
                  </section>
                ) : null}
                
                {meeting.aiProcessed && meeting.aiSummary && (
                  <section className="bg-blue-50/50 rounded-xl shadow-sm border border-blue-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="text-[var(--SiteBlue)]" size={18} />
                      <h3 className="text-sm font-semibold text-[var(--SiteBlue)] uppercase tracking-wider">AI Meeting Summary</h3>
                    </div>
                    <div className="prose prose-sm max-w-none text-[var(--TextBlack)]">
                      <p>{meeting.aiSummary}</p>
                    </div>
                  </section>
                )}
              </div>
              
              <div className="space-y-8">
                <section className="bg-white rounded-xl shadow-sm border border-[var(--BorderGrey)] p-6">
                  <h3 className="text-sm font-semibold text-[var(--TextBlack)] uppercase tracking-wider mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-[var(--DisabledGrey)]" />
                      Participants ({meeting.participants.length})
                    </div>
                    {currentUserRole === 'Organizer' && (
                      <button 
                        onClick={() => setIsPeoplePickerModalOpen(true)}
                        className="p-1 text-[var(--SiteBlue)] hover:bg-blue-50 rounded-full transition-colors"
                        title="Add Participants"
                      >
                        <Plus size={18} />
                      </button>
                    )}
                  </h3>
                  <div className="space-y-4">
                    {meeting.participants.map(p => (
                      <div key={p.user.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img src={p.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user.name)}&background=2F5596&color=fff`} alt={p.user.name} className="avatar-img bg-[var(--LightBgGrey)]" />
                          <div>
                            <p className="text-sm font-medium text-[var(--TextBlack)] flex items-center gap-2">
                              {p.user.name}
                              {currentUserRole !== 'Organizer' || p.user.id === currentUser.id ? (
                                <span className={clsx(
                                  "text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider",
                                  p.role === 'Organizer' ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                                  p.role === 'Participant' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                  "bg-[var(--LightBgGrey)] text-[var(--TextBlack)] border border-[var(--BorderGrey)]"
                                )}>
                                  {p.role}
                                </span>
                              ) : null}
                            </p>
                            <p className="text-xs text-[var(--DisabledGrey)]">{p.user.email}</p>
                          </div>
                        </div>
                        
                        {currentUserRole === 'Organizer' && p.user.id !== currentUser.id && (
                          <select
                            value={p.role}
                            onChange={(e) => {
                              const newRole = e.target.value as MeetingRole;
                              const updatedParticipants = meeting.participants.map(participant => 
                                participant.user.id === p.user.id 
                                  ? { ...participant, role: newRole } 
                                  : participant
                              );
                              updateMeeting(meeting.id, { participants: updatedParticipants });
                            }}
                            className="text-xs border border-[var(--BorderGrey)] rounded-md px-2 py-1 bg-[var(--LightBgGrey)] text-[var(--DisabledGrey)] focus:outline-none"
                          >
                            <option value="Organizer">Organizer</option>
                            <option value="Participant">Participant</option>
                            <option value="Observer">Observer</option>
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
                
                <section className="bg-white rounded-xl shadow-sm border border-[var(--BorderGrey)] p-6">
                  <h3 className="text-sm font-semibold text-[var(--TextBlack)] uppercase tracking-wider mb-4">Details</h3>
                  <dl className="space-y-4 text-sm">
                    <div>
                      <dt className="text-xs font-semibold text-[var(--DisabledGrey)] uppercase tracking-wider">Location</dt>
                      <dd className="mt-1 text-[var(--TextBlack)] font-medium">
                        {meeting.category === 'Offline' ? (
                          meeting.location || 'Not specified'
                        ) : meeting.category === 'Hybrid' ? (
                          <div className="space-y-1">
                            <div>{meeting.location}</div>
                            {meeting.meetingLink && (
                              <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="text-[var(--SiteBlue)] hover:underline flex items-center gap-1">
                                <LinkIcon size={12} />
                                {meeting.platform || 'Meeting Link'}
                              </a>
                            )}
                          </div>
                        ) : (
                          meeting.meetingLink ? (
                            <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="text-[var(--SiteBlue)] hover:underline flex items-center gap-1">
                              <LinkIcon size={12} />
                              {meeting.platform || 'Meeting Link'}
                            </a>
                          ) : (
                            meeting.platform || 'Microsoft Teams'
                          )
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-[var(--DisabledGrey)] uppercase tracking-wider">Created By</dt>
                      <dd className="mt-1 text-[var(--TextBlack)] font-medium">{meeting.createdBy?.name || 'Unknown'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-[var(--DisabledGrey)] uppercase tracking-wider">Storage Location</dt>
                      <dd className="mt-1 text-[var(--TextBlack)] font-medium">Local Storage</dd>
                    </div>
                  </dl>
                </section>
              </div>
            </div>
          )}

          {/* Transcript Tab */}
          {activeTab === 'transcript' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-[var(--BorderGrey)] overflow-hidden">
                <div className="p-6 border-b border-[var(--BorderGrey)] flex items-center justify-between bg-[var(--LightBgGrey)]">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--TextBlack)] uppercase tracking-wider">Meeting Transcript</h3>
                    <p className="text-xs text-[var(--DisabledGrey)] mt-1">Paste raw transcript or upload a file.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {currentUserRole !== 'Observer' && (
                      <>
                        <input 
                          type="file" 
                          accept=".txt,.docx" 
                          onChange={handleFileUpload} 
                          ref={fileInputRef} 
                          className="hidden" 
                        />
                        <button 
                          onClick={() => setIsPasteModalOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-[var(--BorderGrey)] text-[var(--TextBlack)] rounded-md text-sm font-medium hover:bg-[var(--LightBgGrey)] transition-colors shadow-sm"
                        >
                          <Copy size={16} />
                          Paste Transcript
                        </button>
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-[var(--BorderGrey)] text-[var(--TextBlack)] rounded-md text-sm font-medium hover:bg-[var(--LightBgGrey)] transition-colors shadow-sm"
                        >
                          <Upload size={16} />
                          Upload .docx/.txt
                        </button>
                        {meeting.transcriptText && (
                          <button 
                            onClick={handleSummarize}
                            disabled={isSummarizing}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--SiteBlue)] text-white rounded-md text-sm font-medium hover:opacity-90 transition-colors shadow-sm disabled:opacity-70"
                          >
                            {isSummarizing ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Sparkles size={16} />
                            )}
                            {isSummarizing ? 'Processing...' : meeting.aiProcessed ? 'Regenerate AI Summary' : 'Generate AI Summary'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  {meeting.aiProcessed && meeting.aiSummary && (
                    <div className="mb-6 bg-blue-50/50 rounded-xl shadow-sm border border-blue-100 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="text-[var(--SiteBlue)]" size={18} />
                        <h3 className="text-sm font-semibold text-[var(--SiteBlue)] uppercase tracking-wider">AI Meeting Summary</h3>
                      </div>
                      <div className="prose prose-sm max-w-none text-[var(--TextBlack)]">
                        <p>{meeting.aiSummary}</p>
                      </div>
                    </div>
                  )}
                  <textarea
                    value={transcriptInput}
                    onChange={(e) => setTranscriptInput(e.target.value)}
                    placeholder={currentUserRole !== 'Observer' ? "Paste meeting transcript here..." : "No transcript available."}
                    readOnly={currentUserRole === 'Observer'}
                    className="w-full h-96 p-4 border border-[var(--BorderGrey)] rounded-md outline-none transition-shadow resize-y font-mono text-sm bg-[var(--LightBgGrey)] text-[var(--TextBlack)]"
                  />
                  {currentUserRole !== 'Observer' && (
                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={handleSaveTranscript}
                        className="px-4 py-2 bg-[var(--SiteBlue)] text-white rounded-md text-sm font-semibold hover:opacity-90 transition-colors shadow-sm"
                      >
                        Save Transcript
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Items Tab */}
          {activeTab === 'actionItems' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--TextBlack)] uppercase tracking-wider">Action Items ({actionItems.length})</h3>
                <div className="flex items-center gap-4">
                  {selectedItems.size > 0 && (
                    <button
                      onClick={handleBulkApprove}
                      className="btn-primary flex items-center gap-2 py-1.5 px-3 text-xs"
                    >
                      <Check size={14} />
                      Approve Selected ({selectedItems.size})
                    </button>
                  )}
                  <Link 
                    to="/action-items"
                    className="text-xs font-semibold text-[var(--SiteBlue)] hover:underline uppercase tracking-wider"
                  >
                    Go to Review Interface &rarr;
                  </Link>
                </div>
              </div>
              
              {actionItems.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-[var(--BorderGrey)] overflow-hidden divide-y divide-[var(--BorderGrey)]">
                  {actionItems.map(item => (
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
                        <p className={clsx(
                          "font-bold text-sm",
                          (item.status === 'Task Created' || item.status === 'Approved') ? "text-[var(--DisabledGrey)] line-through" : "text-[var(--TextBlack)]"
                        )}>
                          {item.description}
                        </p>
                        
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
                      
                      {currentUserRole !== 'Observer' && (
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
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-[var(--BorderGrey)] p-12 text-center">
                  <CheckSquare className="mx-auto h-12 w-12 text-[var(--DisabledGrey)] mb-4" />
                  <h3 className="text-base font-medium text-[var(--TextBlack)]">No action items yet</h3>
                  <p className="text-sm text-[var(--DisabledGrey)] mt-1">Upload a transcript and generate an AI summary to extract action items.</p>
                  <button 
                    onClick={() => setActiveTab('transcript')}
                    className="mt-6 px-4 py-2 bg-blue-50 text-[var(--SiteBlue)] rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    Go to Transcript
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="bg-white rounded-xl shadow-sm border border-[var(--BorderGrey)] p-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-[var(--DisabledGrey)] mb-4" />
              <h3 className="text-base font-medium text-[var(--TextBlack)]">Linked OMT Tasks</h3>
              <p className="text-sm text-[var(--DisabledGrey)] mt-1">Tasks created from action items will appear here.</p>
              
              {actionItems.filter(a => a.omtTaskId).length > 0 && (
                <div className="mt-8 text-left max-w-2xl mx-auto divide-y divide-[var(--BorderGrey)] border border-[var(--BorderGrey)] rounded-xl overflow-hidden">
                  {actionItems.filter(a => a.omtTaskId).map(item => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-[var(--LightBgGrey)] transition-colors">
                      <div>
                        <p className="font-medium text-[var(--TextBlack)] text-sm">{item.description}</p>
                        <p className="text-xs text-[var(--DisabledGrey)] mt-1">Assigned to <span className="font-medium">{item.assignedTo.name}</span></p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono font-medium text-[var(--DisabledGrey)] bg-[var(--LightBgGrey)] border border-[var(--BorderGrey)] px-2.5 py-1 rounded-md">
                          {item.omtTaskId}
                        </span>
                        <a href="#" className="text-[var(--SiteBlue)] hover:underline text-xs font-semibold uppercase tracking-wider">View Task</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-xl shadow-sm border border-[var(--BorderGrey)] overflow-hidden">
              <div className="p-6 border-b border-[var(--BorderGrey)] bg-[var(--LightBgGrey)] flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--TextBlack)] uppercase tracking-wider">Meeting Documents</h3>
                  <p className="text-xs text-[var(--DisabledGrey)] mt-1">Files stored in Local Storage.</p>
                </div>
                <div className="relative z-10">
                  {currentUserRole !== 'Observer' && (
                    <AncTool 
                      item={meeting} 
                      Context={null} 
                      siteUrl="" 
                      listName="Meetings" 
                      onFilesUpdated={(files) => {
                        if (files.length > uploadedFiles.length) {
                          // Notify participants
                          meeting.participants.forEach(p => {
                            if (p.user.id !== currentUser.id) {
                              addNotification({
                                userId: p.user.id,
                                message: `A new document was uploaded to meeting: ${meeting.title}`,
                                type: 'Meeting',
                                read: false,
                                createdAt: new Date().toISOString(),
                                link: `/meetings/${meeting.id}`
                              });
                            }
                          });
                        }
                        setUploadedFiles(files);
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="border border-[var(--BorderGrey)] rounded-xl divide-y divide-[var(--BorderGrey)] overflow-hidden">
                  {uploadedFiles.map((file) => (
                    <div 
                      key={file.Id} 
                      className="p-4 flex items-center gap-4 hover:bg-[var(--LightBgGrey)] transition-colors group cursor-pointer" 
                      onClick={() => {
                        const fileMeta = meeting.files?.find(f => f.id === String(file.Id));
                        if (fileMeta) {
                          setActivePreviewFile({
                            ...fileMeta,
                            meetingId: meeting.id
                          });
                        } else {
                          // Fallback if metadata not found in meeting.files (e.g. just uploaded)
                          window.open(file.ServerRelativeUrl, '_blank');
                        }
                      }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-[var(--SiteBlue)] flex items-center justify-center shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--TextBlack)] truncate">{file.Name}</p>
                        <p className="text-xs text-[var(--DisabledGrey)] mt-0.5">Uploaded to Local Storage</p>
                      </div>
                      <div className="text-xs font-medium text-[var(--DisabledGrey)]">
                        {new Date(file.TimeLastModified).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {uploadedFiles.length === 0 && (
                    <div className="p-8 text-center text-sm text-[var(--DisabledGrey)]">
                      No documents uploaded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-[var(--BorderGrey)] overflow-hidden">
                <div className="p-6 border-b border-[var(--BorderGrey)] bg-[var(--LightBgGrey)] flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--TextBlack)] uppercase tracking-wider">Attendance Report</h3>
                    <p className="text-xs text-[var(--DisabledGrey)] mt-1">Track participant join and leave times.</p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[var(--LightBgGrey)] border-b border-[var(--BorderGrey)] text-xs font-semibold text-[var(--DisabledGrey)] uppercase tracking-wider">
                        <th className="px-6 py-4">Participant</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">First Join</th>
                        <th className="px-6 py-4">Last Leave</th>
                        <th className="px-6 py-4 text-right">Total Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--BorderGrey)]">
                      {attendanceReport.map((record) => (
                        <tr key={record.user.user.id} className="hover:bg-[var(--LightBgGrey)] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={record.user.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(record.user.user.name)}&background=2F5596&color=fff`} alt={record.user.user.name} className="avatar-img bg-[var(--LightBgGrey)]" />
                              <div>
                                <div className="font-medium text-[var(--TextBlack)] text-sm">{record.user.user.name}</div>
                                <div className="text-xs text-[var(--DisabledGrey)] mt-0.5">{record.user.user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={clsx(
                              "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border uppercase tracking-wider",
                              record.status === 'Attended' ? "bg-emerald-50 text-[var(--SuccessGreen)] border-emerald-100" :
                              record.status === 'In Meeting' ? "bg-blue-50 text-[var(--SiteBlue)] border-blue-100" :
                              "bg-[var(--LightBgGrey)] text-[var(--DisabledGrey)] border-[var(--BorderGrey)]"
                            )}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-[var(--DisabledGrey)]">
                            {record.firstJoin ? format(new Date(record.firstJoin), 'h:mm:ss a') : '-'}
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-[var(--DisabledGrey)]">
                            {record.lastLeave ? format(new Date(record.lastLeave), 'h:mm:ss a') : (record.status === 'In Meeting' ? 'Present' : '-')}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-[var(--TextBlack)] text-right">
                            {formatDuration(record.totalTimeSpentMs)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* People Picker Modal */}
      <UserModal
        isOpen={isPeoplePickerModalOpen}
        onClose={() => setIsPeoplePickerModalOpen(false)}
        onSave={(users) => {
          if (!meeting) return;
          const updatedParticipants = users.map(user => {
            const existing = meeting.participants.find(p => p.user.id === user.id);
            return existing || { user, role: 'Participant' as const };
          });
          updateMeeting(meeting.id, { participants: updatedParticipants });
          setIsPeoplePickerModalOpen(false);
        }}
        initialSelected={meeting?.participants.map(p => p.user) || []}
        users={users}
        teams={teams}
      />

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actionItem={selectedActionItem}
        onCreate={handleCreateTask}
      />

      <EditActionItemModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEditItem(null);
        }}
        actionItem={selectedEditItem}
        onSave={updateActionItem}
      />

      <EditAgendaModal
        isOpen={isAgendaModalOpen}
        onClose={() => {
          setIsAgendaModalOpen(false);
          setEditingAgendaItem(null);
        }}
        agendaItem={editingAgendaItem}
        onSave={handleSaveAgendaItem}
        meeting={meeting}
      />

      <PasteTranscriptModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onSummarize={handleSummarizeText}
      />

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="modal-overlay">
          <div className="modal-container max-w-md h-auto rounded-xl overflow-hidden">
            <header className="modal-header">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle size={24} />
                <h3 className="text-[var(--popupTitle)] font-semibold">Delete Agenda Item</h3>
              </div>
              <button onClick={() => setItemToDelete(null)} className="text-[var(--TextBlack)] hover:text-[var(--SiteBlue)] transition-colors">
                <X size={20} />
              </button>
            </header>
            <div className="modal-body p-6">
              <p className="text-[var(--TextBlack)]">Are you sure you want to delete this agenda item? This action cannot be undone.</p>
            </div>
            <footer className="modal-footer">
              <button
                onClick={confirmDeleteAgendaItem}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Delete
              </button>
              <button
                onClick={() => setItemToDelete(null)}
                className="btn-default"
              >
                Cancel
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
