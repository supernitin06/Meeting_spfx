
import React, { useState, useEffect } from 'react';
import Modal from './CentralizedModal';

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  fields: string[];
  selectedFields: string[];
  onApply: (fields: string[]) => void; 
}

// AdvancedSearchModal component for configuring search fields
const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({ isOpen, onClose, fields, selectedFields, onApply }) => {
  const [localFields, setLocalFields] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) setLocalFields([...selectedFields]);
  }, [isOpen, selectedFields]);

  const handleToggle = (f: string) => {
    setLocalFields(prev => prev.includes(f) ? prev.filter(item => item !== f) : [...prev, f]);
  };

  const footer = (
    <div className="flex justify-end gap-2 w-full py-1">
      <button className="btn-primary" onClick={() => onApply(localFields)}>Apply Fields</button>
      <button className="btn-default" onClick={onClose}>Cancel</button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Advanced Search" size="md" footer={footer} zIndex={1150}>
      <div className="p-2">
        <p className="text-xs text-[#918D8D] mb-3">Select the fields to include in the global search functionality:</p>
        {fields?.map(f => (
          <div key={f} className="flex items-center mb-2 gap-2">
            <input type="checkbox" checked={localFields.includes(f)} onChange={() => handleToggle(f)} id={`adv-${f}`} />
            <label className="text-sm cursor-pointer mb-0" htmlFor={`adv-${f}`}>{f}</label>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default AdvancedSearchModal;
