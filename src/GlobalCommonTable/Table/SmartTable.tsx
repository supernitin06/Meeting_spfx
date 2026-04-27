
import React, { useState, useMemo } from 'react';
import { TableToolbar } from './Toolbar';
import { DataTable } from './DataTable';
import { ColumnSetting, TableSettings } from './TableTypes';
import SmartTableModal from './SmartTableModal';
import DefaultSettingsModal from './DefaultSettingsModal';
import AdvancedSearchModal from './AdvancedSearchModal';

interface SmartTableProps<T> {
  data: T[];
  columns: ColumnSetting[];
  tableSettings: TableSettings;
  onSettingsChange: (settings: TableSettings) => void;
  defaultSettings: TableSettings;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  searchType: 'All Words' | 'Any Words' | 'Exact Phrase';
  onSearchTypeChange: (type: 'All Words' | 'Any Words' | 'Exact Phrase') => void;
  searchFields: string[];
  onSearchFieldsChange: (fields: string[]) => void;
  searchFieldOptions: string[];
  sortKey: string | null;
  sortDirection: 'asc' | 'desc' | null;
  onSort: (key: string) => void;
  filters: Record<string, string>;
  onFilterChange: (key: string, val: string) => void;
  renderCell: (item: T, column: ColumnSetting) => React.ReactNode;
  onIconClick: (id: string) => void;
  toolbarActions?: React.ReactNode;
  viewportHeight: number;
  onEditClick?: (item: T) => void;
}

export function SmartTable<T extends { id: string }>(props: SmartTableProps<T>) {
  const [showSettings, setShowSettings] = useState(false);
  const [showDefaultSettings, setShowDefaultSettings] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  const visibleColumns = useMemo(() => 
    props.columns
      .filter(c => c.visible)
      .sort((a, b) => a.order - b.order), 
  [props.columns]);

  const effectiveViewportHeight = props.tableSettings.tableHeight === 'Fixed' 
    ? 500 
    : props.viewportHeight;

  return (
    <div className={`smart-table-wrapper h-full flex flex-col ${!props.tableSettings.showHeader ? 'no-header' : ''}`}>
      {props.tableSettings.showHeader && (
        <TableToolbar
          totalCount={props.data.length}
          showingCount={props.data.length}
          searchQuery={props.searchQuery}
          onSearchChange={props.onSearchChange}
          searchType={props.searchType}
          onSearchTypeChange={props.onSearchTypeChange}
          onAdvancedSearchClick={() => setShowAdvancedSearch(true)}
          onSettingsClick={() => setShowSettings(true)}
          onIconClick={props.onIconClick}
          visibleIcons={props.tableSettings.visibleIcons}
          actions={props.toolbarActions}
        />
      )}
      <DataTable
        data={props.data}
        columns={visibleColumns}
        selectedIds={props.selectedIds}
        onToggleSelect={props.onToggleSelect}
        onToggleSelectAll={props.onToggleSelectAll}
        isAllSelected={props.isAllSelected}
        sortKey={props.sortKey}
        sortDirection={props.sortDirection}
        onSort={props.onSort}
        filters={props.tableSettings.showColumnFilter ? props.filters : {}}
        onFilterChange={props.onFilterChange}
        renderCell={props.renderCell}
        viewportHeight={effectiveViewportHeight}
        onEditClick={props.onEditClick}
      />

      {/* Internal Modals */}
      <SmartTableModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={props.tableSettings}
        defaultSettings={props.defaultSettings}
        onOpenDefault={() => {
          // We no longer call setShowSettings(false) here.
          // This allows the Default Settings modal (zIndex 1200) to open on top of the SmartTable Settings modal (zIndex 1100).
          setShowDefaultSettings(true);
        }}
        onApply={(s) => {
          props.onSettingsChange(s);
          setShowSettings(false);
        }}
      />

      <DefaultSettingsModal
        isOpen={showDefaultSettings}
        onClose={() => setShowDefaultSettings(false)}
        settings={props.tableSettings}
        defaultSettings={props.defaultSettings}
        onApply={(s) => {
          props.onSettingsChange(s);
          setShowDefaultSettings(false);
        }}
      />

      <AdvancedSearchModal
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        fields={props.searchFieldOptions}
        selectedFields={props.searchFields}
        onApply={(f) => {
          props.onSearchFieldsChange(f);
          setShowAdvancedSearch(false);
        }}
      />

      <style>{`
        .no-header .table-wrapper { border-top: 1px solid #d1d5db; border-radius: 4px; }
      `}</style>
    </div>
  );
}
