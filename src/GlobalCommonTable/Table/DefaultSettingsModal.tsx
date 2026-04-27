
import React, { useState, useEffect } from 'react';
import Modal from './CentralizedModal';
import { TableSettings, ColumnSetting } from './TableTypes';

interface DefaultSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TableSettings;
  defaultSettings: TableSettings;
  onApply: (settings: TableSettings) => void;
}

const AVAILABLE_ICONS = [
  { id: 'teams', icon: 'bi-microsoft-teams' },
  { id: 'import', icon: 'bi-box-arrow-in-right' },
  { id: 'excel', icon: 'bi-file-earmark-excel' },
  { id: 'print', icon: 'bi-printer' },
  { id: 'expand', icon: 'bi-arrows-angle-expand' },
  { id: 'pencil', icon: 'bi-pencil' },
  { id: 'sort', icon: 'bi-arrow-down-up' }
];

const DefaultSettingsModal: React.FC<DefaultSettingsModalProps> = ({ isOpen, onClose, settings, defaultSettings, onApply }) => {
  const [localSettings, setLocalSettings] = useState<TableSettings>(JSON.parse(JSON.stringify(defaultSettings)));
  const [overrideType, setOverrideType] = useState<'custom' | 'dont'>('dont');

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(JSON.parse(JSON.stringify(defaultSettings)));
      setOverrideType('dont');
    }
  }, [isOpen, defaultSettings]);

  const handleToggleColumn = (id: string) => {
    setLocalSettings(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.id === id ? { ...col, visible: !col.visible } : col
      )
    }));
  };

  const handleToggleIcon = (iconId: string) => {
    setLocalSettings(prev => {
      const isVisible = prev.visibleIcons.includes(iconId);
      const nextIcons = isVisible 
        ? prev.visibleIcons.filter(i => i !== iconId) 
        : [...prev.visibleIcons, iconId];
      return { ...prev, visibleIcons: nextIcons };
    });
  };

  const handleWidthChange = (id: string, width: number) => {
    setLocalSettings(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.id === id ? { ...col, width } : col
      )
    }));
  };

  const footer = (
    <div className="flex justify-end gap-2 w-full p-2 bg-transparent">
      <button 
        className="btn-primary" 
        onClick={() => onApply(localSettings)}
      >
        Apply
      </button>
      <button 
        className="btn-default" 
        onClick={onClose}
      >
        Cancel
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contact Database - SmartTable Settings" size="xl" footer={footer} zIndex={1200}>
      <div className="smart-settings-container px-1">
        <div className="flex justify-between items-center mb-6">
          <h3 className="m-0 text-[#333333] font-normal text-xl">
            Default Settings
          </h3>
          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-2 mb-0">
              <input 
                type="radio" 
                name="overrideRD" 
                id="customORD" 
                checked={overrideType === 'custom'} 
                onChange={() => setOverrideType('custom')} 
              />
              <label className="ml-2 text-sm text-[#333333] mb-0 cursor-pointer" htmlFor="customORD">
                Customized settings to override
              </label>
            </div>
            <div className="flex items-center gap-2 mb-0">
              <input 
                type="radio" 
                name="overrideRD" 
                id="dontORD" 
                checked={overrideType === 'dont'} 
                onChange={() => setOverrideType('dont')} 
              />
              <label className="ml-2 text-sm text-[#333333] mb-0 cursor-pointer" htmlFor="dontORD">
                Don't override
              </label>
            </div>
          </div>
        </div>

        <div className="border border-[#DDDDDD] rounded-none bg-white overflow-hidden mb-6">
          <div className="flex flex-wrap -mx-2 m-0 p-0 border-b border-[#DDDDDD] font-bold text-sm bg-white">
            <div className="w-7/12 px-2 pl-4 py-2 text-[#333333]">Table Header</div>
            <div className="w-2/12 px-2 pl-4 py-2 text-[#333333]">Table Height</div>
            <div className="w-3/12 px-2 pl-4 py-2 text-[#333333]">Table Header Icons</div>
          </div>
          <div className="flex flex-wrap -mx-2 m-0 p-0 items-center">
            <div className="w-7/12 px-2 flex gap-8 pl-4 py-3">
              <div className="flex items-center gap-1 mb-0">
                <input type="checkbox" checked={localSettings.showHeader} onChange={() => setLocalSettings({...localSettings, showHeader: !localSettings.showHeader})} id="showHeaderD" />
                <label className="ml-2 text-sm text-[#333333] mb-0 cursor-pointer" htmlFor="showHeaderD">Show Header <i className="bi bi-info-circle text-sm opacity-50"></i></label>
              </div>
              <div className="flex items-center gap-1 mb-0">
                <input type="checkbox" checked={localSettings.showColumnFilter} onChange={() => setLocalSettings({...localSettings, showColumnFilter: !localSettings.showColumnFilter})} id="showFilterD" />
                <label className="ml-2 text-sm text-[#333333] mb-0 cursor-pointer" htmlFor="showFilterD">Show Column Filter</label>
              </div>
              <div className="flex items-center gap-1 mb-0">
                <input type="checkbox" checked={localSettings.showAdvancedSearch} onChange={() => setLocalSettings({...localSettings, showAdvancedSearch: !localSettings.showAdvancedSearch})} id="showSearchD" />
                <label className="ml-2 text-sm text-[#333333] mb-0 cursor-pointer" htmlFor="showSearchD">Show Advanced Search</label>
              </div>
            </div>
            <div className="w-2/12 px-2 flex pl-4 gap-6 py-3">
              <div className="flex items-center gap-1 mb-0">
                <input type="radio" name="heightModeD" checked={localSettings.tableHeight === 'Flexible'} onChange={() => setLocalSettings({...localSettings, tableHeight: 'Flexible'})} id="heightFlexD" />
                <label className="ml-2 text-sm text-[#333333] mb-0 cursor-pointer" htmlFor="heightFlexD">Flexible</label>
              </div>
              <div className="flex items-center gap-1 mb-0">
                <input type="radio" name="heightModeD" checked={localSettings.tableHeight === 'Fixed'} onChange={() => setLocalSettings({...localSettings, tableHeight: 'Fixed'})} id="heightFixedD" />
                <label className="ml-2 text-sm text-[#333333] mb-0 cursor-pointer" htmlFor="heightFixedD">Fixed</label>
              </div>
            </div>
            <div className="w-3/12 px-2 flex pl-4 py-3">
              <div className="flex border border-[#DDDDDD] rounded-sm bg-white overflow-hidden shadow-sm">
                {AVAILABLE_ICONS.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className={`p-1 flex items-center justify-center cursor-pointer w-[30px] h-[26px] ${idx !== AVAILABLE_ICONS.length - 1 ? 'border-r border-[#DDDDDD]' : ''} ${localSettings.visibleIcons.includes(item.id) ? 'bg-[#F0F0F0]' : 'bg-white'}`} 
                    onClick={() => handleToggleIcon(item.id)} 
                  >
                    <i className={`bi ${item.icon} text-sm ${localSettings.visibleIcons.includes(item.id) ? 'text-[#2F5596]' : 'text-[#333333]'}`}></i>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-[#333333] mb-2 font-normal text-lg">Column Settings</h3>

        <div className="border border-[#DDDDDD] rounded-none bg-white mb-2">
          <table className="w-full text-left border-collapse text-sm mb-0 align-middle table-fixed">
            <thead>
              <tr className="text-[#333333] border-b border-[#DDDDDD]">
                <th className="pl-4 py-2 font-bold w-[40%] text-[13.6px]">
                   Columns 
                   <div className="relative inline-block group">
                     <i className="bi bi-info-circle text-sm opacity-50 ml-1 cursor-pointer"></i>
                     <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-[10px] hidden group-hover:block w-64 px-3 py-2 bg-white border border-[#DDDDDD] shadow-md text-xs text-[#333333] rounded-sm z-[9999] font-normal whitespace-normal text-left">
                       Default settings are stored in centralized database the changes done here will be only for current user on this table it will not impact anyone else. For centralized changes suggestions contact admin.
                       <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-[10px] h-[10px] bg-white border-b border-r border-[#DDDDDD] rotate-45"></div>
                     </div>
                   </div>
                </th>
                <th className="text-center py-2 font-bold w-[30%] text-[13.6px]">
                   Column Width 
                   <div className="relative inline-block group">
                     <i className="bi bi-info-circle text-sm opacity-50 ml-1 cursor-pointer"></i>
                     <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-[10px] hidden group-hover:block w-64 px-3 py-2 bg-white border border-[#DDDDDD] shadow-md text-xs text-[#333333] rounded-sm z-[9999] font-normal whitespace-normal text-left">
                       Enter the column width of the particular item. Note: the width of some items can’t be changed (those items has grey background).
                       <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-[10px] h-[10px] bg-white border-b border-r border-[#DDDDDD] rotate-45"></div>
                     </div>
                   </div>
                </th>
                <th className="text-center py-2 font-bold w-[30%] text-[13.6px]">
                    Column Ordering 
                    <div className="relative inline-block group">
                      <i className="bi bi-info-circle text-sm opacity-50 ml-1 cursor-pointer"></i>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-[10px] hidden group-hover:block w-56 px-3 py-2 bg-white border border-[#DDDDDD] shadow-md text-xs text-[#333333] rounded-sm z-[9999] font-normal whitespace-normal text-left">
                        To change the column order drag and drop the items.
                        <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-[10px] h-[10px] bg-white border-b border-r border-[#DDDDDD] rotate-45"></div>
                      </div>
                    </div>
                    <div className="inline-flex flex-col items-center ml-2 text-[10px] align-middle leading-[0.6]">
                        <i className="bi bi-chevron-up text-[#918D8D]"></i>
                        <i className="bi bi-chevron-down text-[#918D8D]"></i>
                    </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {localSettings.columns.sort((a,b) => a.order - b.order).map((col) => (
                <tr key={col.id} className="border-b border-[#F0F0F0]">
                  <td className="pl-4 py-2">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={col.visible} onChange={() => handleToggleColumn(col.id)} id={`col-${col.id}`} />
                        <label className="text-sm text-[#333333] mb-0 cursor-pointer" htmlFor={`col-${col.id}`}>{col.label} <i className="bi bi-pencil text-sm text-[#2F5596] ml-2 cursor-pointer opacity-75 text-[12px]"></i></label>
                    </div>
                  </td>
                  <td className="py-2">
                    <div className="flex justify-center px-6">
                      <input 
                        type="number" 
                        className="form-input w-[90px] h-7 text-center text-xs border border-[#CCCCCC] rounded-sm" 
                        value={col.width} 
                        onChange={(e) => handleWidthChange(col.id, parseInt(e.target.value) || 0)} 
                      />
                    </div>
                  </td>
                  <td className="py-2 text-center">
                    <span className="text-sm text-[#918D8D]">{col.order}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

export default DefaultSettingsModal;
