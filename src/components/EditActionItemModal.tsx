import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ActionItem, User } from '../types';
import { useStore } from '../store/useStore';

interface EditActionItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionItem: ActionItem | null;
  onSave: (id: string, updates: Partial<ActionItem>) => void;
}

export default function EditActionItemModal({ isOpen, onClose, actionItem, onSave }: EditActionItemModalProps) {
  const users = useStore(state => state.users);
  
  const [description, setDescription] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedToId, setAssignedToId] = useState('');

  useEffect(() => {
    if (actionItem && isOpen) {
      setDescription(actionItem.description);
      setTaskDescription(actionItem.taskDescription || '');
      setDueDate(actionItem.dueDate ? actionItem.dueDate.split('T')[0] : '');
      setAssignedToId(actionItem.assignedTo.id);
    }
  }, [actionItem, isOpen]);

  if (!isOpen || !actionItem) return null;

  const handleSave = () => {
    const assignedUser = users.find(u => u.id === assignedToId) || actionItem.assignedTo;
    
    onSave(actionItem.id, {
      description,
      taskDescription,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      assignedTo: assignedUser,
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container rounded-lg w-full max-w-lg">
        {/* Header */}
        <header className="modal-header">
          <h2 className="text-[var(--popupTitle)] font-semibold text-[var(--SiteBlue)]">Edit Action Item</h2>
          <button onClick={onClose} className="text-[var(--TextBlack)] hover:text-[var(--SiteBlue)] transition-colors">
            <X size={20} />
          </button>
        </header>

        {/* Content */}
        <div className="modal-body space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--TextBlack)] mb-1">Task Title</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--BorderGrey)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--SiteBlue)]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--TextBlack)] mb-1">Task Description</label>
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-[var(--BorderGrey)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--SiteBlue)] resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-[var(--TextBlack)] mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--BorderGrey)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--SiteBlue)]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--TextBlack)] mb-1">Assigned User</label>
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--BorderGrey)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--SiteBlue)]"
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <footer className="modal-footer flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--TextBlack)] hover:bg-[var(--LightBgGrey)] rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
          >
            Save Changes
          </button>
        </footer>
      </div>
    </div>
  );
}
