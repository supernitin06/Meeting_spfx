import React from 'react';
import { X, Info, Edit2 } from 'lucide-react';

interface CreateSprintPopupProps {
  onClose: () => void;
}

export function CreateSprintPopup({ onClose }: CreateSprintPopupProps) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{ zIndex: 1200 }}
    >
      <div
        className="modal-container rounded-lg"
        style={{ width: '600px', height: 'auto', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="modal-header">
          <div className="flex items-center text-xs">
            <span className="px-2 py-1 bg-gray-200 rounded-l">PX Management Overview</span>
            <span className="px-2 py-1 text-[var(--SiteBlue)] bg-gray-100 rounded-r underline cursor-pointer">SharePoint Framework - SPFx Development</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--DisabledGrey)] hover:text-[var(--TextBlack)] transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        {/* Body */}
        <div className="modal-body bg-[var(--LightBgGrey)]">
          <div className="bg-white rounded-lg shadow-sm border border-[var(--BorderGrey)] overflow-hidden">
            <div className="p-8 space-y-8">
              <div>
                <h2 className="text-[var(--popupTitle)] font-semibold text-[var(--SiteBlue)]">Create Sprint</h2>
                <p className="text-[var(--DisabledGrey)] text-sm mt-1">
                  Define a new sprint for your project.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--DisabledGrey)] uppercase tracking-wider">Title</label>
                  <input type="text" className="w-full" placeholder="Enter sprint title..." />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-1 text-sm font-medium text-[var(--DisabledGrey)] uppercase tracking-wider">
                    Portfolios <Info size={14} className="text-[var(--SiteBlue)]" />
                  </label>
                  <div className="relative">
                    <input type="text" className="w-full pr-10" placeholder="Search and select portfolios..." />
                    <Edit2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--SiteBlue)] cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="modal-footer">
          <button className="btn-primary px-8" style={{ borderRadius: '2px' }}>Create</button>
          <button className="btn-default px-8" style={{ borderRadius: '2px' }} onClick={onClose}>Cancel</button>
        </footer>
      </div>
    </div>
  );
}
