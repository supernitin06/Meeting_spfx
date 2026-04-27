
export interface ColumnSetting {
  id: string;
  key: string;
  label: string;
  visible: boolean;
  width: number;
  order: number;
}

export interface TableSettings {
  showHeader: boolean;
  showColumnFilter: boolean;
  showAdvancedSearch: boolean;
  tableHeight: 'Flexible' | 'Fixed';
  columns: ColumnSetting[];
  visibleIcons: string[];
}
export enum ModalType {
  NONE = 'NONE',
  CREATE = 'CREATE',
  EDIT = 'EDIT',
  PROFILE = 'PROFILE',
  BULK_EMAIL = 'BULK_EMAIL',
  ADD_LOCAL_DB = 'ADD_LOCAL_DB',
  CREATE_INSTITUTION = 'CREATE_INSTITUTION',
  EDIT_INSTITUTION = 'EDIT_INSTITUTION',
  INSTITUTION_PROFILE = 'INSTITUTION_PROFILE',
  TAG_INSTITUTION = 'TAG_INSTITUTION',
  SMART_TABLE_SETTINGS = 'SMART_TABLE_SETTINGS',
  SMART_TABLE_DEFAULT_SETTINGS = 'SMART_TABLE_DEFAULT_SETTINGS',
  ADVANCED_SEARCH = 'ADVANCED_SEARCH'
}